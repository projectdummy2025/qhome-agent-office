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
from backend.services.simulation_service import (
    run_agent_simulation,
    cleanup_stream,
    active_streams,
)
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
            title = re.sub(
                r"<think>[\s\S]*?</think>", "", title, flags=re.IGNORECASE
            ).strip()
        else:
            parts = re.split(r"<think>", title, flags=re.IGNORECASE)
            if len(parts) > 1:
                title = parts[-1].strip()

        title = re.sub(r"<think>|<\/think>", "", title, flags=re.IGNORECASE).strip()
        title = title.replace('"', "").replace("'", "").strip()

        # Jika hasil pembersihan kosong, terlalu pendek, atau kotor, picu fallback deskriptif
        if not title or len(title) < 3 or "think" in title.lower():
            raise ValueError("Judul kosong atau terinfeksi tag")

        return title[:50]
    except Exception:
        import re

        # Filter kata umum agar fallback lebih bernilai arsitektural/sipil
        stop_words = {
            "kami",
            "saya",
            "ingin",
            "sedang",
            "tolong",
            "buatkan",
            "rencana",
            "estimasi",
            "butuh",
            "membutuhkan",
            "proyek",
            "adalah",
        }
        words = [
            w.capitalize()
            for w in re.sub(r"[^\w\s]", "", brief).split()
            if w and w.lower() not in stop_words
        ]
        if not words:
            words = [w.capitalize() for w in re.sub(r"[^\w\s]", "", brief).split() if w]
        return "Estimasi " + " ".join(words[:3])


def _generate_project_summary(brief: str, narrative: str) -> str:
    """Generate direct project summary from available brief and final narrative."""
    if not brief:
        return ""

    try:
        from backend.agents.supervisor import gemini_specialist, _llm_invoke_with_retry

        prompt = (
            "Anda adalah asisten AI yang membuat ringkasan proyek profesional QHome-MAS dari data proyek. "
            "Buat ringkasan proyek singkat dan jelas (1-3 kalimat) dalam bahasa Indonesia, tanpa salam, "
            "berdasarkan input berikut:\n\n"
            f"Brief atau permintaan: {brief}\n\n"
            f"Narasi akhir agen: {narrative or 'Tidak ada narasi akhir yang tersedia.'}\n\n"
            "Output hanya ringkasan proyek, tanpa penjelasan tambahan."
        )
        response = _llm_invoke_with_retry(gemini_specialist, prompt)
        project_summary = str(response.content).strip()
        import re
        project_summary = re.sub(r"<think>[\s\S]*?</think>", "", project_summary, flags=re.IGNORECASE).strip()
        project_summary = re.sub(r"<think>|</think>", "", project_summary, flags=re.IGNORECASE).strip()
        if project_summary:
            return project_summary
    except Exception:
        pass

    return brief


@router.post("/analyze")
async def analyze_project(request: Request, db: Session = Depends(get_db)):
    data = await request.json()
    brief = data.get("brief", "")
    session_id = data.get("session_id")
    user_id = data.get("user_id", "default-user")

    # 1. Pastikan ChatSession ada, jika belum buat baru
    history_summary = ""
    if not session_id:
        session_id = str(uuid.uuid4())
        title = _generate_session_title(brief)
        new_session = ChatSession(id=session_id, title=title, user_id=user_id)
        db.add(new_session)
        db.commit()
    else:
        # Ambil summary sebelumnya jika session sudah ada
        existing_session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
        if existing_session:
            if existing_session.summary:
                history_summary = existing_session.summary
        else:
            # Jika session_id dikirim oleh frontend tapi tidak ditemukan di DB (misal karena DB di-reset),
            # buat session baru dengan ID tersebut agar tidak memicu ForeignKeyViolation
            title = _generate_session_title(brief)
            new_session = ChatSession(id=session_id, title=title, user_id=user_id)
            db.add(new_session)
            db.commit()

    # 2. Simpan pesan (prompt) User ke Database
    user_msg = ChatMessage(
        id=str(uuid.uuid4()), session_id=session_id, role=ChatRole.user, content=brief
    )
    db.add(user_msg)
    db.commit()

    # Siapkan variabel state in-memory untuk dikonsumsi oleh SSE Streamer
    active_streams[session_id] = {"status": "processing", "logs": []}

    # Jalankan simulasi agen di latar belakang
    asyncio.create_task(run_agent_simulation(brief, session_id, history_summary))

    return {"status": "started", "session_id": session_id}


