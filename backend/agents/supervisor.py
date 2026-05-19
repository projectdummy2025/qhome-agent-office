import os
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
supervisor_llm = ChatGoogleGenerativeAI(model="gemini-3-flash-preview", google_api_key=settings.GEMINI_API_KEY)

# Specialists
gemini_specialist = ChatGoogleGenerativeAI(model="gemini-3-flash-preview", google_api_key=settings.GEMINI_API_KEY)
groq_specialist = ChatGroq(model_name="qwen/qwen3-32b", api_key=settings.GROQ_API_KEY)

def chief_supervisor(state: AgentState):
    """Menganalisis brief dan menghire agen"""
    brief = state.get("brief", "")
    
    # Prompting Supervisor
    prompt = f"Berdasarkan brief ini: '{brief}', agen apa saja yang dibutuhkan? (Pilih dari: tile, wood, stone, paint, researcher). Jawab dengan format list python, contoh: ['tile', 'wood']."
    
    response = supervisor_llm.invoke(prompt)
    
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
        response = gemini_specialist.invoke(prompt)
        
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
        response = groq_specialist.invoke(prompt)
        
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
        response = groq_specialist.invoke(prompt)
        
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

def market_researcher(state: AgentState):
    """Market Research Analyst"""
    if "researcher" not in state.get("hired_agents", []):
        return state
    brief = state.get("brief", "")
    
    try:
        # Generate search query based on brief
        query_prompt = f"Berdasarkan brief: '{brief}', buat 1 kalimat query pencarian Google yang paling relevan untuk mencari tren atau ide desain interior terkait. Berikan HANYA teks query-nya."
        query_response = gemini_specialist.invoke(query_prompt)
        search_query = query_response.content.strip()
        
        from backend.mcp_tools.web_search import tavily_web_search
        search_result = tavily_web_search(search_query)
        
        # Analyze search results
        analysis_prompt = f"Berdasarkan hasil pencarian internet berikut: '{search_result[:500]}...', tuliskan 1 kalimat singkat temuan pasar (market insight) yang relevan untuk proyek dengan brief: '{brief}'."
        analysis_response = gemini_specialist.invoke(analysis_prompt)
        content = analysis_response.content.strip()
        
    except Exception:
        content = "Riset pasar saat ini difokuskan pada ketersediaan stok material di gudang lokal QHomeMart."
        
    report = {"agent": "Market Analyst", "content": content}
    return {"reports": state.get("reports", []) + [report]}

def synthesizer(state: AgentState):
    """Supervisor merangkum proposal dan membuat narasi"""
    products = []
    agent_reports_text = ""
    for r in state.get("reports", []):
        if "product" in r:
            products.append(r["product"])
        agent_reports_text += f"\n- Laporan {r['agent']}: {r['content']}"
        
    brief = state.get("brief", "")
    prompt = f"Anda adalah Chief Supervisor di Kalkulator RAB QHomeMart. Klien memiliki permintaan material berikut:\n'{brief}'\n\nModul spesialis telah memberikan rekomendasi berikut:{agent_reports_text}\n\nBuatlah 2-3 paragraf narasi profesional bergaya Asisten Belanja Teknis Supermarket Bahan Bangunan QHomeMart (tanpa sapaan salam, langsung to the point) yang merangkum estimasi kebutuhan material ini, kesesuaian teknisnya, dan mengapa ulasan produk yang dipilih (sebut nama produknya) sangat tepat untuk kebutuhan proyek klien. Jangan buat rincian harga karena akan ditampilkan terpisah. Format output harus teks paragraf biasa."
    
    try:
        response = supervisor_llm.invoke(prompt)
        content = response.content
        if isinstance(content, list):
            narrative = " ".join([str(c.get("text", c)) if isinstance(c, dict) else str(c) for c in content])
        else:
            narrative = str(content)
    except Exception as e:
        narrative = "Berdasarkan analisis mendalam dari tim spesialis kami, berikut adalah rekomendasi material yang paling sesuai dengan kriteria dan kebutuhan proyek Anda. Material ini dipilih secara spesifik untuk menjamin kualitas, fungsionalitas, serta estetika yang maksimal."

    return {"final_proposal": json.dumps({"narrative": narrative, "products": products})}

# Build Graph (Waterfall execution to avoid 429 errors)
workflow = StateGraph(AgentState)

workflow.add_node("supervisor", chief_supervisor)
workflow.add_node("tile", tile_estimator)
workflow.add_node("wood", wood_specialist)
workflow.add_node("paint", paint_consultant)
workflow.add_node("researcher", market_researcher)
workflow.add_node("synthesizer", synthesizer)

workflow.set_entry_point("supervisor")
workflow.add_edge("supervisor", "tile")
workflow.add_edge("tile", "wood")
workflow.add_edge("wood", "paint")
workflow.add_edge("paint", "researcher")
workflow.add_edge("researcher", "synthesizer")
workflow.add_edge("synthesizer", END)

app_graph = workflow.compile()
