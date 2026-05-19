import asyncio
import uuid
from datetime import datetime, timezone
from backend.core.database import SessionLocal
from backend.models.schema import ChatMessage, ChatRole, EstimationKPI

# State In-Memory sementara untuk SSE Streaming (karena HTTP bersifat stateless)
active_streams = {}

async def run_agent_simulation(brief: str, session_id: str):
    def add_log(msg):
        if session_id in active_streams:
            active_streams[session_id]["logs"].append(msg)

    # P6 — KPI: catat waktu mulai
    kpi_started_at = datetime.now(timezone.utc)

    add_log({"event": "routing", "title": "Chief Supervisor", "message": "Menganalisis kebutuhan proyek secara komprehensif..."})
    await asyncio.sleep(1.5)
    
    try:
        from backend.agents.supervisor import app_graph
        
        async for output in app_graph.astream({"brief": brief, "reports": []}, stream_mode="updates"):
            for node_name, state_update in output.items():
                if node_name == "supervisor":
                    hired = state_update.get("hired_agents", [])
                    if not hired:
                        add_log({"event": "routing", "title": "Chief Supervisor", "message": "Tidak ada agen spesialis yang relevan untuk dipanggil."})
                    else:
                        add_log({"event": "routing", "hired": hired, "title": "Chief Supervisor", "message": f"Mendelegasikan tugas kepada spesialis: {', '.join([h.capitalize() for h in hired])}."})
                
                elif node_name == "synthesizer":
                    proposal_json = state_update.get("final_proposal", "{}")
                    import json
                    try:
                        parsed = json.loads(proposal_json)
                        narrative = parsed.get("narrative", "")
                        products = parsed.get("products", [])
                        disclaimer = parsed.get("disclaimer", "")
                        generated_at = parsed.get("generated_at", "")
                    except:
                        narrative = ""
                        products = []
                        disclaimer = ""
                        generated_at = ""
                    add_log({
                        "event": "completed",
                        "title": "Chief Supervisor",
                        "message": "Semua laporan telah disetujui. Melakukan kompilasi proposal final.",
                        "narrative": narrative,
                        "products": products,
                        "disclaimer": disclaimer,
                        "generated_at": generated_at,
                    })

                
                else:
                    reports = state_update.get("reports", [])
                    if reports:
                        last_report = reports[-1]
                        agent_title = last_report.get('agent', node_name.capitalize())
                        add_log({"event": "working", "agent": node_name, "title": agent_title, "message": "Sedang menganalisis dan meninjau katalog..."})
                        await asyncio.sleep(2.5)
                        add_log({"event": "report", "agent": node_name, "title": agent_title, "message": last_report.get('content')})
                
                await asyncio.sleep(2.5)
                
    except Exception as e:
        add_log({"event": "error", "title": "System Error", "message": f"Terjadi kesalahan: {str(e)}"})
        
    if session_id in active_streams:
        active_streams[session_id]["status"] = "completed"

        # P6 — KPI: hitung lead_time dan kumpulkan metrik
        kpi_completed_at = datetime.now(timezone.utc)
        lead_time = (kpi_completed_at - kpi_started_at).total_seconds()

        # Hitung jumlah agen aktif dan produk dari logs
        hired_count = 0
        product_count = 0
        for log in active_streams[session_id]["logs"]:
            if isinstance(log, dict):
                if log.get("event") == "routing" and log.get("hired"):
                    hired_count = len(log["hired"])
                if log.get("event") == "completed":
                    product_count = len(log.get("products", []))

        # PENTING: Saat proses berpikir agen selesai, simpan seluruh Log-nya ke Database!
        db = SessionLocal()
        try:
            sys_msg = ChatMessage(
                id=str(uuid.uuid4()),
                session_id=session_id,
                role=ChatRole.system,
                agent_logs=active_streams[session_id]["logs"],
                content="Berikut adalah kalkulasi material dan desain dari tim spesialis QHome-MAS."
            )
            db.add(sys_msg)

            # P6 — Simpan record KPI
            kpi_record = EstimationKPI(
                id=str(uuid.uuid4()),
                session_id=session_id,
                started_at=kpi_started_at,
                completed_at=kpi_completed_at,
                lead_time_seconds=round(lead_time, 2),
                agent_count=hired_count,
                product_count=product_count,
                brief_length=len(active_streams.get(session_id, {}).get("brief", "")),
                pdf_generated=0,
            )
            db.add(kpi_record)
            db.commit()
        finally:
            db.close()

async def cleanup_stream(session_id: str):
    await asyncio.sleep(10) # Beri jeda 10 detik agar frontend sempat memproses stream terakhir
    if session_id in active_streams:
        del active_streams[session_id]
