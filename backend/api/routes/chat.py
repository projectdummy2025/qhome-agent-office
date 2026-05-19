import json
import uuid
import asyncio
from fastapi import APIRouter, Request, Depends
from fastapi.responses import StreamingResponse
from sse_starlette.sse import EventSourceResponse
from sqlalchemy.orm import Session
import io

from backend.core.database import get_db
from backend.models.schema import ChatSession, ChatMessage, ChatRole, EstimationKPI
from backend.services.simulation_service import run_agent_simulation, cleanup_stream, active_streams
from backend.services.pdf_service import generate_estimation_pdf

router = APIRouter(prefix="/api/projects", tags=["chat"])

def _generate_session_title(brief: str) -> str:
    """Generate a highly concise, professional title (3-5 words) in Indonesian for the session brief"""
    try:
        from backend.agents.supervisor import gemini_specialist, _llm_invoke_with_retry
        prompt = (
            f"Tulis HANYA judul singkat (maksimal 3-4 kata, bahasa Indonesia) yang paling menggambarkan proyek renovasi berikut: '{brief}'. "
            "Contoh output: 'Estimasi Granit Kamar Mandi', 'Fasad Panel WPC Outdoor', 'Pengecatan Tembok Rumah'. "
            "Jangan berikan tanda kutip, tanda baca, atau kalimat pengantar apapun, langsung judulnya."
        )
        response = _llm_invoke_with_retry(gemini_specialist, prompt)
        title = response.content.strip()
        
        # Bersihkan tag <think>...</think> jika bocor ke judul
        import re
        title = re.sub(r'<think>[\s\S]*?</think>', '', title, flags=re.IGNORECASE).strip()
        title = re.sub(r'<think>[\s\S]*', '', title, flags=re.IGNORECASE).strip()
        
        title = title.replace('"', '').replace("'", "").strip()
        return title[:50]
    except Exception:
        return brief[:30] + "..."

@router.post("/analyze")
async def analyze_project(request: Request, db: Session = Depends(get_db)):
    data = await request.json()
    brief = data.get("brief", "")
    session_id = data.get("session_id")
    
    # 1. Pastikan ChatSession ada, jika belum buat baru
    if not session_id:
        session_id = str(uuid.uuid4())
        title = _generate_session_title(brief)
        new_session = ChatSession(id=session_id, title=title)
        db.add(new_session)
        db.commit()
    
    # 2. Simpan pesan (prompt) User ke Database
    user_msg = ChatMessage(id=str(uuid.uuid4()), session_id=session_id, role=ChatRole.user, content=brief)
    db.add(user_msg)
    db.commit()

    # Siapkan variabel state in-memory untuk dikonsumsi oleh SSE Streamer
    active_streams[session_id] = {
        "status": "processing",
        "logs": []
    }
    
    # Jalankan simulasi agen di latar belakang
    asyncio.create_task(run_agent_simulation(brief, session_id))
    
    return {"status": "started", "session_id": session_id}

@router.get("/{session_id}/stream")
async def stream_logs(request: Request, session_id: str):
    async def event_generator():
        last_idx = 0
        state = active_streams.get(session_id)
        
        if not state:
            yield json.dumps({"event": "error", "message": "Sesi tidak ditemukan atau sudah ditutup."})
            return
            
        while True:
            if await request.is_disconnected():
                break
                
            if last_idx < len(state["logs"]):
                log = state["logs"][last_idx]
                last_idx += 1
                yield json.dumps(log)
                
            if state["status"] == "completed" and last_idx >= len(state["logs"]):
                # Jika sudah selesai, hapus dari memori RAM untuk efisiensi
                asyncio.create_task(cleanup_stream(session_id))
                break
                
            await asyncio.sleep(0.5)
            
    return EventSourceResponse(event_generator())

@router.get("/sessions")
def get_sessions(db: Session = Depends(get_db)):
    """Mendapatkan daftar seluruh riwayat proyek di sidebar"""
    sessions = db.query(ChatSession).order_by(ChatSession.created_at.desc()).all()
    result = []
    for s in sessions:
        # Cari pesan user pertama dari sesi ini untuk dijadikan brief lengkap
        first_user_msg = next((m.content for m in s.messages if m.role == ChatRole.user), None)
        result.append({
            "id": s.id,
            "title": s.title,
            "brief": first_user_msg or s.title
        })
    return result

