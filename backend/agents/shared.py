import re
import time
from typing import TypedDict, List
from openai import OpenAI
from backend.core.config import settings
from backend.core.database import SessionLocal, get_chroma_collection
from backend.models.schema import Product as ProductModel

class AgentState(TypedDict):
    brief: str
    hired_agents: List[str]
    reports: List[dict]
    final_proposal: str
    history_summary: str
    session_id: str
    intent: str  # "conversational" atau "estimation"
    # Produk yang sudah di-resolve oleh specialist sebelumnya.
    # Format: [{"sku": str, "name": str, "role": "cement"|"grout"|"primer"|"coating"|"bonding"}]
    # Dipakai agar specialist berikutnya tidak resolve produk pendukung yang sama dua kali.
    resolved_supporting: List[dict]

class SumoPodLLM:
    def __init__(self, api_key: str, base_url: str, model: str):
        self.client = OpenAI(
            api_key=api_key or "dummy_key",
            base_url=base_url or "https://ai.sumopod.com/v1"
        )
        self.model = model

    def invoke(self, prompt: str):
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
        )
        
        class LLMResponse:
            def __init__(self, content):
                self.content = content
                
        return LLMResponse(response.choices[0].message.content)

supervisor_llm = SumoPodLLM(
    api_key=settings.SUMOPOD_API_KEY,
    base_url=settings.SUMOPOD_API_BASE,
    model=settings.SUPERVISOR_MODEL,
)

gemini_specialist = SumoPodLLM(
    api_key=settings.SUMOPOD_API_KEY,
    base_url=settings.SUMOPOD_API_BASE,
    model=settings.SUBAGENT_MODEL,
)

groq_specialist = SumoPodLLM(
    api_key=settings.SUMOPOD_API_KEY,
    base_url=settings.SUMOPOD_API_BASE,
    model=settings.SUBAGENT_MODEL,
)

def _llm_invoke_with_retry(llm, prompt: str, max_retries: int = 3):
    """Invoke LLM dengan retry + exponential backoff, serta fallback ke Groq."""
    for attempt in range(max_retries):
        try:
            return llm.invoke(prompt)
        except Exception as e:
            err_str = str(e)
            if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str:
                if llm != groq_specialist:
                    print("Gemini Rate Limit (429) terdeteksi. Beralih ke Groq...")
                    try:
                        return groq_specialist.invoke(prompt)
                    except Exception as fallback_err:
                        print(f"Gagal melakukan fallback ke Groq: {fallback_err}")
                wait = 2**attempt
                time.sleep(wait)
                continue

            if llm != groq_specialist:
                print("Error terjadi pada LLM. Mengalihkan ke Groq...")
                try:
                    return groq_specialist.invoke(prompt)
                except Exception as fallback_err:
                    print(f"Fallback ke Groq gagal: {fallback_err}")
            raise

    if llm != groq_specialist:
        print("Mencoba fallback akhir ke Groq...")
        try:
            return groq_specialist.invoke(prompt)
        except Exception:
            pass

    raise Exception(f"LLM gagal setelah {max_retries} percobaan.")

def _should_reuse_product(brief: str, agent_type: str, state: AgentState) -> dict:
    reports = state.get("reports", [])
    previous_product = None
    for r in reports:
        if r.get("agent") == agent_type and "product" in r:
            prod = r["product"]
            if prod.get("name") and "[STOK" not in prod.get("name", "") and "Menunggu" not in prod.get("name", ""):
                previous_product = prod
                break
    
    if not previous_product:
        return {"should_reuse": False, "product": None}
    
    change_indicators = [
        "ganti", "alternatif", "lain", "selain", "beda", "ubah", "tukar",
        "replace", "different", "alternative", "other", "change",
        "tidak mau", "jangan", "don't want", "switch", "ubahlah"
    ]
    
    brief_lower = brief.lower()
    for indicator in change_indicators:
        if indicator in brief_lower:
            return {"should_reuse": False, "product": None}
    
    reuse_indicators = [
        "stok", "berapa stok", "stock", "harga", "price", "jumlah", "total",
        "berapa banyak", "quantity", "qty", "restock", "tambah", "kurangi",
        "revisi", "ulang kalkulasi", "recalculate", "brapa", "bayar", "cost",
        "rupiah", "rp", "nominal"
    ]
    
    for reuse_indicator in reuse_indicators:
        if reuse_indicator in brief_lower:
            return {
                "should_reuse": True,
                "product": {
                    "sku": previous_product.get("sku"),
                    "name": previous_product.get("name"),
                    "price": previous_product.get("price"),
                    "coverage": previous_product.get("coverage", 0),
                }
            }
    
    return {
        "should_reuse": True,
        "product": {
            "sku": previous_product.get("sku"),
            "name": previous_product.get("name"),
            "price": previous_product.get("price"),
            "coverage": previous_product.get("coverage", 0),
        }
    }

