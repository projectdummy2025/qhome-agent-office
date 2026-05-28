import json
import re
from datetime import datetime, timezone
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver

from backend.agents.shared import (
    AgentState,
    _llm_invoke_with_retry,
    supervisor_llm,
    gemini_specialist,
    groq_specialist
)

from backend.agents.tile_agent import tile_estimator
from backend.agents.wood_agent import wood_specialist
from backend.agents.paint_agent import paint_consultant
from backend.agents.stone_agent import stone_specialist
from backend.agents.research_agent import restock_researcher

def chief_supervisor(state: AgentState):
    """Menganalisis brief, mendeteksi penghapusan/rejeksi barang, dan menentukan agen spesialis"""
    brief = state.get("brief", "").strip()
    if not brief:
        return {"hired_agents": []}
        
    reports = state.get("reports", [])
    history_summary = state.get("history_summary", "")

    existing_materials = []
    for r in reports:
        if "product" in r:
            p = r["product"]
            existing_materials.append(
                f"- {r['agent']}: {p.get('name')} (Sku: {p.get('sku')}, Qty: {p.get('qty')}, Total: Rp {p.get('total', 0):,})"
            )

    materials_summary = "\n".join(existing_materials) if existing_materials else "Tidak ada."

    prompt = (
        f"Klien mengajukan instruksi terbaru: '{brief}'.\n\n"
        f"Konteks Sesi Sebelumnya:\n{history_summary if history_summary else 'Tidak ada.'}\n\n"
        f"Rencana belanja saat ini:\n{materials_summary}\n\n"
        "Tugas Anda adalah menganalisis instruksi terbaru klien tersebut dan menentukan:\n"
        "1. Apakah klien ingin menghapus, membatalkan, menolak, atau tidak ingin menyertakan jenis material tertentu dari rencana belanja saat ini? "
        "(Misalnya: 'jangan pakai cat', 'batalkan ubin', 'hapus panel kayu', 'cat dicancel saja', 'saya tidak mau ubin/granit').\n"
        "Jika YA, masukkan nama agent spesialis yang menangani material tersebut ke dalam list 'rejected_agents'. "
        "Pilihan nama agent: 'tile' (ubin/lantai/semen/nat), 'wood' (kayu/panel/wpc), 'stone' (batu/batu alam), 'paint' (cat/jotaplast).\n\n"
        "2. Agen spesialis mana saja yang perlu dipanggil (hired) untuk memproses, menghitung, atau merevisi kebutuhan material sesuai instruksi klien? "
        "Pilihan nama agent: 'tile', 'wood', 'stone', 'paint', 'researcher'.\n\n"
        "Format output harus HANYA berupa JSON valid dengan skema berikut tanpa backticks atau teks tambahan:\n"
        "{\n"
        '  "rejected_agents": ["nama_agent_yang_dihapus"],\n'
        '  "hired_agents": ["nama_agent_yang_dipanggil"]\n'
        "}"
    )

    response = _llm_invoke_with_retry(supervisor_llm, prompt)
    
    rejected = []
    hired = []
    
    try:
        match = re.search(r"\{.*\}", response.content, re.DOTALL)
        if match:
            res_json = json.loads(match.group(0))
            rejected = res_json.get("rejected_agents", [])
            hired = res_json.get("hired_agents", [])
    except Exception:
        text = str(response.content).lower()
        if "tile" in text: hired.append("tile")
        if "wood" in text: hired.append("wood")
        if "stone" in text: hired.append("stone")
        if "paint" in text: hired.append("paint")
        if "researcher" in text: hired.append("researcher")

    brief_lower = brief.lower()
    negative_words = ["jangan", "batal", "hapus", "cancel", "tidak usah", "tidak mau", "tanpa", "tolak", "remove", "delete"]
    if any(neg in brief_lower for neg in negative_words):
        if "cat" in brief_lower or "paint" in brief_lower:
            rejected.append("paint")
        if "ubin" in brief_lower or "tile" in brief_lower or "semen" in brief_lower or "nat" in brief_lower or "lantai" in brief_lower or "granit" in brief_lower:
            rejected.append("tile")
        if "kayu" in brief_lower or "wood" in brief_lower or "panel" in brief_lower or "fluted" in brief_lower or "wpc" in brief_lower:
            rejected.append("wood")
        if "batu" in brief_lower or "stone" in brief_lower or "veneer" in brief_lower:
            rejected.append("stone")

    rejected = list(set([r.lower() for r in rejected]))
    
    updated_reports = list(reports)
    if rejected:
        filtered_reports = []
        for r in updated_reports:
            agent_name = r.get("agent", "").lower()
            is_rejected = False
            for rej in rejected:
                if rej in agent_name:
                    is_rejected = True
                    break
            if not is_rejected:
                filtered_reports.append(r)
        updated_reports = filtered_reports

    hired = [h for h in hired if h not in rejected]

    return {"hired_agents": hired, "reports": updated_reports}


