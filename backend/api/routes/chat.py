import json
import uuid
import asyncio
from fastapi import APIRouter, Request, Depends
from sse_starlette.sse import EventSourceResponse
from sqlalchemy.orm import Session

from backend.core.database import get_db
from backend.models.schema import ChatSession, ChatMessage, ChatRole
from backend.services.simulation_service import run_agent_simulation, cleanup_stream, active_streams

router = APIRouter(prefix="/api/projects", tags=["chat"])

@router.post("/analyze")
async def analyze_project(request: Request, db: Session = Depends(get_db)):
    data = await request.json()
    brief = data.get("brief", "")
    session_id = data.get("session_id")
    
    # 1. Pastikan ChatSession ada, jika belum buat baru
    if not session_id:
        session_id = str(uuid.uuid4())
        new_session = ChatSession(id=session_id, title=brief[:30] + "...")
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
    return [{"id": s.id, "title": s.title} for s in sessions]

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
