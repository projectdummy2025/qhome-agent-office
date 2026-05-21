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

# Define models based on AgentRoster.md
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
    """Invoke LLM dengan retry + exponential backoff, serta fallback ke Groq."""
    for attempt in range(max_retries):
        try:
            return llm.invoke(prompt)
        except Exception as e:
            err_str = str(e)
            # Jika kena rate limit (429) atau resource exhausted
            if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str:
                if llm != groq_specialist:
                    print("Gemini Rate Limit (429) terdeteksi. Beralih ke Groq...")
                    try:
                        return groq_specialist.invoke(prompt)
                    except Exception as fallback_err:
                        print(f"Gagal melakukan fallback ke Groq: {fallback_err}")
                wait = 2 ** attempt  # 1s, 2s, 4s
                time.sleep(wait)
                continue
            
            # Jika error tipe lain, coba fallback ke Groq jika bukan Groq sendiri
            if llm != groq_specialist:
                print("Error terjadi pada LLM. Mengalihkan ke Groq...")
                try:
                    return groq_specialist.invoke(prompt)
                except Exception as fallback_err:
                    print(f"Fallback ke Groq gagal: {fallback_err}")
            raise
            
    # Jika loop selesai dan masih gagal, coba Groq sekali lagi sebagai pertolongan terakhir
    if llm != groq_specialist:
        print("Mencoba fallback akhir ke Groq...")
        try:
            return groq_specialist.invoke(prompt)
        except Exception:
            pass
        
    raise Exception(f"LLM gagal setelah {max_retries} percobaan.")


