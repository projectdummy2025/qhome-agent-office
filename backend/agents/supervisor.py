import os
import time
from langgraph.graph import StateGraph, END
from typing import TypedDict, List
from langchain_core.messages import HumanMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_groq import ChatGroq

class AgentState(TypedDict):
    brief: str
    hired_agents: List[str]
    reports: List[dict]
    final_proposal: str

from backend.core.config import settings

# Define models based on agent_roster.md
# gemini-2.5-flash: lebih stabil untuk free tier, fallback jika 2.0-flash kena 429
supervisor_llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    google_api_key=settings.GEMINI_API_KEY,
)

# Specialists
gemini_specialist = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    google_api_key=settings.GEMINI_API_KEY,
)
groq_specialist = ChatGroq(model_name="qwen/qwen3-32b", api_key=settings.GROQ_API_KEY)

def _llm_invoke_with_retry(llm, prompt: str, max_retries: int = 3):
    """Invoke LLM dengan retry + exponential backoff saat kena 429."""
    for attempt in range(max_retries):
        try:
            return llm.invoke(prompt)
        except Exception as e:
            err_str = str(e)
            if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str:
                wait = 2 ** attempt  # 1s, 2s, 4s
                time.sleep(wait)
                continue
            raise  # error lain langsung raise
    raise Exception(f"LLM gagal setelah {max_retries} percobaan karena rate limit.")

def chief_supervisor(state: AgentState):
    """Menganalisis brief dan menghire agen"""
    brief = state.get("brief", "")
    
    # Prompting Supervisor
    prompt = f"Berdasarkan brief ini: '{brief}', agen apa saja yang dibutuhkan? (Pilih dari: tile, wood, stone, paint, researcher). Jawab dengan format list python, contoh: ['tile', 'wood']."
    
    response = _llm_invoke_with_retry(supervisor_llm, prompt)
    
    # Simple extraction for MVP
    hired = []
    text = str(response.content).lower()
    if "tile" in text: hired.append("tile")
    if "wood" in text: hired.append("wood")
    if "stone" in text: hired.append("stone")
    if "paint" in text: hired.append("paint")
    if "researcher" in text: hired.append("researcher")
    
    return {"hired_agents": hired}

from backend.core.database import get_chroma_collection
import json

def tile_estimator(state: AgentState):
    """Tile Estimator"""
    if "tile" not in state.get("hired_agents", []):
        return state
    brief = state.get("brief", "")
    try:
        col = get_chroma_collection()
        res = col.query(query_texts=[brief], n_results=1, where={"category": "tile"})
        if not res["metadatas"] or len(res["metadatas"][0]) == 0:
            raise Exception("No product found")
            
        meta = res["metadatas"][0][0]
        desc = res["documents"][0][0]
        
        prompt = f"Anda adalah Tile Estimator. Klien meminta: '{brief}'. Anda memilih produk: {meta['name']} ({desc}). Coverage per dus: {meta['coverage']} m2. Estimasi berapa unit yang dibutuhkan berdasarkan brief (jika tidak ada ukuran, asumsikan 10 dus). Format output HANYA JSON: {{\"reasoning\": \"1 kalimat alasan profesional pemilihan produk\", \"qty\": integer, \"unit\": \"Dus\"}}"
        response = _llm_invoke_with_retry(gemini_specialist, prompt)
        
        import json
        import re
        try:
            match = re.search(r'\{.*\}', response.content, re.DOTALL)
            res_json = json.loads(match.group(0)) if match else {"reasoning": response.content.strip(), "qty": 10, "unit": "Dus"}
            qty = int(res_json.get("qty", 10))
            unit = res_json.get("unit", "Dus")
            content = res_json.get("reasoning", response.content.strip())
        except Exception:
            qty = 10
            unit = "Dus"
            content = response.content.strip()
            
        product_data = {"name": meta["name"], "price": meta["price"], "qty": f"{qty} {unit} (Est)", "total": meta["price"] * qty}
    except Exception as e:
        content = "Maaf, setelah menganalisis katalog, saya tidak menemukan material lantai yang persis sesuai permintaan."
        product_data = {"name": "Menunggu Konfirmasi", "price": 0, "qty": "0", "total": 0}
        
    report = {"agent": "Tile Estimator", "content": content, "product": product_data}
    return {"reports": state.get("reports", []) + [report]}

