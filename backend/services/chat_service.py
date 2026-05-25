import uuid
import re
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified
from backend.models.schema import ChatSession, ChatMessage, ChatRole, EstimationKPI, Product as DBProduct, Order as DBOrder, OrderItem as DBOrderItem

def generate_session_title(brief: str) -> str:
    try:
        from backend.agents.shared import gemini_specialist, _llm_invoke_with_retry

        prompt = (
            f"Buat satu judul proyek singkat, padat, dan profesional (3-4 kata, bahasa Indonesia) untuk kebutuhan ini: '{brief}'. "
            "Contoh: 'Estimasi Granit Teras', 'Fasad Panel WPC', 'Pengecatan Ruang Tamu'. "
            "Keluarkan HANYA judul tersebut tanpa penjelasan atau kata pengantar apapun."
        )
        response = _llm_invoke_with_retry(gemini_specialist, prompt)
        title = response.content.strip()

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

        if not title or len(title) < 3 or "think" in title.lower():
            raise ValueError("Judul kosong atau terinfeksi tag")

        return title[:50]
    except Exception:
        stop_words = {
            "kami", "saya", "ingin", "sedang", "tolong", "buatkan", "rencana",
            "estimasi", "butuh", "membutuhkan", "proyek", "adalah",
        }
        words = [
            w.capitalize()
            for w in re.sub(r"[^\w\s]", "", brief).split()
            if w and w.lower() not in stop_words
        ]
        if not words:
            words = [w.capitalize() for w in re.sub(r"[^\w\s]", "", brief).split() if w]
        return "Estimasi " + " ".join(words[:3])


def generate_project_summary(brief: str, narrative: str) -> str:
    if not brief:
        return ""

    try:
        from backend.agents.shared import gemini_specialist, _llm_invoke_with_retry

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
        project_summary = re.sub(r"<think>[\s\S]*?</think>", "", project_summary, flags=re.IGNORECASE).strip()
        project_summary = re.sub(r"<think>|</think>", "", project_summary, flags=re.IGNORECASE).strip()
        if project_summary:
            return project_summary
    except Exception:
        pass

    return brief


def get_all_sessions(db: Session, user_id: str = None):
    query = db.query(ChatSession)
    if user_id:
        query = query.filter(ChatSession.user_id == user_id)
    sessions = query.order_by(ChatSession.created_at.desc()).all()
    result = []
    for s in sessions:
        first_user_msg = next(
            (m.content for m in s.messages if m.role == ChatRole.user), None
        )
        result.append(
            {"id": s.id, "title": s.title, "brief": first_user_msg or s.title}
        )
    return result


def get_session_messages(db: Session, session_id: str):
    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )

    result = []
    for msg in messages:
        logs = msg.agent_logs or []

        status = "completed" if msg.role == ChatRole.system else None

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


def get_all_products(db: Session):
    products = db.query(DBProduct).all()

    category_images = {
        "building material": "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80",
        "floor": "https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=800&q=80",
        "appliance & household": "https://images.unsplash.com/photo-1581579183596-327d1a0a7b3f?auto=format&fit=crop&w=800&q=80",
        "furniture": "https://images.unsplash.com/photo-1540574163026-643ea20ade25?auto=format&fit=crop&w=800&q=80",
        "sanitary & plumbing": "https://images.unsplash.com/photo-1581579183605-1d3f1f3b9a80?auto=format&fit=crop&w=800&q=80",
        "electrical & lighting": "https://images.unsplash.com/photo-1542224566-3b8e2e9c8b3b?auto=format&fit=crop&w=800&q=80",
        "tools & machinery": "https://images.unsplash.com/photo-1532619675605-4f2f1a8a6f4b?auto=format&fit=crop&w=800&q=80",
    }

    result = []
    for p in products:
        category_lower = p.category.lower() if p.category else ""

        image_url = "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=500&q=80"
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