def chief_supervisor(state: AgentState):
    """Menganalisis brief dan menghire agen"""
    brief = state.get("brief", "")
    reports = state.get("reports", [])
    
    # Deteksi jika ini adalah revisi (ada report sebelumnya)
    if reports:
        existing_materials = []
        for r in reports:
            if "product" in r:
                p = r["product"]
                existing_materials.append(f"- {r['agent']}: {p.get('name')} (Qty: {p.get('qty')}, Total: Rp {p.get('total', 0):,})")
        
        materials_summary = "\n".join(existing_materials)
        prompt = (
            f"Klien mengajukan instruksi perubahan/revisi: '{brief}'.\n\n"
            f"Rencana belanja saat ini:\n{materials_summary}\n\n"
            "Analisislah instruksi baru ini. Tentukan agen spesialis mana saja yang perlu dipanggil kembali "
            "untuk merevisi rancangan di atas (tile, wood, stone, paint, researcher).\n"
            "Penting: Hanya pilih agen yang terpengaruh langsung oleh revisi klien. Jangan pilih agen yang tidak berubah.\n"
            "Jawab dengan format list python, contoh: ['tile']"
        )
    else:
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
        
        prompt = (
            f"Anda adalah Tile Estimator. Klien meminta: '{brief}'. "
            f"Anda memilih produk: {meta['name']} ({desc}). Coverage per dus: {meta['coverage']} m2. "
            "Ekstrak luas area lantai (m2) dari brief klien. Jika tidak ada ukuran luas di brief, asumsikan luas area 10 m2. "
            "Analisis juga pola pemasangan apakah standard (wastage 5%) or diagonal/vintage (wastage 10%). "
            "Format output HANYA JSON: {\"reasoning\": \"1 kalimat alasan estetis profesional pemilihan produk\", \"area_m2\": float, \"pattern\": \"standard\" atau \"vintage\"}"
        )
        response = _llm_invoke_with_retry(gemini_specialist, prompt)
        
        import json
        import re
        from backend.mcp_tools.calculators import calculate_tile_needs
        try:
            match = re.search(r'\{.*\}', response.content, re.DOTALL)
            res_json = json.loads(match.group(0)) if match else {"reasoning": response.content.strip(), "area_m2": 10.0, "pattern": "standard"}
            area_m2 = float(res_json.get("area_m2", 10.0))
            pattern = res_json.get("pattern", "standard")
            wastage = 10.0 if pattern == "vintage" else 5.0
            reasoning = res_json.get("reasoning", response.content.strip())
        except Exception:
            area_m2 = 10.0
            wastage = 5.0
            reasoning = response.content.strip()
            
        calc = calculate_tile_needs(area_m2, float(meta['coverage']), wastage)
        qty = calc["boxes_needed"]
        unit = "Dus"
        
        content = (
            f"{reasoning}. Dengan estimasi luas area lantai {area_m2} m2 menggunakan pola {pattern} "
            f"(wastage {wastage}%), dibutuhkan {qty} dus ubin. "
            f"Kalkulator sipil merekomendasikan tambahan {calc['cement_sacks_needed']} sak semen perekat "
            f"dan {calc['grout_bags_needed']} bag semen nat pendukung."
        )
        product_data = {"sku": meta["sku"], "name": meta["name"], "price": meta["price"], "qty": f"{qty} {unit} (Est)", "total": meta["price"] * qty}
    except Exception as e:
        content = f"Maaf, setelah menganalisis katalog, saya tidak menemukan material lantai yang persis sesuai permintaan. Detail {str(e)}"
        product_data = {"sku": "OOS-TILE", "name": "Menunggu Konfirmasi", "price": 0, "qty": "0", "total": 0}
        
    report = {"agent": "Tile Estimator", "content": content, "product": product_data}
    old_reports = [r for r in state.get("reports", []) if r.get("agent") != "Tile Estimator"]
    return {"reports": old_reports + [report]}

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
        
        prompt = (
            f"Anda adalah Wood Specialist. Klien meminta: '{brief}'. "
            f"Anda memilih produk: {meta['name']} ({desc}). Coverage per lembar: {meta['coverage']} m2. "
            "Ekstrak luas area dinding/panel (m2) dari brief klien. Jika tidak ada ukuran luas, asumsikan luas area 15 m2. "
            "Format output HANYA JSON: {\"reasoning\": \"1 kalimat alasan profesional pemilihan panel kayu\", \"area_m2\": float}"
        )
        response = _llm_invoke_with_retry(groq_specialist, prompt)
        
        import json
        import re
        from backend.mcp_tools.calculators import calculate_wood_needs
        try:
            match = re.search(r'\{.*\}', response.content, re.DOTALL)
            res_json = json.loads(match.group(0)) if match else {"reasoning": response.content.strip(), "area_m2": 15.0}
            area_m2 = float(res_json.get("area_m2", 15.0))
            reasoning = res_json.get("reasoning", response.content.strip())
        except Exception:
            area_m2 = 15.0
            reasoning = response.content.strip()
            
        calc = calculate_wood_needs(area_m2, float(meta['coverage']))
        qty = calc["panels_needed"]
        unit = "Lembar"
        
        content = (
            f"{reasoning}. Untuk luas bidang kayu {area_m2} m2, diperlukan sebanyak {qty} lembar panel. "
            f"Diperlukan pula {calc['coating_cans_needed']} kaleng cairan coating pelindung UV agar warna kayu tahan lama."
        )
        product_data = {"sku": meta["sku"], "name": meta["name"], "price": meta["price"], "qty": f"{qty} {unit} (Est)", "total": meta["price"] * qty}
    except Exception:
        content = "Maaf, saya tidak menemukan produk panel kayu yang sesuai di database."
        product_data = {"sku": "OOS-WOOD", "name": "Menunggu Konfirmasi", "price": 0, "qty": "0", "total": 0}
        
    report = {"agent": "Wood Specialist", "content": content, "product": product_data}
    old_reports = [r for r in state.get("reports", []) if r.get("agent") != "Wood Specialist"]
    return {"reports": old_reports + [report]}

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
        
        prompt = (
            f"Anda adalah Paint Consultant. Klien meminta: '{brief}'. "
            f"Anda memilih produk: {meta['name']} ({desc}). Coverage per pail: {meta['coverage']} m2. "
            "Ekstrak luas area dinding pengecatan (m2) dari brief klien. Jika brief menyebutkan ukuran kamar (misal 3x4 meter dengan tinggi 3 meter), "
            "hitung luas keliling dikali tinggi (2*(3+4)*3 = 42 m2). Jika tidak ada spesifikasi ukuran, asumsikan luas dinding 12 m2. "
            "Format output HANYA JSON: {\"reasoning\": \"1 kalimat alasan pemilihan warna cat\", \"area_m2\": float}"
        )
        response = _llm_invoke_with_retry(groq_specialist, prompt)
        
        import json
        import re
        from backend.mcp_tools.calculators import calculate_paint_needs
        try:
            match = re.search(r'\{.*\}', response.content, re.DOTALL)
            res_json = json.loads(match.group(0)) if match else {"reasoning": response.content.strip(), "area_m2": 12.0}
            area_m2 = float(res_json.get("area_m2", 12.0))
            reasoning = res_json.get("reasoning", response.content.strip())
        except Exception:
            area_m2 = 12.0
            reasoning = response.content.strip()
            
        calc = calculate_paint_needs(area_m2, float(meta['coverage']))
        qty = calc["pails_needed"]
        unit = "Pail"
        
        content = (
            f"{reasoning}. Dengan estimasi luas dinding {area_m2} m2 untuk pengecatan double-coat (2 lapis), "
            f"dibutuhkan {qty} pail cat utama dan {calc['primer_pails_needed']} pail cat primer alkali sealer dasar."
        )
        product_data = {"sku": meta["sku"], "name": meta["name"], "price": meta["price"], "qty": f"{qty} {unit} (Est)", "total": meta["price"] * qty}
    except Exception:
        content = "Maaf, saya tidak menemukan cat interior yang spesifik sesuai permintaan."
        product_data = {"sku": "OOS-PAINT", "name": "Menunggu Konfirmasi", "price": 0, "qty": "0", "total": 0}
        
    report = {"agent": "Paint Consultant", "content": content, "product": product_data}
    old_reports = [r for r in state.get("reports", []) if r.get("agent") != "Paint Consultant"]
    return {"reports": old_reports + [report]}

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
            f"Anda memilih produk: {meta['name']} ({desc}). Coverage per m2: {meta['coverage']} m2/unit. "
            "Ekstrak luas area dinding batu (m2) dari brief klien. Jika tidak ada ukuran luas, asumsikan luas area 15 m2. "
            "Format output HANYA JSON: {\"reasoning\": \"1-2 kalimat analisis profesional termasuk saran bonding agent dan persiapan dinding\", \"area_m2\": float}"
        )
        response = _llm_invoke_with_retry(gemini_specialist, prompt)
        
        import json
        import re
        from backend.mcp_tools.calculators import calculate_stone_needs
        try:
            match = re.search(r'\{.*\}', response.content, re.DOTALL)
            res_json = json.loads(match.group(0)) if match else {"reasoning": response.content.strip(), "area_m2": 15.0}
            area_m2 = float(res_json.get("area_m2", 15.0))
            reasoning = res_json.get("reasoning", response.content.strip())
        except Exception:
            area_m2 = 15.0
            reasoning = response.content.strip()
            
        calc = calculate_stone_needs(area_m2, float(meta['coverage']))
        qty = calc["stone_units_needed"]
        unit = "m2"
        
        content = (
            f"{reasoning}. Untuk luas dinding batu {area_m2} m2, diperlukan {qty} m2 batu alam. "
            f"Kalkulator merekomendasikan tambahan perekat khusus sebanyak {calc['bonding_agent_bags_needed']} sak heavy-duty bonding agent "
            f"dan {calc['grout_bags_needed']} sak joint filler pengisi nat batu."
        )
        product_data = {"sku": meta["sku"], "name": meta["name"], "price": meta["price"], "qty": f"{qty} {unit} (Est)", "total": meta["price"] * qty}
    except Exception as e:
        content = f"Maaf, produk Stone Veneer tidak ditemukan di katalog. Detail: {str(e)}"
        product_data = {"sku": "OOS-STONE", "name": "Menunggu Konfirmasi", "price": 0, "qty": "0", "total": 0}
        
    report = {"agent": "Stone Veneer Specialist", "content": content, "product": product_data}
    old_reports = [r for r in state.get("reports", []) if r.get("agent") != "Stone Veneer Specialist"]
    return {"reports": old_reports + [report]}

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
        
        # Analyze search results (Hybrid Pipeline: Groq Reasoning + Gemini Polish)
        analysis_prompt = f"Berdasarkan hasil pencarian internet berikut: '{search_result[:500]}...', lakukan analisis mendalam dan tuliskan temuan pasar (market insight) yang relevan untuk proyek dengan brief: '{brief}'."
        analysis_response = _llm_invoke_with_retry(groq_specialist, analysis_prompt)
        raw_res = analysis_response.content.strip()
        
        # Ekstraksi blok <think> dan teks bersih
        import re
        think_match = re.search(r'<think>([\s\S]*?)</think>', raw_res, re.IGNORECASE)
        thinking = think_match.group(1).strip() if think_match else ""
        clean_content = re.sub(r'<think>[\s\S]*?</think>', '', raw_res, flags=re.IGNORECASE).strip()
        
        # Gemini memoles teks akhir menjadi 1 kalimat super premium
        polish_prompt = (
            f"Anda adalah Market Analyst Senior di QHomeMart. Berikut adalah draf analisis pasar mentah hasil riset: '{clean_content}'. "
            "Tulis ulang draf tersebut menjadi HANYA 1 kalimat temuan pasar (market insight) yang sangat elegan, profesional, "
            "dan mudah dipahami oleh pelanggan."
        )
        gemini_response = _llm_invoke_with_retry(gemini_specialist, polish_prompt)
        polished_content = gemini_response.content.strip()
        # Bersihkan pemikiran yang bocor dari Gemini Polish
        polished_content = re.sub(r'<think>[\s\S]*?</think>', '', polished_content, flags=re.IGNORECASE).strip()
        
        # Satukan kembali untuk dikonsumsi UI ThinkingBlock
        if thinking:
            content = f"<think>{thinking}</think> {polished_content}"
        else:
            content = polished_content
            
    except Exception:
        content = "Riset pasar saat ini difokuskan pada ketersediaan stok material di gudang lokal QHomeMart."
        
    report = {"agent": "Market Analyst", "content": content}
    old_reports = [r for r in state.get("reports", []) if r.get("agent") != "Market Analyst"]
    return {"reports": old_reports + [report]}