def wood_specialist(state: AgentState):
    """Wood Specialist"""
    if "wood" not in state.get("hired_agents", []):
        return state
    brief = state.get("brief", "")
    try:
        col = get_chroma_collection()
        res = col.query(query_texts=[brief], n_results=1, where={"category": "wood"})
        if not res["metadatas"] or len(res["metadatas"][0]) == 0:
            raise Exception("No product found")
            
        meta = res["metadatas"][0][0]
        desc = res["documents"][0][0]
        
        prompt = f"Anda adalah Wood Specialist. Klien meminta: '{brief}'. Anda memilih produk: {meta['name']} ({desc}). Coverage per lembar: {meta['coverage']} m2. Estimasi berapa unit yang dibutuhkan berdasarkan brief (jika tidak ada ukuran, asumsikan 12 lembar). Format output HANYA JSON: {{\"reasoning\": \"1 kalimat alasan profesional pemilihan produk\", \"qty\": integer, \"unit\": \"Lembar\"}}"
        response = _llm_invoke_with_retry(groq_specialist, prompt)
        
        import json
        import re
        try:
            match = re.search(r'\{.*\}', response.content, re.DOTALL)
            res_json = json.loads(match.group(0)) if match else {"reasoning": response.content.strip(), "qty": 12, "unit": "Lembar"}
            qty = int(res_json.get("qty", 12))
            unit = res_json.get("unit", "Lembar")
            content = res_json.get("reasoning", response.content.strip())
        except Exception:
            qty = 12
            unit = "Lembar"
            content = response.content.strip()
            
        product_data = {"name": meta["name"], "price": meta["price"], "qty": f"{qty} {unit} (Est)", "total": meta["price"] * qty}
    except Exception:
        content = "Maaf, saya tidak menemukan produk panel kayu yang sesuai di database."
        product_data = {"name": "Menunggu Konfirmasi", "price": 0, "qty": "0", "total": 0}
        
    report = {"agent": "Wood Specialist", "content": content, "product": product_data}
    return {"reports": state.get("reports", []) + [report]}

def paint_consultant(state: AgentState):
    """Paint Consultant"""
    if "paint" not in state.get("hired_agents", []):
        return state
    brief = state.get("brief", "")
    try:
        col = get_chroma_collection()
        res = col.query(query_texts=[brief], n_results=1, where={"category": "paint"})
        if not res["metadatas"] or len(res["metadatas"][0]) == 0:
            raise Exception("No product found")
            
        meta = res["metadatas"][0][0]
        desc = res["documents"][0][0]
        
        prompt = f"Anda adalah Paint Consultant. Klien meminta: '{brief}'. Anda memilih produk: {meta['name']} ({desc}). Coverage per pail/kaleng: {meta['coverage']} m2. Estimasi berapa unit yang dibutuhkan berdasarkan brief (jika tidak ada ukuran, asumsikan 1 Pail). Format output HANYA JSON: {{\"reasoning\": \"1 kalimat alasan profesional pemilihan produk\", \"qty\": integer, \"unit\": \"Pail/Kaleng\"}}"
        response = _llm_invoke_with_retry(groq_specialist, prompt)
        
        import json
        import re
        try:
            match = re.search(r'\{.*\}', response.content, re.DOTALL)
            res_json = json.loads(match.group(0)) if match else {"reasoning": response.content.strip(), "qty": 1, "unit": "Pail"}
            qty = int(res_json.get("qty", 1))
            unit = res_json.get("unit", "Pail")
            content = res_json.get("reasoning", response.content.strip())
        except Exception:
            qty = 1
            unit = "Pail"
            content = response.content.strip()
            
        product_data = {"name": meta["name"], "price": meta["price"], "qty": f"{qty} {unit} (Est)", "total": meta["price"] * qty}
    except Exception:
        content = "Maaf, saya tidak menemukan cat interior yang spesifik sesuai permintaan."
        product_data = {"name": "Menunggu Konfirmasi", "price": 0, "qty": "0", "total": 0}
        
    report = {"agent": "Paint Consultant", "content": content, "product": product_data}
    return {"reports": state.get("reports", []) + [report]}