@router.get("/sessions/{session_id}/messages")
def get_session_messages(session_id: str, db: Session = Depends(get_db)):
    """Mendapatkan seluruh pesan dan log agen dari sesi tertentu untuk ditampilkan ulang"""
    messages = db.query(ChatMessage).filter(ChatMessage.session_id == session_id).order_by(ChatMessage.created_at.asc()).all()
    
    result = []
    for msg in messages:
        # Konversi logs jika bertipe string (misal representasi SQLite JSON)
        logs = msg.agent_logs
        if isinstance(logs, str):
            try:
                logs = json.loads(logs)
            except:
                pass
                
        # Status selesai jika rolenya system
        status = 'completed' if msg.role == ChatRole.system else None
        
        # Ekstrak narasi akhir dan produk hasil kurasi dari event completed di dalam logs
        narrative = ""
        products = []
        if msg.role == ChatRole.system and logs:
            completed_log = next((l for l in logs if isinstance(l, dict) and l.get("event") == "completed"), None)
            if completed_log:
                narrative = completed_log.get("narrative", "")
                products = completed_log.get("products", [])
                
        result.append({
            "role": msg.role.value,
            "content": msg.content,
            "logs": logs or [],
            "status": status,
            "narrative": narrative,
            "products": products
        })
    return result


@router.get("/{session_id}/generate-pdf")
def generate_pdf(session_id: str, db: Session = Depends(get_db)):
    """
    P3 — PDF Estimasi Resmi: Generate dokumen PDF dari hasil estimasi sesi tertentu.
    Mengambil data dari log agen yang tersimpan di DB.
    """
    messages = db.query(ChatMessage).filter(
        ChatMessage.session_id == session_id
    ).order_by(ChatMessage.created_at.asc()).all()

    # Ambil brief dari pesan user pertama
    brief = ""
    narrative = "Tidak ada narasi tersedia."
    products = []
    disclaimer = ""
    generated_at = None

    for msg in messages:
        if msg.role == ChatRole.user and not brief:
            brief = msg.content or ""

        if msg.role == ChatRole.system and msg.agent_logs:
            logs = msg.agent_logs
            if isinstance(logs, str):
                try:
                    logs = json.loads(logs)
                except Exception:
                    logs = []
            completed_log = next(
                (l for l in logs if isinstance(l, dict) and l.get("event") == "completed"), None
            )
            if completed_log:
                narrative = completed_log.get("narrative", narrative)
                products = completed_log.get("products", products)
                disclaimer = completed_log.get("disclaimer", "")
                generated_at = completed_log.get("generated_at")

    if not brief:
        return {"error": "Sesi tidak ditemukan atau belum selesai diproses."}

    # Jika disclaimer kosong (sesi lama sebelum P6), pakai default
    if not disclaimer:
        from backend.agents.supervisor import DISCLAIMER_TEXT
        disclaimer = DISCLAIMER_TEXT

    pdf_bytes = generate_estimation_pdf(
        session_id=session_id,
        brief=brief,
        narrative=narrative,
        products=products,
        disclaimer=disclaimer,
        generated_at=generated_at,
    )

    # P6 — Update KPI: tandai pdf_generated = 1
    kpi = db.query(EstimationKPI).filter(
        EstimationKPI.session_id == session_id
    ).order_by(EstimationKPI.started_at.desc()).first()
    if kpi:
        kpi.pdf_generated = 1
        db.commit()

    filename = f"Estimasi_QHome_{session_id[:8].upper()}.pdf"
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/kpi/summary")
def get_kpi_summary(db: Session = Depends(get_db)):
    """
    P6 — KPI Dashboard: Ringkasan metrik performa estimasi.
    Menampilkan lead_time rata-rata, hit rate < 30 detik, dan statistik lain.
    """
    records = db.query(EstimationKPI).all()
    if not records:
        return {"total_estimations": 0, "message": "Belum ada data KPI."}

    lead_times = [r.lead_time_seconds for r in records if r.lead_time_seconds is not None]
    under_30 = [lt for lt in lead_times if lt < 30]

    return {
        "total_estimations": len(records),
        "avg_lead_time_seconds": round(sum(lead_times) / len(lead_times), 2) if lead_times else None,
        "min_lead_time_seconds": round(min(lead_times), 2) if lead_times else None,
        "max_lead_time_seconds": round(max(lead_times), 2) if lead_times else None,
        "under_30s_count": len(under_30),
        "under_30s_percent": round(len(under_30) / len(lead_times) * 100, 1) if lead_times else 0,
        "kpi_target_met": len(under_30s if (under_30s := under_30) else []) == len(lead_times),
        "total_pdf_generated": sum(r.pdf_generated for r in records),
        "avg_agents_per_session": round(sum(r.agent_count for r in records) / len(records), 1),
    }