def market_researcher(state: AgentState):
    """Market Research Analyst"""
    if "researcher" not in state.get("hired_agents", []):
        return {"reports": [r for r in state.get("reports", []) if r.get("agent") != "Market Analyst"]}
    brief = state.get("brief", "")

    try:
        history_summary = state.get("history_summary", "")
        query_prompt = (
            f"Konteks Sesi Sebelumnya: {history_summary if history_summary else 'Tidak ada.'}\n\n"
            f"Berdasarkan instruksi klien: '{brief}', buat 1 kalimat query pencarian Google yang paling relevan untuk mencari tren atau ide desain interior terkait. Berikan HANYA teks query-nya."
        )
        query_response = _llm_invoke_with_retry(gemini_specialist, query_prompt)
        search_query = query_response.content.strip()

        from backend.mcp_tools.web_search import tavily_web_search
        search_result = tavily_web_search(search_query)

        analysis_prompt = f"Berdasarkan hasil pencarian internet berikut: '{search_result[:500]}...', lakukan analisis mendalam dan tuliskan temuan pasar (market insight) yang relevan untuk proyek dengan brief: '{brief}'."
        analysis_response = _llm_invoke_with_retry(groq_specialist, analysis_prompt)
        raw_res = analysis_response.content.strip()

        think_match = re.search(r"<think>([\s\S]*?)</think>", raw_res, re.IGNORECASE)
        thinking = think_match.group(1).strip() if think_match else ""
        clean_content = re.sub(
            r"<think>[\s\S]*?</think>", "", raw_res, flags=re.IGNORECASE
        ).strip()

        polish_prompt = (
            f"Anda adalah Market Analyst Senior di QHomeMart. Berikut adalah draf analisis pasar mentah hasil riset: '{clean_content}'. "
            "Tulis ulang draf tersebut menjadi HANYA 1 kalimat temuan pasar (market insight) yang sangat elegan, profesional, "
            "dan mudah dipahami oleh pelanggan."
        )
        gemini_response = _llm_invoke_with_retry(gemini_specialist, polish_prompt)
        polished_content = gemini_response.content.strip()
        polished_content = re.sub(
            r"<think>[\s\S]*?</think>", "", polished_content, flags=re.IGNORECASE
        ).strip()

        if thinking:
            content = f"<think>{thinking}</think> {polished_content}"
        else:
            content = polished_content

    except Exception:
        content = "Riset pasar saat ini difokuskan pada ketersediaan stok material di gudang lokal QHomeMart."

    report = {"agent": "Market Analyst", "content": content}
    old_reports = [
        r for r in state.get("reports", []) if r.get("agent") != "Market Analyst"
    ]
    return {"reports": old_reports + [report]}


