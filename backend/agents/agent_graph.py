import json
import re
from datetime import datetime, timezone
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver

from backend.agents.shared import (
    AgentState,
    _llm_invoke_with_retry,
    _find_product_by_name_sql,
    _get_candidates_with_stock,
    _has_buying_intent,
    _get_resolved,
    _mark_resolved,
    supervisor_llm,
    gemini_specialist,
    groq_specialist
)

from backend.agents.tile_agent import tile_estimator
from backend.agents.wood_agent import wood_specialist
from backend.agents.paint_agent import paint_consultant
from backend.agents.stone_agent import stone_specialist
from backend.agents.catalog_agent import catalog_agent
from backend.agents.research_agent import restock_researcher

def chief_supervisor(state: AgentState):
    """Menganalisis brief, mendeteksi intent (conversational vs estimation), dan menentukan agen spesialis"""
    brief = state.get("brief", "").strip()
    if not brief:
        return {"hired_agents": [], "intent": "conversational"}

    reports = state.get("reports", [])
    history_summary = state.get("history_summary", "")

    existing_materials = []
    for r in reports:
        if "product" in r:
            p = r["product"]
            if isinstance(p, list):
                for item in p:
                    existing_materials.append(
                        f"- {r['agent']}: {item.get('name')} (Sku: {item.get('sku')}, Qty: {item.get('qty')}, Total: Rp {item.get('total', 0):,})"
                    )
            else:
                existing_materials.append(
                    f"- {r['agent']}: {p.get('name')} (Sku: {p.get('sku')}, Qty: {p.get('qty')}, Total: Rp {p.get('total', 0):,})"
                )

    materials_summary = "\n".join(existing_materials) if existing_materials else "Tidak ada."

    prompt = (
        f"Klien mengajukan pesan terbaru: '{brief}'.\n\n"
        f"Konteks Percakapan Sebelumnya:\n{history_summary if history_summary else 'Tidak ada.'}\n\n"
        f"Material yang sudah ada di rencana belanja:\n{materials_summary}\n\n"
        "Tugas Anda adalah menganalisis pesan klien dan mengisi JSON berikut:\n\n"
        "1. 'intent': Tentukan apakah pesan klien adalah:\n"
        "   - 'conversational': pertanyaan umum, konsultasi desain, diskusi ide, tanya rekomendasi tanpa angka/dimensi spesifik, "
        "     ucapan terima kasih, konfirmasi sederhana, atau pesan yang tidak memerlukan kalkulasi material.\n"
        "   - 'estimation': permintaan kalkulasi RAB, estimasi kebutuhan material, menyebut dimensi ruangan (m2/meter), "
        "     minta daftar produk, cek stok/harga, pesan/order/beli produk tertentu, atau revisi rencana belanja.\n\n"
        "2. 'rejected_agents': Jika klien ingin menghapus material tertentu dari rencana, "
        "masukkan nama agentnya. Pilihan: 'tile', 'wood', 'stone', 'paint', 'catalog'. Kosongkan jika tidak ada.\n\n"
        "3. 'hired_agents': Jika intent adalah 'estimation', tentukan agen yang perlu dipanggil:\n"
        "   - 'tile': ubin/granit/keramik/lantai/semen perekat/nat\n"
        "   - 'wood': kayu/panel/wpc/fluted/SPC flooring\n"
        "   - 'stone': batu alam/veneer/andesit\n"
        "   - 'paint': cat/waterproofing/pelapis/coating dinding\n"
        "   - 'catalog': sanitary/wastafel/closet/kompor/elektronik/lampu/alat/bulk order produk tunggal "
        "     tanpa kalkulasi area, atau produk yang tidak masuk kategori tile/wood/stone/paint\n"
        "   - 'researcher': riset tren desain/insight pasar\n"
        "   Satu permintaan bisa hire lebih dari satu agent. Jika intent 'conversational', KOSONGKAN.\n\n"
        "Format output HANYA JSON valid tanpa backticks:\n"
        "{\n"
        '  "intent": "conversational" atau "estimation",\n'
        '  "rejected_agents": [],\n'
        '  "hired_agents": []\n'
        "}"
    )

    response = _llm_invoke_with_retry(supervisor_llm, prompt)

    intent = "estimation"
    rejected = []
    hired = []

    try:
        match = re.search(r"\{.*\}", response.content, re.DOTALL)
        if match:
            res_json = json.loads(match.group(0))
            intent = res_json.get("intent", "estimation")
            rejected = res_json.get("rejected_agents", [])
            hired = res_json.get("hired_agents", [])
    except Exception:
        text = str(response.content).lower()
        if "tile" in text: hired.append("tile")
        if "wood" in text: hired.append("wood")
        if "stone" in text: hired.append("stone")
        if "paint" in text: hired.append("paint")
        if "researcher" in text: hired.append("researcher")

    # Fallback keyword-based rejection
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

    # Kalau intent conversational, jangan panggil specialist apapun
    if intent == "conversational":
        hired = []

    updated_reports = list(reports)
    if rejected:
        filtered_reports = []
        for r in updated_reports:
            agent_name = r.get("agent", "").lower()
            is_rejected = any(rej in agent_name for rej in rejected)
            if not is_rejected:
                filtered_reports.append(r)
        updated_reports = filtered_reports

    hired = [h for h in hired if h not in rejected]

    # Reset resolved_supporting tiap giliran baru (brief baru = resolusi baru)
    return {
        "hired_agents": hired,
        "reports": updated_reports,
        "intent": intent,
        "resolved_supporting": [],
    }


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
    """Supervisor merangkum proposal atau menjawab pertanyaan konsultasi secara natural"""
    brief = state.get("brief", "")
    history_summary = state.get("history_summary", "")
    intent = state.get("intent", "estimation")

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

    if intent == "conversational":
        prompt = (
            "Anda adalah Asisten Konsultasi QHomeMart yang ramah, berpengetahuan luas tentang material bangunan, "
            "desain interior, dan renovasi rumah. Anda berbicara seperti konsultan toko yang membantu pelanggan "
            "secara natural — tidak kaku, tidak seperti robot.\n\n"
            f"Riwayat percakapan:\n{history_summary if history_summary else 'Belum ada.'}\n\n"
            f"Pesan terbaru dari klien: '{brief}'\n\n"
            "Berikan jawaban yang natural, informatif, dan langsung relevan dengan pertanyaan klien. "
            "Jika ada konteks dari riwayat percakapan yang relevan, gunakan itu untuk memberikan jawaban yang konsisten. "
            "Jangan tambahkan disclaimer teknis. Jangan sebut angka kalkulasi jika tidak diminta. "
            "Maksimal 2-3 paragraf atau lebih pendek jika memungkinkan."
        )
        try:
            response = _llm_invoke_with_retry(supervisor_llm, prompt)
            content = response.content
            narrative = str(content) if not isinstance(content, list) else " ".join(
                [str(c.get("text", c)) if isinstance(c, dict) else str(c) for c in content]
            )
        except Exception:
            narrative = "Terima kasih atas pertanyaannya. Silakan sampaikan detail lebih lanjut agar saya bisa membantu dengan lebih tepat."

        generated_at = datetime.now(timezone.utc).isoformat()
        return {
            "final_proposal": json.dumps({
                "narrative": narrative,
                "products": [],
                "disclaimer": "",
                "generated_at": generated_at,
            })
        }

    # Mode estimation: rangkum laporan specialist
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
                [str(c.get("text", c)) if isinstance(c, dict) else str(c) for c in content]
            )
        else:
            narrative = str(content)
    except Exception:
        narrative = (
            "Berdasarkan analisis mendalam dari tim spesialis kami, berikut adalah rekomendasi material yang paling sesuai "
            "dengan kriteria dan kebutuhan proyek Anda."
        )

    generated_at = datetime.now(timezone.utc).isoformat()
    return {
        "final_proposal": json.dumps({
            "narrative": narrative,
            "products": products,
            "disclaimer": DISCLAIMER_TEXT,
            "generated_at": generated_at,
        })
    }