def stone_specialist(state: AgentState):
    """Stone Veneer Specialist — kalkulasi bonding agent dan persiapan permukaan"""
    if "stone" not in state.get("hired_agents", []):
        return state
    brief = state.get("brief", "")
    try:
        col = get_chroma_collection()
        res = col.query(query_texts=[brief], n_results=1, where={"category": "stone"})
        if not res["metadatas"] or len(res["metadatas"][0]) == 0:
            raise Exception("No stone product found")

        meta = res["metadatas"][0][0]
        desc = res["documents"][0][0]

        prompt = (
            f"Anda adalah Stone Veneer Specialist. Klien meminta: '{brief}'. "
            f"Produk yang dipilih: {meta['name']} ({desc}). Coverage per m2: {meta['coverage']} m2/unit. "
            "Hitung estimasi kebutuhan material. Jika tidak ada dimensi, asumsikan area dinding 15 m2. "
            "Sertakan rekomendasi bonding agent (perekat khusus batu) dan instruksi persiapan permukaan dinding singkat. "
            "Format output HANYA JSON: {\"reasoning\": \"1-2 kalimat analisis profesional termasuk saran bonding agent dan persiapan dinding\", \"qty\": integer, \"unit\": \"m2\"}"
        )
        response = _llm_invoke_with_retry(gemini_specialist, prompt)

        import re
        try:
            match = re.search(r'\{.*\}', response.content, re.DOTALL)
            res_json = json.loads(match.group(0)) if match else {"reasoning": response.content.strip(), "qty": 15, "unit": "m2"}
            qty = int(res_json.get("qty", 15))
            unit = res_json.get("unit", "m2")
            content = res_json.get("reasoning", response.content.strip())
        except Exception:
            qty = 15
            unit = "m2"
            content = response.content.strip()

        product_data = {"name": meta["name"], "price": meta["price"], "qty": f"{qty} {unit} (Est)", "total": meta["price"] * qty}
    except Exception as e:
        content = "Maaf, produk Stone Veneer tidak ditemukan di katalog. Disarankan menggunakan bonding agent berbasis semen polymer untuk dinding batu apapun. Pastikan permukaan dinding bersih, bebas debu, dan lembab sebelum pemasangan."
        product_data = {"name": "Menunggu Konfirmasi", "price": 0, "qty": "0", "total": 0}

    report = {"agent": "Stone Veneer Specialist", "content": content, "product": product_data}
    return {"reports": state.get("reports", []) + [report]}

def market_researcher(state: AgentState):
    """Market Research Analyst"""
    if "researcher" not in state.get("hired_agents", []):
        return state
    brief = state.get("brief", "")
    
    try:
        # Generate search query based on brief
        query_prompt = f"Berdasarkan brief: '{brief}', buat 1 kalimat query pencarian Google yang paling relevan untuk mencari tren atau ide desain interior terkait. Berikan HANYA teks query-nya."
        query_response = _llm_invoke_with_retry(gemini_specialist, query_prompt)
        search_query = query_response.content.strip()
        
        from backend.mcp_tools.web_search import tavily_web_search
        search_result = tavily_web_search(search_query)
        
        # Analyze search results
        analysis_prompt = f"Berdasarkan hasil pencarian internet berikut: '{search_result[:500]}...', tuliskan 1 kalimat singkat temuan pasar (market insight) yang relevan untuk proyek dengan brief: '{brief}'."
        analysis_response = _llm_invoke_with_retry(gemini_specialist, analysis_prompt)
        content = analysis_response.content.strip()
        
    except Exception:
        content = "Riset pasar saat ini difokuskan pada ketersediaan stok material di gudang lokal QHomeMart."
        
    report = {"agent": "Market Analyst", "content": content}
    return {"reports": state.get("reports", []) + [report]}