def inventory_administrator(state: AgentState):
    """
    Inventory Administrator — Verifikasi ketersediaan stok gudang untuk setiap produk
    yang telah direkomendasikan oleh agen spesialis.
    Jika stok rendah (< 20) atau habis, merekomendasikan produk substitusi secara otomatis
    dan memperbarui list produk agar proposal ter-update dinamis.
    """
    # Bersihkan dari laporan inventory lama sebelum memproses yang baru
    reports = [r for r in state.get("reports", []) if r.get("agent") not in ["Inventory Administrator", "Inventory Administrator (Alt)"]]
    brief = state.get("brief", "")

    # Jalankan pengecekan stok
    from backend.core.database import SessionLocal
    from backend.models.schema import Product as ProductModel
    import re

    db = SessionLocal()
    stock_report_lines = []
    new_reports = []
    
    # Simpan produk alternatif yang ditambahkan untuk di-inject
    added_alternatives = []

    try:
        for r in reports:
            # Salin laporan agar tidak mengubah state asli secara kotor
            r_copy = dict(r)
            
            if "product" in r_copy:
                r_copy["product"] = dict(r_copy["product"])
                prod = r_copy["product"]
                prod_name = prod.get("name", "")
                
                if prod_name and prod_name != "Menunggu Konfirmasi":
                    # Cari produk di database
                    db_product = db.query(ProductModel).filter(
                        ProductModel.name.ilike(f"%{prod_name[:20]}%")
                    ).first()

                    if db_product:
                        qty_val = db_product.stock_qty
                        
                        if qty_val >= 20:
                            # Stok Aman
                            status = f"TERSEDIA — Stok {qty_val} unit di gudang."
                            stock_report_lines.append(f"- {db_product.name} (SKU: {db_product.sku}): {status}")
                        else:
                            # Stok Terbatas / Habis
                            if qty_val > 0:
                                status = f"TERBATAS — Hanya tersisa {qty_val} unit."
                            else:
                                status = "HABIS — Stok kosong."
                            
                            # Cari alternatif dinamis (kategori sama, stok >= 20, SKU berbeda)
                            alt = db.query(ProductModel).filter(
                                ProductModel.category == db_product.category,
                                ProductModel.stock_qty >= 20,
                                ProductModel.sku != db_product.sku
                            ).first()

                            if alt:
                                status += f" Disarankan alternatif: {alt.name} (SKU: {alt.sku}, Stok: {alt.stock_qty})."
                                
                                # Parse qty asli (misalnya "10 Dus (Est)" -> 10)
                                qty_str = prod.get("qty", "10")
                                try:
                                    qty_nums = re.findall(r'\d+', qty_str)
                                    qty_int = int(qty_nums[0]) if qty_nums else 10
                                except Exception:
                                    qty_int = 10
                                
                                # Tandai produk asli agar masuk ke "unavailable"
                                prod["sku"] = db_product.sku
                                prod["name"] = f"[STOK TERBATAS] {prod_name}"
                                prod["price"] = 0
                                prod["total"] = 0
                                
                                # Tambahkan produk alternatif ke daftar belanja utama
                                qty_suffix = "Unit"
                                for suff in ["Dus", "Lembar", "Pail", "m2"]:
                                    if suff.lower() in qty_str.lower():
                                        qty_suffix = suff
                                        break
                                
                                alt_product = {
                                    "sku": alt.sku,
                                    "name": alt.name,
                                    "price": alt.base_price,
                                    "qty": f"{qty_int} {qty_suffix} (Substitusi)",
                                    "total": alt.base_price * qty_int
                                }
                                added_alternatives.append(alt_product)
                            else:
                                status += " Tidak ada produk alternatif sejenis yang mencukupi saat ini."
                                prod["sku"] = db_product.sku
                                prod["name"] = f"[STOK HABIS] {prod_name}"
                                prod["price"] = 0
                                prod["total"] = 0

                            stock_report_lines.append(f"- {db_product.name} (SKU: {db_product.sku}): {status}")
                    else:
                        stock_report_lines.append(
                            f"- {prod_name}: Produk ditemukan di katalog namun belum terdaftar di sistem gudang. Perlu konfirmasi manual."
                        )
            
            new_reports.append(r_copy)
    finally:
        db.close()

    # Buat narasi log inventaris
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
        
        # Ekstraksi think & content
        think_match = re.search(r'<think>([\s\S]*?)</think>', raw_res, re.IGNORECASE)
        thinking = think_match.group(1).strip() if think_match else ""
        clean_content = re.sub(r'<think>[\s\S]*?</think>', '', raw_res, flags=re.IGNORECASE).strip()
        
        # Gemini Polish
        polish_prompt = (
            f"Anda adalah Kepala Administrasi Gudang QHomeMart. Berikut adalah draf laporan persediaan barang pergudangan: '{clean_content}'. "
            "Tulis ulang draf tersebut menjadi HANYA 1-2 kalimat laporan inventaris yang sangat rapi, formal, "
            "dan berwibawa untuk diserahkan kepada Chief Supervisor."
        )
        gemini_response = _llm_invoke_with_retry(gemini_specialist, polish_prompt)
        polished_content = gemini_response.content.strip()
        # Bersihkan pemikiran yang bocor dari Gemini Polish
        polished_content = re.sub(r'<think>[\s\S]*?</think>', '', polished_content, flags=re.IGNORECASE).strip()
        
        if thinking:
            content = f"<think>{thinking}</think> {polished_content}"
        else:
            content = polished_content
            
    except Exception:
        content = (
            f"Laporan Stok Gudang: {stock_summary}. "
            "Seluruh rekomendasi material telah diverifikasi ketersediaannya."
        )

    # Buat laporan akhir Inventory Administrator
    inv_report = {"agent": "Inventory Administrator", "content": content}
    
    # Jika ada alternatif, tambahkan ke laporan agar synthesizer otomatis memasukannya ke proposal
    if added_alternatives:
        # Kita masukkan produk alternatif pertama ke inv_report
        inv_report["product"] = added_alternatives[0]
        # Jika ada produk alternatif lain, buat laporan dummy untuk menyalurkannya
        for extra_alt in added_alternatives[1:]:
            new_reports.append({
                "agent": "Inventory Administrator (Alt)",
                "content": f"Substitusi material tambahan: {extra_alt['name']}",
                "product": extra_alt
            })

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
    from datetime import datetime, timezone
    products = []
    agent_reports_text = ""
    import re
    for r in state.get("reports", []):
        if "product" in r:
            products.append(r["product"])
        clean_report_content = re.sub(r'<think>[\s\S]*?</think>', '', r['content'], flags=re.IGNORECASE).strip()
        agent_reports_text += f"\n- Laporan {r['agent']}: {clean_report_content}"

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

from langgraph.checkpoint.memory import MemorySaver
memory = MemorySaver()
app_graph = workflow.compile(checkpointer=memory)