def route_after_supervisor(state: AgentState):
    """Routing: kalau conversational langsung synthesizer, kalau estimation jalankan specialist"""
    intent = state.get("intent", "estimation")
    if intent == "conversational":
        return "synthesizer"
    hired = state.get("hired_agents", [])
    if not hired:
        return "synthesizer"
    if "tile" in hired:
        return "tile"
    if "wood" in hired:
        return "wood"
    if "stone" in hired:
        return "stone"
    if "paint" in hired:
        return "paint"
    if "catalog" in hired:
        return "catalog"
    if "researcher" in hired:
        return "researcher"
    return "synthesizer"

def _next_after(state: AgentState, current: str) -> str:
    """Tentukan node berikutnya dalam urutan dinamis sesuai hired_agents."""
    order = ["tile", "wood", "stone", "paint", "catalog", "researcher"]
    hired = state.get("hired_agents", [])
    try:
        idx = order.index(current)
    except ValueError:
        return "inventory"
    for candidate in order[idx + 1:]:
        if candidate in hired:
            return candidate
    return "inventory"

def route_after_tile(state: AgentState):
    return _next_after(state, "tile")

def route_after_wood(state: AgentState):
    return _next_after(state, "wood")

def route_after_stone(state: AgentState):
    return _next_after(state, "stone")

def route_after_paint(state: AgentState):
    return _next_after(state, "paint")

def route_after_catalog(state: AgentState):
    return _next_after(state, "catalog")


workflow = StateGraph(AgentState)

workflow.add_node("supervisor", chief_supervisor)
workflow.add_node("tile", tile_estimator)
workflow.add_node("wood", wood_specialist)
workflow.add_node("stone", stone_specialist)
workflow.add_node("paint", paint_consultant)
workflow.add_node("catalog", catalog_agent)
workflow.add_node("researcher", market_researcher)
workflow.add_node("inventory", inventory_administrator)
workflow.add_node("restock_researcher", restock_researcher)
workflow.add_node("synthesizer", synthesizer)

workflow.set_entry_point("supervisor")

_all_targets = {"tile": "tile", "wood": "wood", "stone": "stone", "paint": "paint",
                "catalog": "catalog", "researcher": "researcher",
                "inventory": "inventory", "synthesizer": "synthesizer"}

workflow.add_conditional_edges("supervisor", route_after_supervisor, _all_targets)
workflow.add_conditional_edges("tile", route_after_tile, _all_targets)
workflow.add_conditional_edges("wood", route_after_wood, _all_targets)
workflow.add_conditional_edges("stone", route_after_stone, _all_targets)
workflow.add_conditional_edges("paint", route_after_paint, _all_targets)
workflow.add_conditional_edges("catalog", route_after_catalog, _all_targets)
workflow.add_edge("researcher", "inventory")
workflow.add_edge("inventory", "restock_researcher")
workflow.add_edge("restock_researcher", "synthesizer")
workflow.add_edge("synthesizer", END)

memory = MemorySaver()
app_graph = workflow.compile(checkpointer=memory)