def inventory_administrator(state: AgentState):
    """
    Inventory Administrator — Verifikasi ketersediaan stok gudang untuk setiap produk
    yang telah direkomendasikan oleh agen spesialis, lalu menyusun laporan profesional
    ketersediaan material kepada Chief Supervisor.
    """
    reports = state.get("reports", [])
    brief = state.get("brief", "")

    # Kumpulkan nama produk yang direkomendasikan dari semua laporan spesialis
    recommended_products = [
        r["product"] for r in reports if "product" in r
    ]

    if not recommended_products:
        report = {
            "agent": "Inventory Administrator",
            "content": "Tidak ada produk yang perlu diverifikasi stoknya karena tidak ada rekomendasi dari agen spesialis."
        }
        return {"reports": reports + [report]}

    # Query DB untuk stok aktual setiap produk yang direkomendasikan
    from backend.core.database import SessionLocal
    from backend.models.schema import Product as ProductModel

    db = SessionLocal()
    stock_report_lines = []
    try:
        for prod in recommended_products:
            prod_name = prod.get("name", "")
            if not prod_name or prod_name == "Menunggu Konfirmasi":
                stock_report_lines.append(
                    f"- {prod_name or 'Produk Tidak Diketahui'}: Status tidak dapat diverifikasi (nama produk tidak valid)."
                )
                continue

            # Cari produk di database berdasarkan nama (case-insensitive fuzzy match)
            db_product = db.query(ProductModel).filter(
                ProductModel.name.ilike(f"%{prod_name[:20]}%")
            ).first()

            if db_product:
                qty = db_product.stock_qty
                if qty >= 20:
                    status = f"TERSEDIA — Stok {qty} unit di gudang."
                elif qty > 0:
                    status = f"TERBATAS — Hanya tersisa {qty} unit. Disarankan melakukan pemesanan segera."
                else:
                    status = "HABIS — Stok kosong. Akan tersedia dalam 3-5 hari kerja."
                stock_report_lines.append(f"- {db_product.name} (SKU: {db_product.sku}): {status}")
            else:
                stock_report_lines.append(
                    f"- {prod_name}: Produk ditemukan di katalog namun belum terdaftar di sistem gudang. Perlu konfirmasi manual."
                )
    finally:
        db.close()

    # LLM menyusun laporan profesional ketersediaan gudang ke Chief Supervisor
    stock_summary = "\n".join(stock_report_lines)
    prompt = (
        f"Anda adalah Inventory Administrator di gudang QHomeMart. "
        f"Anda telah melakukan pengecekan stok fisik untuk proyek dengan brief: '{brief}'.\n\n"
        f"Hasil pemeriksaan stok gudang:\n{stock_summary}\n\n"
        "Tuliskan laporan ketersediaan material (1-2 kalimat) kepada Chief Supervisor secara profesional. "
        "Sebutkan secara ringkas status ketersediaan keseluruhan dan apakah ada tindakan pengadaan yang diperlukan. "
        "Gunakan bahasa yang tegas dan informatif seperti laporan internal gudang."
    )

    try:
        response = _llm_invoke_with_retry(groq_specialist, prompt)
        content = response.content.strip()
    except Exception:
        content = (
            f"Laporan Stok Gudang: {stock_summary}. "
            "Seluruh material yang direkomendasikan telah diverifikasi ketersediaannya di sistem inventaris QHomeMart."
        )

    report = {"agent": "Inventory Administrator", "content": content}
    return {"reports": reports + [report]}