@router.get("/{session_id}/stream")
async def stream_logs(request: Request, session_id: str):
    async def event_generator():
        last_idx = 0
        state = active_streams.get(session_id)

        if not state:
            yield json.dumps(
                {
                    "event": "error",
                    "message": "Sesi tidak ditemukan atau sudah ditutup.",
                }
            )
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
        first_user_msg = next(
            (m.content for m in s.messages if m.role == ChatRole.user), None
        )
        result.append(
            {"id": s.id, "title": s.title, "brief": first_user_msg or s.title}
        )
    return result


@router.get("/sessions/{session_id}/messages")
def get_session_messages(session_id: str, db: Session = Depends(get_db)):
    """Mendapatkan seluruh pesan dan log agen dari sesi tertentu untuk ditampilkan ulang"""
    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )

    result = []
    for msg in messages:
        logs = msg.agent_logs or []

        # Status selesai jika rolenya system
        status = "completed" if msg.role == ChatRole.system else None

        # Ekstrak narasi akhir dan produk hasil kurasi dari event completed di dalam logs
        narrative = ""
        products = []
        if msg.role == ChatRole.system and logs:
            completed_log = next(
                (
                    l
                    for l in logs
                    if isinstance(l, dict) and l.get("event") == "completed"
                ),
                None,
            )
            if completed_log:
                narrative = completed_log.get("narrative", "")
                products = completed_log.get("products", [])

        result.append(
            {
                "role": msg.role.value,
                "content": msg.content,
                "logs": logs or [],
                "status": status,
                "narrative": narrative,
                "products": products,
            }
        )
    return result


