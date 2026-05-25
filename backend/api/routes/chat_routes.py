import json
import uuid
import asyncio
from fastapi import APIRouter, Request, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from fastapi.responses import StreamingResponse, JSONResponse
from sse_starlette.sse import EventSourceResponse
from sqlalchemy.orm import Session
import io

from backend.core.database import get_db
from backend.models.schema import ChatSession, ChatMessage, ChatRole, Order as DBOrder
from backend.services.simulation_service import run_agent_simulation, cleanup_stream, active_streams
from backend.services.pdf_service import generate_estimation_pdf
from backend.services import chat_service

router = APIRouter(prefix="/api/projects", tags=["chat"])

@router.post("/analyze")
async def analyze_project(request: Request, db: Session = Depends(get_db)):
    payload = await request.json()
    brief = payload.get("brief", "").strip()
    user_id = payload.get("user_id", "anonymous")
    session_id = payload.get("session_id")
    
    if not brief:
        raise HTTPException(status_code=400, detail="Brief is empty")

    history_summary = ""
    if not session_id:
        session_id = str(uuid.uuid4())
        title = chat_service.generate_session_title(brief)
        db_session = ChatSession(id=session_id, user_id=user_id, title=title)
        db.add(db_session)
        db.commit()
    else:
        existing_session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
        if existing_session:
            if existing_session.summary:
                history_summary = existing_session.summary
        else:
            title = chat_service.generate_session_title(brief)
            db_session = ChatSession(id=session_id, user_id=user_id, title=title)
            db.add(db_session)
            db.commit()

    user_msg = ChatMessage(id=str(uuid.uuid4()), session_id=session_id, role=ChatRole.user, content=brief)
    db.add(user_msg)
    db.commit()

    active_streams[session_id] = {"status": "processing", "logs": []}
    asyncio.create_task(run_agent_simulation(brief, session_id, history_summary))

    return {"status": "started", "session_id": session_id}

@router.get("/{session_id}/stream")
async def stream_analysis(session_id: str, request: Request):
    async def event_generator():
        last_idx = 0
        state = active_streams.get(session_id)

        if not state:
            yield json.dumps({
                "event": "error",
                "message": "Sesi tidak ditemukan atau sudah ditutup.",
            })
            return

        while True:
            if await request.is_disconnected():
                break

            if last_idx < len(state["logs"]):
                log = state["logs"][last_idx]
                last_idx += 1
                yield json.dumps(log)

            if state["status"] == "completed" and last_idx >= len(state["logs"]):
                asyncio.create_task(cleanup_stream(session_id))
                break

            await asyncio.sleep(0.5)

    return EventSourceResponse(event_generator())

@router.get("/sessions")
def get_sessions(user_id: str = None, db: Session = Depends(get_db)):
    return chat_service.get_all_sessions(db, user_id)

@router.get("/sessions/{session_id}/messages")
def get_messages(session_id: str, db: Session = Depends(get_db)):
    return chat_service.get_session_messages(db, session_id)

@router.get("/{session_id}/generate-pdf")
def generate_pdf_endpoint(session_id: str, db: Session = Depends(get_db)):
    return chat_service.generate_pdf_service(session_id, db)

@router.get("/kpi/summary")
def get_kpi_summary(db: Session = Depends(get_db)):
    return chat_service.get_kpi_summary_data(db)

@router.get("/dashboard/summary")
def get_dashboard_summary(db: Session = Depends(get_db)):
    return chat_service.get_dashboard_summary(db)

@router.get("/products")
def get_products(db: Session = Depends(get_db)):
    return chat_service.get_all_products(db)

class OrderItemInput(BaseModel):
    product_sku: str
    qty: float
    price: float
    total: float

class OrderInput(BaseModel):
    session_id: Optional[str] = None
    user_id: str
    client_name: Optional[str] = None
    client_role: Optional[str] = None
    materials_total: float
    shipping_cost: float
    total_invoice: float
    truck_type: str
    delivery_date: str
    distance_km: Optional[float] = None
    notes: Optional[str] = None
    items: List[OrderItemInput]

@router.post("/orders")
def create_order(payload: OrderInput, db: Session = Depends(get_db)):
    order_id = chat_service.save_order(db, payload)
    return {"status": "success", "order_id": order_id}

@router.get("/orders/{order_id}")
def get_order(order_id: str, db: Session = Depends(get_db)):
    order = db.query(DBOrder).filter(DBOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order tidak ditemukan")
    return {
        "id": order.id,
        "session_id": order.session_id,
        "user_id": order.user_id,
        "client_name": order.client_name,
        "client_role": order.client_role,
        "materials_total": order.materials_total,
        "shipping_cost": order.shipping_cost,
        "total_invoice": order.total_invoice,
        "truck_type": order.truck_type,
        "delivery_date": order.delivery_date,
        "distance_km": order.distance_km,
        "notes": order.notes,
        "payment_status": order.payment_status or "pending",
        "items": [
            {
                "sku": item.product_sku,
                "name": item.product.name if item.product else "Material QHome",
                "price": item.price,
                "qty": item.qty,
                "total": item.total,
                "category": item.product.category if item.product else "Lainnya"
            }
            for item in order.items
        ]
    }

class RestockPayload(BaseModel):
    added_qty: int = 50

@router.post("/products/{sku}/restock")
def restock_product(sku: str, payload: RestockPayload, db: Session = Depends(get_db)):
    p = chat_service.restock_product_db(db, sku, payload.added_qty)
    if not p:
        return JSONResponse(status_code=404, content={"error": "Produk tidak ditemukan"})
    return {"status": "success", "sku": sku, "new_stock": p.stock_qty}

class UpdateProductsPayload(BaseModel):
    products: List[dict]

@router.put("/sessions/{session_id}/products")
def update_session_products(session_id: str, payload: UpdateProductsPayload, db: Session = Depends(get_db)):
    success = chat_service.update_session_products_db(db, session_id, payload.products)
    if not success:
        return JSONResponse(status_code=404, content={"error": "Pesan system tidak ditemukan untuk sesi ini"})
    return {"status": "success", "products": payload.products}

class RestockRequestPayload(BaseModel):
    items: list
    products: list

@router.post("/sessions/{session_id}/request-restock")
def request_restock(session_id: str, payload: RestockRequestPayload, db: Session = Depends(get_db)):
    chat_service.request_restock_db(db, session_id, payload.products)
    return {"status": "success"}

class RestockCompletePayload(BaseModel):
    products: list

@router.post("/sessions/{session_id}/restock-complete")
def restock_complete(session_id: str, payload: RestockCompletePayload, db: Session = Depends(get_db)):
    chat_service.restock_complete_db(db, session_id, payload.products)
    return {"status": "success"}

class ConfirmPaymentPayload(BaseModel):
    session_id: str
    order_id: Optional[str] = None
    client_name: str
    total_invoice: float
    items_count: int

@router.post("/orders/{order_id}/confirm-payment")
def confirm_payment(order_id: str, payload: ConfirmPaymentPayload, db: Session = Depends(get_db)):
    payload.order_id = order_id
    chat_service.confirm_payment_db(db, payload)
    return {"status": "confirmed", "order_id": order_id, "session_id": payload.session_id}

