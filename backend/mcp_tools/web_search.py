import os
from tavily import TavilyClient
from backend.core.config import settings

# Initialize Tavily Client
try:
    tavily_client = TavilyClient(api_key=settings.TAVILY_API_KEY)
except Exception:
    tavily_client = None

def tavily_web_search(query: str) -> str:
    """
    Melakukan pencarian di internet menggunakan Tavily API
    """
    if not tavily_client:
        return "Tavily API Key belum dikonfigurasi. Hasil pencarian simulasi: Tren saat ini adalah penggunaan warna netral dan material ramah lingkungan."
        
    try:
        response = tavily_client.search(query)
        # Ekstrak konten yang relevan dari response
        results = response.get('results', [])
        if not results:
            return "Tidak ada hasil pencarian ditemukan."
            
        formatted_results = []
        for r in results[:3]:  # Ambil 3 teratas
            formatted_results.append(f"- {r.get('title')}: {r.get('content')}")
            
        return "\n".join(formatted_results)
    except Exception as e:
        return f"Terjadi kesalahan saat mencari di web: {str(e)}"