@router.get("/{session_id}/generate-pdf")
def generate_pdf(session_id: str, db: Session = Depends(get_db)):
    """
    P3 — PDF Estimasi Resmi / Nota B2B: Generate dokumen PDF dari hasil estimasi atau order sesi tertentu.
    Mengambil data dari log agen yang tersimpan di DB atau rincian transaksi Order B2B jika ada.
    """
    from backend.models.schema import Order as DBOrder

    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )

    # Ambil brief dari pesan user pertama
    brief = ""
    narrative = "Tidak ada narasi tersedia."
    products = []
    disclaimer = ""
    generated_at = None

    session_record = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    session_summary = session_record.summary if session_record else None

    for msg in messages:
        if msg.role == ChatRole.user and not brief:
            brief = msg.content or ""

        if msg.role == ChatRole.system and msg.agent_logs:
            logs = msg.agent_logs or []
            completed_log = next(
                (
                    l
                    for l in logs
                    if isinstance(l, dict) and l.get("event") == "completed"
                ),
                None,
            )
            if completed_log:
                narrative = completed_log.get("narrative", narrative)
                products = completed_log.get("products", products)
                disclaimer = completed_log.get("disclaimer", "")
                generated_at = completed_log.get("generated_at")

    if session_summary:
        brief = session_summary
    elif brief and narrative:
        project_summary = _generate_project_summary(brief, narrative)
        if project_summary and project_summary != brief:
            brief = project_summary
            if session_record:
                session_record.summary = project_summary
                db.commit()

    if not brief:
        return {"error": "Sesi tidak ditemukan atau belum selesai diproses."}

    # Jika disclaimer kosong (sesi lama sebelum P6), pakai default
    if not disclaimer:
        from backend.agents.supervisor import DISCLAIMER_TEXT

        disclaimer = DISCLAIMER_TEXT

    # Cari apakah sudah ada Order B2B resmi untuk sesi ini
    order = (
        db.query(DBOrder)
        .filter(DBOrder.session_id == session_id)
        .order_by(DBOrder.created_at.desc())
        .first()
    )

    order_id = None
    client_name = None
    client_role = None
    materials_total = None
    shipping_cost = None
    total_invoice = None
    truck_type = None
    delivery_date = None
    distance_km = None
    notes = None

    if order:
        order_id = order.id
        materials_total = order.materials_total
        shipping_cost = order.shipping_cost
        total_invoice = order.total_invoice
        truck_type = order.truck_type
        delivery_date = order.delivery_date
        distance_km = order.distance_km
        notes = order.notes

        client_name = order.client_name or "Klien B2B"
        client_role = order.client_role or "Mitra Profesional"

        # Rekonstruksi daftar produk dari order_items aktual di DB
        if order.items:
            products = []
            for item in order.items:
                products.append(
                    {
                        "sku": item.product_sku,
                        "name": item.product.name if item.product else "Material QHome",
                        "price": item.price,
                        "qty": f"{int(item.qty)} unit"
                        if item.qty.is_integer()
                        else f"{item.qty} unit",
                        "total": item.total,
                    }
                )

    pdf_bytes = generate_estimation_pdf(
        session_id=session_id,
        brief=brief,
        narrative=narrative,
        products=products,
        disclaimer=disclaimer,
        generated_at=generated_at,
        order_id=order_id,
        client_name=client_name,
        client_role=client_role,
        materials_total=materials_total,
        shipping_cost=shipping_cost,
        total_invoice=total_invoice,
        truck_type=truck_type,
        delivery_date=delivery_date,
        distance_km=distance_km,
        notes=notes,
    )

    # P6 — Update KPI: tandai pdf_generated = 1
    kpi = (
        db.query(EstimationKPI)
        .filter(EstimationKPI.session_id == session_id)
        .order_by(EstimationKPI.started_at.desc())
        .first()
    )
    if kpi:
        kpi.pdf_generated = 1
        db.commit()

    filename_prefix = "Nota_B2B" if order_id is not None else "Estimasi_QHome"
    filename = f"{filename_prefix}_{session_id[:8].upper()}.pdf"
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

    lead_times = [
        r.lead_time_seconds for r in records if r.lead_time_seconds is not None
    ]
    under_30 = [lt for lt in lead_times if lt < 30]

    return {
        "total_estimations": len(records),
        "avg_lead_time_seconds": round(sum(lead_times) / len(lead_times), 2)
        if lead_times
        else None,
        "min_lead_time_seconds": round(min(lead_times), 2) if lead_times else None,
        "max_lead_time_seconds": round(max(lead_times), 2) if lead_times else None,
        "under_30s_count": len(under_30),
        "under_30s_percent": round(len(under_30) / len(lead_times) * 100, 1)
        if lead_times
        else 0,
        "kpi_target_met": len(under_30s if (under_30s := under_30) else [])
        == len(lead_times),
        "total_pdf_generated": sum(r.pdf_generated for r in records),
        "avg_agents_per_session": round(
            sum(r.agent_count for r in records) / len(records), 1
        ),
    }