def inventory_administrator(state: AgentState):
    """Inventory Administrator"""
    reports = [
        r
        for r in state.get("reports", [])
        if r.get("agent")
        not in ["Inventory Administrator", "Inventory Administrator (Alt)"]
    ]
    brief = state.get("brief", "")

    from backend.core.database import SessionLocal
    from backend.models.schema import Product as ProductModel

    db = SessionLocal()
    stock_report_lines = []
    new_reports = []
    added_alternatives = []

    try:
        for r in reports:
            r_copy = dict(r)

            if "product" in r_copy:
                prods_data = r_copy["product"]
                if not isinstance(prods_data, list):
                    prods_data = [prods_data]
                
                updated_prods = []
                for p_idx, prod_dict in enumerate(prods_data):
                    prod = dict(prod_dict)
                    prod_name = prod.get("name", "")

                    if prod_name and prod_name != "Menunggu Konfirmasi":
                        db_product = (
                            db.query(ProductModel)
                            .filter(ProductModel.name.ilike(f"%{prod_name[:20]}%"))
                            .first()
                        )

                        if db_product:
                            qty_val = db_product.stock_qty
                            qty_str = prod.get("qty", "10")
                            try:
                                qty_nums = re.findall(r"\d+", str(qty_str))
                                qty_int = int(qty_nums[0]) if qty_nums else 10
                            except Exception:
                                qty_int = 10

                            if qty_val >= 20 and qty_val >= qty_int:
                                status = f"TERSEDIA — Stok {qty_val} unit di gudang mencukupi kebutuhan ({qty_int})."
                                stock_report_lines.append(
                                    f"- {db_product.name} (SKU: {db_product.sku}): {status}"
                                )
                            else:
                                if qty_val > 0:
                                    status = f"TERBATAS — Hanya tersisa {qty_val} unit (Kebutuhan: {qty_int})."
                                else:
                                    status = f"HABIS — Stok kosong (Kebutuhan: {qty_int})."

                                alt = (
                                    db.query(ProductModel)
                                    .filter(
                                        ProductModel.category == db_product.category,
                                        ProductModel.stock_qty >= qty_int,
                                        ProductModel.sku != db_product.sku,
                                    )
                                    .first()
                                )

                                clean_prod_name = prod_name
                                for pfx in ["[STOK HABIS]", "[STOK TERBATAS]", "[STOK KURANG]"]:
                                    clean_prod_name = clean_prod_name.replace(pfx, "").strip()

                                if alt:
                                    status += f" Disarankan alternatif: {alt.name} (SKU: {alt.sku}, Stok: {alt.stock_qty})."
                                    prod["sku"] = db_product.sku
                                    prod["name"] = f"[STOK TERBATAS] {clean_prod_name}"

                                    qty_suffix = "Unit"
                                    for suff in ["Dus", "Lembar", "Pail", "m2", "Sak", "Bag"]:
                                        if suff.lower() in qty_str.lower():
                                            qty_suffix = suff
                                            break

                                    alt_product = {
                                        "sku": alt.sku,
                                        "name": alt.name,
                                        "price": alt.base_price,
                                        "qty": f"{qty_int} {qty_suffix} (Substitusi)",
                                        "total": alt.base_price * qty_int,
                                    }
                                    added_alternatives.append(alt_product)
                                else:
                                    status += " Tidak ada produk alternatif sejenis yang mencukupi saat ini."
                                    prod["sku"] = db_product.sku
                                    prefix = "[STOK TERBATAS]" if qty_val > 0 else "[STOK HABIS]"
                                    prod["name"] = f"{prefix} {clean_prod_name}"

                                stock_report_lines.append(
                                    f"- {db_product.name} (SKU: {db_product.sku}): {status}"
                                )
                        else:
                            clean_prod_name = prod_name
                            for pfx in ["[STOK HABIS]", "[STOK TERBATAS]", "[STOK KURANG]"]:
                                clean_prod_name = clean_prod_name.replace(pfx, "").strip()
                            existing_sku = (prod.get("sku") or "").strip()
                            if not existing_sku.startswith("OOS-"):
                                slug = re.sub(r"[^A-Za-z0-9]+", "-", clean_prod_name).strip("-").upper()[:24] or "UNKNOWN"
                                prod["sku"] = f"OOS-{slug}"
                            prod["name"] = f"[STOK HABIS] {clean_prod_name}"
                            stock_report_lines.append(
                                f"- {prod_name}: Produk belum terdaftar di sistem gudang — ditandai untuk pengadaan."
                            )
                    updated_prods.append(prod)
                r_copy["product"] = updated_prods

            new_reports.append(r_copy)
    finally:
        db.close()

    stock_summary = "\n".join(stock_report_lines)
    prompt = (
        f"Anda adalah Inventory Administrator di gudang QHomeMart. "
        f"Anda telah melakukan pemeriksaan stok untuk proyek dengan brief: '{brief}'.\n\n"
        f"Hasil pemeriksaan stok gudang:\n{stock_summary}\n\n"
        "Tuliskan laporan ketersediaan material (1-2 kalimat) kepada Chief Supervisor secara profesional. "
        "Sebutkan jika ada produk yang dialihkan ke alternatif stok yang lebih melimpah demi kelancaran proyek."
    )

    try:
        response = _llm_invoke_with_retry(groq_specialist, prompt)
        raw_res = response.content.strip()

        think_match = re.search(r"<think>([\s\S]*?)</think>", raw_res, re.IGNORECASE)
        thinking = think_match.group(1).strip() if think_match else ""
        clean_content = re.sub(
            r"<think>[\s\S]*?</think>", "", raw_res, flags=re.IGNORECASE
        ).strip()

        polish_prompt = (
            f"Anda adalah Kepala Administrasi Gudang QHomeMart. Berikut adalah draf laporan persediaan barang pergudangan: '{clean_content}'. "
            "Tulis ulang draf tersebut menjadi HANYA 1-2 kalimat laporan inventaris yang sangat rapi, formal, "
            "dan berwibawa untuk diserahkan kepada Chief Supervisor."
        )
        gemini_response = _llm_invoke_with_retry(gemini_specialist, polish_prompt)
        polished_content = gemini_response.content.strip()
        polished_content = re.sub(
            r"<think>[\s\S]*?</think>", "", polished_content, flags=re.IGNORECASE
        ).strip()

        if thinking:
            content = f"<think>{thinking}</think> {polished_content}"
        else:
            content = polished_content

    except Exception:
        content = (
            f"Laporan Stok Gudang: {stock_summary}. "
            "Seluruh rekomendasi material telah diverifikasi ketersediaannya."
        )

    inv_report = {"agent": "Inventory Administrator", "content": content}

    if added_alternatives:
        inv_report["product"] = added_alternatives[0]
        for extra_alt in added_alternatives[1:]:
            new_reports.append(
                {
                    "agent": "Inventory Administrator (Alt)",
                    "content": f"Substitusi material tambahan: {extra_alt['name']}",
                    "product": extra_alt,
                }
            )

    return {"reports": new_reports + [inv_report]}