def _get_stock_and_details_for_sku(sku: str) -> dict:
    db = SessionLocal()
    try:
        p = db.query(ProductModel).filter(ProductModel.sku == sku).first()
        if p:
            return {
                "sku": p.sku,
                "name": p.name,
                "base_price": p.base_price,
                "coverage_m2": p.coverage_m2,
                "stock_qty": p.stock_qty,
                "desc": p.desc or ""
            }
        return None
    finally:
        db.close()

def _get_candidates_with_stock(query_text: str, category: str, limit: int = 5) -> list:
    try:
        col = get_chroma_collection()
        res = col.query(query_texts=[query_text], n_results=limit, where={"category": category})
        if not res["metadatas"] or len(res["metadatas"][0]) == 0:
            return []
        
        candidates = []
        for i in range(len(res["metadatas"][0])):
            meta = res["metadatas"][0][i]
            desc = res["documents"][0][i] if (res["documents"] and len(res["documents"][0]) > i) else ""
            sku = meta.get("sku")
            db_details = _get_stock_and_details_for_sku(sku)
            if db_details:
                candidates.append(db_details)
            else:
                candidates.append({
                    "sku": sku,
                    "name": meta.get("name"),
                    "base_price": meta.get("price"),
                    "coverage_m2": meta.get("coverage"),
                    "stock_qty": 0,
                    "desc": desc
                })
        return candidates
    except Exception as e:
        print(f"Error getting candidates with stock: {e}")
        return []

def _format_candidates_for_prompt(candidates: list) -> str:
    lines = []
    for i, c in enumerate(candidates, 1):
        lines.append(
            f"{i}. SKU: {c['sku']}\n"
            f"   Nama: {c['name']}\n"
            f"   Coverage: {c['coverage_m2']} m2/unit\n"
            f"   Harga: Rp {c['base_price']:,}\n"
            f"   Stok Gudang: {c['stock_qty']} unit\n"
            f"   Deskripsi: {c['desc']}"
        )
    return "\n".join(lines)


_SUPPORT_HINTS = {
    "cement": [
        r"lemkra\s*fk[\s-]*\d+",
        r"sika[\w\s-]*\d+",
        r"semen\s+(perekat|instan)[\w\s#]*",
        r"mortar\s+utama[\w\s-]*",
        r"mu[\s-]*\d+",
    ],
    "grout": [
        r"am\s*\d+",
        r"nat\s+keramik[\w\s-]*",
        r"tile\s+grout[\w\s-]*",
        r"pengisi\s+nat[\w\s-]*",
    ],
    "primer": [
        r"alkali\s+sealer[\w\s-]*",
        r"wall\s+primer[\w\s-]*",
        r"cat\s+dasar[\w\s-]*",
        r"mowilex\s+primer[\w\s-]*",
        r"nippon\s+primer[\w\s-]*",
    ],
    "coating": [
        r"propan[\w\s-]*",
        r"mowilex\s+wood[\w\s-]*",
        r"polyurethane[\w\s-]*",
        r"wood\s+sealer[\w\s-]*",
        r"coating\s+kayu[\w\s-]*",
    ],
}


def _extract_explicit_support(brief: str, role: str) -> str | None:
    """Ekstrak nama produk pendukung eksplisit dari brief berdasarkan role.
    Kembalikan substring asli yang cocok, atau None.
    """
    patterns = _SUPPORT_HINTS.get(role, [])
    for pat in patterns:
        m = re.search(pat, brief, re.IGNORECASE)
        if m:
            return m.group(0).strip()
    return None