@router.get("/products")
def get_products(db: Session = Depends(get_db)):
    """Mendapatkan daftar seluruh katalog produk material beserta gambar kustom"""
    from backend.models.schema import Product as DBProduct

    products = db.query(DBProduct).all()

    # Map category to matching high-quality curated image URLs
    # Map the new canonical categories to curated Unsplash images (professional, high-quality)
    category_images = {
        "building material": "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80",  # construction materials / site
        "floor": "https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=800&q=80",  # flooring / tiles
        "appliance & household": "https://images.unsplash.com/photo-1581579183596-327d1a0a7b3f?auto=format&fit=crop&w=800&q=80",  # household appliances
        "furniture": "https://images.unsplash.com/photo-1540574163026-643ea20ade25?auto=format&fit=crop&w=800&q=80",  # furniture interior
        "sanitary & plumbing": "https://images.unsplash.com/photo-1581579183605-1d3f1f3b9a80?auto=format&fit=crop&w=800&q=80",  # sanitary / plumbing fixtures
        "electrical & lighting": "https://images.unsplash.com/photo-1542224566-3b8e2e9c8b3b?auto=format&fit=crop&w=800&q=80",  # electrical / lighting
        "tools & machinery": "https://images.unsplash.com/photo-1532619675605-4f2f1a8a6f4b?auto=format&fit=crop&w=800&q=80",  # tools / machinery
    }

    result = []
    for p in products:
        category_lower = p.category.lower() if p.category else ""

        # Cari pencocokan gambar terbaik berdasarkan kategori
        image_url = "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=500&q=80"  # Fallback
        for cat_key, img_val in category_images.items():
            if cat_key in category_lower:
                image_url = img_val
                break

        result.append(
            {
                "sku": p.sku,
                "name": p.name,
                "category": p.category,
                "base_price": p.base_price,
                "coverage_m2": p.coverage_m2,
                "stock_qty": p.stock_qty,
                "image_url": image_url,
            }
        )
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
    """Menyimpan order logistik ke database secara ternormalisasi (3NF)"""
    import uuid
    from backend.models.schema import Order as DBOrder, OrderItem as DBOrderItem

    order_id = f"ORD-{uuid.uuid4().hex[:8].upper()}"
    new_order = DBOrder(
        id=order_id,
        session_id=payload.session_id,
        user_id=payload.user_id,
        client_name=payload.client_name,
        client_role=payload.client_role,
        materials_total=payload.materials_total,
        shipping_cost=payload.shipping_cost,
        total_invoice=payload.total_invoice,
        truck_type=payload.truck_type,
        delivery_date=payload.delivery_date,
        distance_km=payload.distance_km,
        notes=payload.notes,
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
            total=item.total,
        )
        db.add(new_item)

    db.commit()
    return {"status": "success", "order_id": order_id}


class RestockPayload(BaseModel):
    added_qty: int = 50


@router.post("/products/{sku}/restock")
def restock_product(sku: str, payload: RestockPayload, db: Session = Depends(get_db)):
    """Penyelamatan: Restok barang di gudang utama secara real-time"""
    from backend.models.schema import Product as DBProduct

    p = db.query(DBProduct).filter(DBProduct.sku == sku).first()
    if not p:
        return {"error": "Produk tidak ditemukan"}, 404
    p.stock_qty += payload.added_qty
    db.commit()
    return {"status": "success", "sku": sku, "new_stock": p.stock_qty}


class UpdateProductsPayload(BaseModel):
    products: List[dict]


@router.put("/sessions/{session_id}/products")
def update_session_products(
    session_id: str, payload: UpdateProductsPayload, db: Session = Depends(get_db)
):
    """Penyelamatan: Menyimpan daftar produk yang dimodifikasi admin kembali ke database"""
    from backend.models.schema import ChatMessage as DBMessage, ChatRole
    from sqlalchemy.orm.attributes import flag_modified

    msg = (
        db.query(DBMessage)
        .filter(DBMessage.session_id == session_id, DBMessage.role == ChatRole.system)
        .order_by(DBMessage.created_at.desc())
        .first()
    )

    if not msg:
        return {"error": "Pesan system tidak ditemukan untuk sesi ini"}, 404

    logs = msg.agent_logs or []

    updated = False
    new_logs = []
    for log in logs:
        if isinstance(log, dict):
            new_log = dict(log)
            if new_log.get("event") == "completed":
                new_log["products"] = payload.products
                updated = True
            new_logs.append(new_log)
        else:
            new_logs.append(log)

    if not updated:
        new_logs.append(
            {
                "event": "completed",
                "products": payload.products,
                "narrative": msg.content or "Material terkurasi oleh asisten B2B.",
            }
        )

    msg.agent_logs = new_logs
    flag_modified(msg, "agent_logs")
    db.commit()
    return {"status": "success", "products": payload.products}


class RestockRequestPayload(BaseModel):
    items: list
    products: list