def save_order(db: Session, payload):
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
        # PENTING: Cegah ForeignKeyViolation jika product_sku tidak ada di database (seperti OOS-CEMENT, OOS-GROUT, dll.)
        prod_exists = db.query(DBProduct).filter(DBProduct.sku == item.product_sku).first()
        if not prod_exists:
            from backend.models.schema import StockRecommendation
            rec = db.query(StockRecommendation).filter(
                StockRecommendation.suggested_sku == item.product_sku
            ).first()
            
            if rec:
                placeholder_name = f"{rec.product_name} (Menunggu Konfirmasi)"
            else:
                placeholder_name = "Material Tambahan (Menunggu Konfirmasi)"
                if "cement" in item.product_sku.lower():
                    placeholder_name = "Semen Perekat Instan (Menunggu Konfirmasi)"
                elif "grout" in item.product_sku.lower():
                    placeholder_name = "Pengisi Nat / Tile Grout (Menunggu Konfirmasi)"
                elif "coating" in item.product_sku.lower():
                    placeholder_name = "Cairan Coating Pelindung (Menunggu Konfirmasi)"
                elif "primer" in item.product_sku.lower():
                    placeholder_name = "Cat Dasar / Alkali Sealer (Menunggu Konfirmasi)"
            
            temp_prod = DBProduct(
                sku=item.product_sku,
                name=placeholder_name,
                category="material_pendukung",
                base_price=item.price,
                coverage_m2=0.0,
                desc="Produk rekomendasi otomatis hasil internet riset untuk pemesanan",
                stock_qty=0
            )
            db.add(temp_prod)
            db.flush()

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
    return order_id


def restock_product_db(db: Session, sku: str, added_qty: int):
    p = db.query(DBProduct).filter(DBProduct.sku == sku).first()
    if not p:
        return None
    p.stock_qty += added_qty
    db.commit()
    return p


def update_session_products_db(db: Session, session_id: str, products: list):
    msg = (
        db.query(ChatMessage)
        .filter(ChatMessage.session_id == session_id, ChatMessage.role == ChatRole.system)
        .order_by(ChatMessage.created_at.desc())
        .first()
    )

    if not msg:
        return False

    logs = msg.agent_logs or []

    updated = False
    new_logs = []
    for log in logs:
        if isinstance(log, dict):
            new_log = dict(log)
            if new_log.get("event") == "completed":
                new_log["products"] = products
                updated = True
            new_logs.append(new_log)
        else:
            new_logs.append(log)

    if not updated:
        new_logs.append(
            {
                "event": "completed",
                "products": products,
                "narrative": msg.content or "Material terkurasi oleh asisten digital.",
            }
        )

    msg.agent_logs = new_logs
    flag_modified(msg, "agent_logs")
    db.commit()
    return True


def request_restock_db(db: Session, session_id: str, products: list):
    narrative = "Persetujuan sudah diterima, harap menunggu pesan."

    new_msg = ChatMessage(
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
            "products": products
        }]
    )
    db.add(new_msg)
    db.commit()
    return True


def restock_complete_db(db: Session, session_id: str, products: list):
    narrative = "Stok material telah berhasil diperbarui oleh Admin Gudang. Keranjang belanja Anda sekarang sudah siap, silakan lanjutkan proses checkout (konfirmasi pembayaran) di Order Portal."

    new_msg = ChatMessage(
        id=str(uuid.uuid4()),
        session_id=session_id,
        role=ChatRole.system,
        content=narrative,
        created_at=datetime.utcnow(),
        agent_logs=[{
            "event": "completed",
            "title": "Inventory Administrator",
            "message": "Pembaruan stok selesai.",
            "narrative": narrative,
            "products": products
        }]
    )
    db.add(new_msg)
    db.commit()
    return True


