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
            f"Buat satu judul proyek singkat, padat, dan profesional (3-4 kata, bahasa Indonesia) untuk kebutuhan ini: '{brief}'. "
            "Contoh: 'Estimasi Granit Teras', 'Fasad Panel WPC', 'Pengecatan Ruang Tamu'. "
            "Keluarkan HANYA judul tersebut tanpa penjelasan atau kata pengantar apapun."
        )
        response = _llm_invoke_with_retry(gemini_specialist, prompt)
        title = response.content.strip()
        
        # Bersihkan tag <think>...</think> jika ada
        import re
        if "</think>" in title:
            title = re.sub(r'<think>[\s\S]*?</think>', '', title, flags=re.IGNORECASE).strip()
        else:
            parts = re.split(r'<think>', title, flags=re.IGNORECASE)
            if len(parts) > 1:
                title = parts[-1].strip()
        
        title = re.sub(r'<think>|<\/think>', '', title, flags=re.IGNORECASE).strip()
        title = title.replace('"', '').replace("'", "").strip()
        
        # Jika hasil pembersihan kosong, terlalu pendek, atau kotor, picu fallback deskriptif
        if not title or len(title) < 3 or "think" in title.lower():
            raise ValueError("Judul kosong atau terinfeksi tag")
            
        return title[:50]
    except Exception:
        import re
        # Filter kata umum agar fallback lebih bernilai arsitektural/sipil
        stop_words = {"kami", "saya", "ingin", "sedang", "tolong", "buatkan", "rencana", "estimasi", "butuh", "membutuhkan", "proyek", "adalah"}
        words = [w.capitalize() for w in re.sub(r'[^\w\s]', '', brief).split() if w and w.lower() not in stop_words]
        if not words:
            words = [w.capitalize() for w in re.sub(r'[^\w\s]', '', brief).split() if w]
        return "Estimasi " + " ".join(words[:3])

@router.post("/analyze")
async def analyze_project(request: Request, db: Session = Depends(get_db)):
    data = await request.json()
    brief = data.get("brief", "")
    session_id = data.get("session_id")
    user_id = data.get("user_id", "default-user")
    
    # 1. Pastikan ChatSession ada, jika belum buat baru
    if not session_id:
        session_id = str(uuid.uuid4())
        title = _generate_session_title(brief)
        new_session = ChatSession(id=session_id, title=title, user_id=user_id)
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
def get_sessions(user_id: str = None, db: Session = Depends(get_db)):
    """Mendapatkan daftar seluruh riwayat proyek di sidebar"""
    query = db.query(ChatSession)
    if user_id:
        query = query.filter(ChatSession.user_id == user_id)
    sessions = query.order_by(ChatSession.created_at.desc()).all()
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

@router.get("/products")
def get_products(db: Session = Depends(get_db)):
    """Mendapatkan daftar seluruh katalog produk material beserta gambar kustom"""
    from backend.models.schema import Product as DBProduct
    products = db.query(DBProduct).all()
    
    # Map category to matching high-quality curated image URLs
    category_images = {
        "granit": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=500&q=80",
        "keramik": "https://images.unsplash.com/photo-1502005229762-fc1b2b812ca5?auto=format&fit=crop&w=500&q=80",
        "wood": "https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=500&q=80",
        "panel": "https://images.unsplash.com/photo-1615876234886-fd9a39fda97f?auto=format&fit=crop&w=500&q=80",
        "cat": "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=500&q=80",
        "stone": "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=500&q=80",
        "semen": "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=500&q=80"
    }
    
    result = []
    for p in products:
        category_lower = p.category.lower() if p.category else ""
        
        # Cari pencocokan gambar terbaik berdasarkan kategori
        image_url = "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=500&q=80" # Fallback
        for cat_key, img_val in category_images.items():
            if cat_key in category_lower:
                image_url = img_val
                break
                
        result.append({
            "sku": p.sku,
            "name": p.name,
            "category": p.category,
            "base_price": p.base_price,
            "coverage_m2": p.coverage_m2,
            "stock_qty": p.stock_qty,
            "image_url": image_url
        })
    return result

from pydantic import BaseModel
from typing import List, Optional

class OrderItemInput(BaseModel):
    product_sku: str
    qty: float
    price: float
    total: float

class OrderInput(BaseModel):
    session_id: Optional[str] = None
    user_id: str
    materials_total: float
    shipping_cost: float
    total_invoice: float
    truck_type: str
    delivery_date: str
    notes: Optional[str] = None
    items: List[OrderItemInput]

@router.post("/orders")
def create_order(payload: OrderInput, db: Session = Depends(get_db)):
    """Menyimpan order logistik ke database secara ternormalisasi (3NF)"""
    import uuid
    from backend.models.schema import Order as DBOrder, OrderItem as DBOrderItem
    
    order_id = f"ORD-{uuid.uuid4().hex[:8].upper()}"
    new_order = DBOrder(
        id=order_id,
        session_id=payload.session_id,
        user_id=payload.user_id,
        materials_total=payload.materials_total,
        shipping_cost=payload.shipping_cost,
        total_invoice=payload.total_invoice,
        truck_type=payload.truck_type,
        delivery_date=payload.delivery_date,
        notes=payload.notes
    )
    db.add(new_order)
    
    for item in payload.items:
        item_id = f"ORI-{uuid.uuid4().hex[:8].upper()}"
        new_item = DBOrderItem(
            id=item_id,
            order_id=order_id,
            product_sku=item.product_sku,
            qty=item.qty,
            price=item.price,
            total=item.total
        )
        db.add(new_item)
        
    db.commit()
    return {"status": "success", "order_id": order_id}