@router.post("/sessions/{session_id}/request-restock")
def request_restock(session_id: str, payload: RestockRequestPayload, db: Session = Depends(get_db)):
    """Menyuntikkan pesan status yang rapi untuk klien ke sesi chat, sementara data mentah disalurkan langsung ke database/Admin Portal."""
    from backend.models.schema import ChatMessage as DBMessage, ChatRole
    from datetime import datetime
    import uuid

    # Laporan ramah klien (Customer-facing status)
    narrative = "Persetujuan sudah diterima, harap menunggu pesan."

    new_msg = DBMessage(
        id=str(uuid.uuid4()),
        session_id=session_id,
        role=ChatRole.system,
        content=narrative,
        created_at=datetime.utcnow(),
        agent_logs=[{
            "event": "completed",
            "title": "Inventory Administrator",
            "message": "Persetujuan draf diterima. Menunggu pembaruan stok admin.",
            "narrative": narrative,
            "products": payload.products
        }]
    )
    db.add(new_msg)
    db.commit()
    
    # Log teknis mentah tetap dicetak silent di terminal backend
    print(f"⚠️ [PERMINTAAN RESTOK SILENT] Sesi: {session_id} - Barang: {payload.items}")
    return {"status": "success"}


class ConfirmPaymentPayload(BaseModel):
    session_id: str
    order_id: str
    client_name: str
    total_invoice: float
    items_count: int


@router.post("/orders/{order_id}/confirm-payment")
def confirm_payment(order_id: str, payload: ConfirmPaymentPayload, db: Session = Depends(get_db)):
    """Dipanggil setelah user mengkonfirmasi pembayaran QRIS.
    Menyuntikkan dua pesan baru ke sesi chat:
    - role=user : konfirmasi dari klien
    - role=system : balasan otomatis agen bahwa pembayaran diterima & kargo diaktifkan.
    """
    from backend.models.schema import ChatMessage as DBMessage, ChatRole
    import json as _json
    from datetime import datetime

    confirmation_user_text = (
        f"Saya sudah menyelesaikan pembayaran QRIS untuk pesanan {order_id} "
        f"senilai Rp {payload.total_invoice:,.0f}. Mohon aktifkan kargo pengiriman."
    )

    agent_narrative = (
        f"**Pembayaran QRIS Diterima — Kargo Diaktifkan**\n\n"
        f"Terima kasih banyak, **{payload.client_name}**! 🙏 Kami sangat mengapresiasi kepercayaan dan kerja sama Anda dalam transaksi B2B ini.\n\n"
        f"Sistem kami telah berhasil memverifikasi pembayaran QRIS untuk pesanan **{order_id}** dengan rincian berikut:\n\n"
        f"- **Total Pembayaran:** Rp {payload.total_invoice:,.0f}\n"
        f"- **Jumlah Item:** {payload.items_count} jenis material bangunan\n"
        f"- **Status Pengiriman:** Kargo diaktifkan & dijadwalkan untuk dispatch segera\n\n"
        f"Tim logistik di pergudangan pusat QHomeMart telah menerima instruksi otomatis ini dan sedang mempersiapkan armada untuk pengiriman langsung ke lokasi proyek Anda. Anda dapat mengunduh Nota Pembelian & Dokumen Kargo resmi berformat PDF kapan saja melalui portal pesanan.\n\n"
        f"Jika ada hal lain yang perlu disesuaikan atau ada tambahan material, jangan ragu untuk memberi tahu saya. Senang bisa membantu Anda mewujudkan proyek terbaik Anda! 😊"
    )

    # Pesan user — konfirmasi pembayaran
    user_msg = DBMessage(
        id=str(uuid.uuid4()),
        session_id=payload.session_id,
        role=ChatRole.user,
        content=confirmation_user_text,
        created_at=datetime.utcnow(),
    )
    db.add(user_msg)

    # Pesan system — balasan agen konfirmasi kargo
    system_logs = [
        {
            "event": "completed",
            "title": "Chief Supervisor",
            "message": "Pembayaran QRIS dikonfirmasi. Dispatch kargo diaktifkan.",
            "narrative": agent_narrative,
            "products": [],
        }
    ]
    system_msg = DBMessage(
        id=str(uuid.uuid4()),
        session_id=payload.session_id,
        role=ChatRole.system,
        content=agent_narrative,
        agent_logs=system_logs,
        created_at=datetime.utcnow(),
    )
    db.add(system_msg)
    db.commit()

    return {"status": "confirmed", "order_id": order_id, "session_id": payload.session_id}