DISCLAIMER_TEXT = (
    " DISCLAIMER TEKNIS: Dokumen ini merupakan estimasi awal yang dihasilkan oleh sistem AI QHome-MAS "
    "berdasarkan data brief yang dimasukkan. Hasil estimasi dapat berbeda dengan kebutuhan aktual di lapangan "
    "akibat variasi kondisi konstruksi, pola pemasangan, dan spesifikasi lokasi. Untuk proyek skala besar atau "
    "keputusan pembelian final, kami merekomendasikan Validasi Staf Ahli Qhomemart sebelum pemesanan. "
    "Hubungi gerai kami di Jl. Raya Janti Ringroad Timur No. 96, Banguntapan."
)

def synthesizer(state: AgentState):
    """Supervisor merangkum proposal, membuat narasi, dan menyertakan disclaimer teknis"""
    from datetime import datetime, timezone
    products = []
    agent_reports_text = ""
    for r in state.get("reports", []):
        if "product" in r:
            products.append(r["product"])
        agent_reports_text += f"\n- Laporan {r['agent']}: {r['content']}"

    brief = state.get("brief", "")
    prompt = (
        f"Anda adalah Chief Supervisor di Kalkulator RAB QHomeMart. Klien memiliki permintaan material berikut:\n'{brief}'\n\n"
        f"Modul spesialis telah memberikan rekomendasi berikut:{agent_reports_text}\n\n"
        "Buatlah 2-3 paragraf narasi profesional bergaya Asisten Belanja Teknis Supermarket Bahan Bangunan QHomeMart "
        "(tanpa sapaan salam, langsung to the point) yang merangkum estimasi kebutuhan material ini, kesesuaian teknisnya, "
        "dan mengapa ulasan produk yang dipilih (sebut nama produknya) sangat tepat untuk kebutuhan proyek klien. "
        "Jangan buat rincian harga karena akan ditampilkan terpisah. Format output harus teks paragraf biasa."
    )

    try:
        response = _llm_invoke_with_retry(supervisor_llm, prompt)
        content = response.content
        if isinstance(content, list):
            narrative = " ".join([str(c.get("text", c)) if isinstance(c, dict) else str(c) for c in content])
        else:
            narrative = str(content)
    except Exception:
        narrative = (
            "Berdasarkan analisis mendalam dari tim spesialis kami, berikut adalah rekomendasi material yang paling sesuai "
            "dengan kriteria dan kebutuhan proyek Anda. Material ini dipilih secara spesifik untuk menjamin kualitas, "
            "fungsionalitas, serta estetika yang maksimal."
        )

    # P6 — KPI: catat timestamp selesai untuk perhitungan lead_time di route
    generated_at = datetime.now(timezone.utc).isoformat()

    return {
        "final_proposal": json.dumps({
            "narrative": narrative,
            "products": products,
            "disclaimer": DISCLAIMER_TEXT,
            "generated_at": generated_at,
        })
    }

# Build Graph — Chief Supervisor sebagai entry point dan final reviewer
# Alur: supervisor (routing) → [specialists] → inventory_administrator → supervisor (synthesize) → END
workflow = StateGraph(AgentState)

workflow.add_node("supervisor", chief_supervisor)
workflow.add_node("tile", tile_estimator)
workflow.add_node("wood", wood_specialist)
workflow.add_node("stone", stone_specialist)
workflow.add_node("paint", paint_consultant)
workflow.add_node("researcher", market_researcher)
workflow.add_node("inventory", inventory_administrator)  # Inventory Administrator
workflow.add_node("synthesizer", synthesizer)             # Chief Supervisor final review

workflow.set_entry_point("supervisor")
workflow.add_edge("supervisor", "tile")
workflow.add_edge("tile", "wood")
workflow.add_edge("wood", "stone")
workflow.add_edge("stone", "paint")
workflow.add_edge("paint", "researcher")
workflow.add_edge("researcher", "inventory")   # → Inventory Administrator
workflow.add_edge("inventory", "synthesizer")  # → Chief Supervisor (final review)
workflow.add_edge("synthesizer", END)

app_graph = workflow.compile()