def confirm_payment_db(db: Session, payload):
    order = db.query(DBOrder).filter(DBOrder.id == payload.order_id).first()
    if order:
        order.payment_status = "paid"

    confirmation_user_text = (
        f"Saya sudah menyelesaikan pembayaran QRIS untuk pesanan {payload.order_id} "
        f"senilai Rp {payload.total_invoice:,.0f}. Mohon aktifkan kargo pengiriman."
    )

    agent_narrative = (
        f"**Pembayaran QRIS Diterima — Kargo Diaktifkan**\n\n"
        f"Terima kasih banyak, **{payload.client_name}**! Kami sangat mengapresiasi kepercayaan dan kerja sama Anda dalam transaksi kemitraan ini.\n\n"
        f"Sistem kami telah berhasil memverifikasi pembayaran QRIS untuk pesanan **{payload.order_id}** dengan rincian berikut:\n\n"
        f"- **Total Pembayaran:** Rp {payload.total_invoice:,.0f}\n"
        f"- **Jumlah Item:** {payload.items_count} jenis material bangunan\n"
        f"- **Status Pengiriman:** Kargo diaktifkan & dijadwalkan untuk dispatch segera\n\n"
        f"Tim logistik di pergudangan pusat QHomeMart telah menerima instruksi otomatis ini dan sedang mempersiapkan armada untuk pengiriman langsung ke lokasi proyek Anda. Anda dapat mengunduh Nota Pembelian & Dokumen Kargo resmi berformat PDF kapan saja melalui portal pesanan.\n\n"
        f"Jika ada hal lain yang perlu disesuaikan atau ada tambahan material, jangan ragu untuk memberi tahu saya. Senang bisa membantu Anda mewujudkan proyek terbaik Anda! 😊"
    )

    user_msg = ChatMessage(
        id=str(uuid.uuid4()),
        session_id=payload.session_id,
        role=ChatRole.user,
        content=confirmation_user_text,
        created_at=datetime.utcnow(),
    )
    db.add(user_msg)

    system_logs = [
        {
            "event": "completed",
            "title": "Chief Supervisor",
            "message": "Pembayaran QRIS dikonfirmasi. Dispatch kargo diaktifkan.",
            "narrative": agent_narrative,
            "products": [],
        }
    ]
    system_msg = ChatMessage(
        id=str(uuid.uuid4()),
        session_id=payload.session_id,
        role=ChatRole.system,
        content=agent_narrative,
        agent_logs=system_logs,
        created_at=datetime.utcnow(),
    )
    db.add(system_msg)
    db.commit()
    return True


def get_kpi_summary_data(db: Session):
    records = db.query(EstimationKPI).all()
    if not records:
        return {"total_estimations": 0, "message": "Belum ada data KPI."}

    lead_times = [
        r.lead_time_seconds for r in records if r.lead_time_seconds is not None
    ]
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

def generate_pdf_service(session_id: str, db: Session):
    from backend.models.schema import Order as DBOrder, ChatMessage, ChatRole, ChatSession, EstimationKPI
    from backend.services.pdf_service import generate_estimation_pdf
    from fastapi.responses import StreamingResponse
    import io

    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )

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
        project_summary = generate_project_summary(brief, narrative)
        if project_summary and project_summary != brief:
            brief = project_summary
            if session_record:
                session_record.summary = project_summary
                db.commit()

    if not brief:
        return {"error": "Sesi tidak ditemukan atau belum selesai diproses."}

    if not disclaimer:
        disclaimer = "Estimasi ini adalah simulasi awal. Harga dan ketersediaan stok dapat berubah sewaktu-waktu tanpa pemberitahuan."

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

        client_name = order.client_name or "Klien Mitra"
        client_role = order.client_role or "Mitra Profesional"

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

    kpi = (
        db.query(EstimationKPI)
        .filter(EstimationKPI.session_id == session_id)
        .order_by(EstimationKPI.started_at.desc())
        .first()
    )
    if kpi:
        kpi.pdf_generated = 1
        db.commit()

    filename_prefix = "Nota_Mitra" if order_id is not None else "Estimasi_QHome"
    filename = f"{filename_prefix}_{session_id[:8].upper()}.pdf"
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