_BUYING_INTENT_WORDS = [
    "pesan", "order", "beli", "butuh", "kebutuhan", "hitung", "kalkulasi",
    "estimasi", "rab", "berapa", "saya mau", "saya ingin", "tolong carikan",
    "tolong hitung", "cari", "pengadaan", "cek stok", "cek ketersediaan",
    "m2", "meter", "luas", "unit", "sak", "dus", "pail", "lembar", "bag",
    "wastage", "carikan", "tampilkan", "sertakan",
]

def _has_buying_intent(brief: str) -> bool:
    """True kalau brief mengarah ke pembelian/order — bukan sekadar konsultasi."""
    brief_lower = brief.lower()
    return any(w in brief_lower for w in _BUYING_INTENT_WORDS)


_AREA_PATTERN = re.compile(
    r'(?:'
    r'\d+(?:[.,]\d+)?\s*(?:m2|m²|meter\s*persegi)'  # 10 m2, 10 m², 10 meter persegi
    r'|\d+\s*[x×]\s*\d+\s*(?:meter|m\b)'             # 3x4 meter, 3×4 m
    r'|\d+(?:[.,]\d+)?\s*m\b'                         # 10 m, 3 m (standalone)
    r')',
    re.IGNORECASE,
)

def _has_area_in_text(*texts: str) -> bool:
    """True jika salah satu teks mengandung dimensi area (m2/m²/meter persegi).
    Terima multiple strings — cukup satu yang cocok sudah dianggap ada area.
    """
    for t in texts:
        if t and _AREA_PATTERN.search(t):
            return True
    return False


def _find_product_by_name_sql(query_text: str, category: str = None, limit: int = 5) -> list:
    """SQL ILIKE search di kolom name DAN desc — desc memuat brand (Roman/Sandimas/dll)
    yang tidak ada di name, sehingga brand eksplisit dari user bisa terfilter.
    Coba AND semua token dulu, fallback ke OR kalau kosong.
    """
    from sqlalchemy import and_, or_

    stop_words = {
        "untuk", "dari", "yang", "dengan", "dan", "atau", "di", "ke", "pada",
        "sebanyak", "seluas", "tolong", "cari", "hitung", "carikan", "saya",
        "ingin", "mau", "kami", "ada", "juga", "ini", "itu", "area", "lantai",
        "dinding", "ruang", "kamar", "mandi", "tamu", "teras", "toilet",
        "katalog", "qhomemart", "toko", "ketersediaan", "cek", "motif",
        "pola", "standard", "vintage", "pemasangannya", "pemasangan", "ubin",
    }
    tokens = [
        t for t in re.sub(r"[^\w\s]", " ", query_text.lower()).split()
        if len(t) >= 3 and t not in stop_words
    ]
    if not tokens:
        return []

    def _token_clause(token: str):
        return or_(
            ProductModel.name.ilike(f"%{token}%"),
            ProductModel.desc.ilike(f"%{token}%"),
        )

    db = SessionLocal()
    try:
        q = db.query(ProductModel)
        if category:
            q = q.filter(ProductModel.category == category)

        # AND — semua token harus ada di name atau desc
        and_results = q.filter(
            and_(*[_token_clause(t) for t in tokens[:8]])
        ).limit(limit).all()

        if and_results:
            results = and_results
        else:
            # OR — minimal salah satu token cocok
            results = q.filter(
                or_(*[_token_clause(t) for t in tokens[:8]])
            ).limit(limit).all()

        return [{
            "sku": p.sku,
            "name": p.name,
            "base_price": p.base_price,
            "coverage_m2": p.coverage_m2 or 0,
            "stock_qty": p.stock_qty,
            "desc": p.desc or "",
        } for p in results]
    finally:
        db.close()


def _get_resolved(state: AgentState, role: str) -> dict | None:
    """Kembalikan produk pendukung yang sudah di-resolve oleh specialist sebelumnya untuk role tertentu."""
    for item in state.get("resolved_supporting", []):
        if item.get("role") == role:
            return item
    return None


def _mark_resolved(state_resolved: list, role: str, sku: str, name: str, price: float) -> list:
    """Tambahkan entri ke resolved_supporting; skip kalau role sudah ada."""
    if any(r.get("role") == role for r in state_resolved):
        return state_resolved
    return state_resolved + [{"role": role, "sku": sku, "name": name, "price": price}]