DISCLAIMER_TEXT = (
    " DISCLAIMER TEKNIS: Dokumen ini merupakan estimasi awal yang dihasilkan oleh sistem AI QHome-MAS "
    "berdasarkan data brief yang dimasukkan. Hasil estimasi dapat berbeda dengan kebutuhan aktual di lapangan "
    "akibat variasi kondisi konstruksi, pola pemasangan, dan spesifikasi lokasi. Untuk proyek skala besar atau "
    "keputusan pembelian final, kami merekomendasikan Validasi Staf Ahli Qhomemart sebelum pemesanan. "
    "Hubungi gerai kami di Jl. Raya Janti Ringroad Timur No. 96, Banguntapan."
)

def synthesizer(state: AgentState):
    """Supervisor merangkum proposal, membuat narasi, dan menyertakan disclaimer teknis"""
    products = []
    agent_reports_text = ""

    for r in state.get("reports", []):
        if "product" in r:
            prod_data = r["product"]
            if isinstance(prod_data, list):
                products.extend(prod_data)
            else:
                products.append(prod_data)
        clean_report_content = re.sub(
            r"<think>[\s\S]*?</think>", "", r["content"], flags=re.IGNORECASE
        ).strip()
        agent_reports_text += f"\n- Laporan {r['agent']}: {clean_report_content}"

    brief = state.get("brief", "")
    history_summary = state.get("history_summary", "")
    prompt = (
        f"Anda adalah Chief Supervisor di Kalkulator RAB QHomeMart.\n"
        f"Konteks Percakapan Sebelumnya: {history_summary if history_summary else 'Tidak ada.'}\n\n"
        f"Klien memiliki permintaan/instruksi terbaru berikut:\n'{brief}'\n\n"
        f"Modul spesialis telah memberikan rekomendasi berikut:{agent_reports_text}\n\n"
        "Buatlah 2-3 paragraf narasi profesional bergaya Asisten Belanja Teknis Supermarket Bahan Bangunan QHomeMart "
        "(tanpa sapaan salam, langsung to the point) yang merangkum estimasi kebutuhan material ini berdasarkan laporan spesialis di atas. "
        "PENTING — Ikuti aturan berikut dengan ketat:\n"
        "1. Hanya sampaikan fakta yang tercantum dalam laporan spesialis. Jangan tambahkan klaim teknis, spesifikasi produk, atau jaminan kualitas yang tidak disebutkan dalam laporan.\n"
        "2. Jika ada produk dengan label [STOK TERBATAS] atau [STOK HABIS], sebutkan secara eksplisit bahwa produk tersebut perlu diproses lebih lanjut oleh Admin Gudang dan belum dapat dikonfirmasi pengadaannya.\n"
        "3. Jika ada produk dengan estimasi harga internet (label 'Estimasi Internet'), nyatakan bahwa harga tersebut adalah estimasi pasar dan memerlukan konfirmasi harga resmi dari pemasok.\n"
        "4. DILARANG membuat klaim tentang jalur distribusi, TDS, SDS, atau proses pengadaan yang belum terjadi secara nyata dalam sistem.\n"
        "Jangan buat rincian harga karena akan ditampilkan terpisah. Format output harus teks paragraf biasa."
    )

    try:
        response = _llm_invoke_with_retry(supervisor_llm, prompt)
        content = response.content
        if isinstance(content, list):
            narrative = " ".join(
                [
                    str(c.get("text", c)) if isinstance(c, dict) else str(c)
                    for c in content
                ]
            )
        else:
            narrative = str(content)
    except Exception:
        narrative = (
            "Berdasarkan analisis mendalam dari tim spesialis kami, berikut adalah rekomendasi material yang paling sesuai "
            "dengan kriteria dan kebutuhan proyek Anda. Material ini dipilih secara spesifik untuk menjamin kualitas, "
            "fungsionalitas, serta estetika yang maksimal."
        )

    generated_at = datetime.now(timezone.utc).isoformat()

    return {
        "final_proposal": json.dumps(
            {
                "narrative": narrative,
                "products": products,
                "disclaimer": DISCLAIMER_TEXT,
                "generated_at": generated_at,
            }
        )
    }

workflow = StateGraph(AgentState)

workflow.add_node("supervisor", chief_supervisor)
workflow.add_node("tile", tile_estimator)
workflow.add_node("wood", wood_specialist)
workflow.add_node("stone", stone_specialist)
workflow.add_node("paint", paint_consultant)
workflow.add_node("researcher", market_researcher)
workflow.add_node("inventory", inventory_administrator)
workflow.add_node("restock_researcher", restock_researcher)
workflow.add_node("synthesizer", synthesizer)

workflow.set_entry_point("supervisor")
workflow.add_edge("supervisor", "tile")
workflow.add_edge("tile", "wood")
workflow.add_edge("wood", "stone")
workflow.add_edge("stone", "paint")
workflow.add_edge("paint", "researcher")
workflow.add_edge("researcher", "inventory")
workflow.add_edge("inventory", "restock_researcher")
workflow.add_edge("restock_researcher", "synthesizer")
workflow.add_edge("synthesizer", END)

memory = MemorySaver()
app_graph = workflow.compile(checkpointer=memory)
