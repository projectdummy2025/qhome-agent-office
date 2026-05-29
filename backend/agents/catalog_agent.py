from backend.agents.shared import (
    AgentState,
    _find_product_by_name_sql,
    _get_candidates_with_stock,
    _has_buying_intent,
    _format_candidates_for_prompt,
    _llm_invoke_with_retry,
    gemini_specialist,
)

# Kategori yang ditangani catalog_agent
_CATALOG_CATEGORIES = [
    "sanitary & plumbing",
    "appliance & household",
    "electrical & lighting",
    "tools & machinery",
    "building material",  # untuk bulk order semen/material tunggal tanpa kalkulasi area
]

def catalog_agent(state: AgentState):
    """Agent generalis untuk sanitary, appliance, bulk order, dan produk non-spesialis lainnya."""
    if "catalog" not in state.get("hired_agents", []):
        return {"reports": [r for r in state.get("reports", []) if r.get("agent") != "Catalog Agent"]}

    brief = state.get("brief", "")
    history_summary = state.get("history_summary", "")

    try:
        # Coba tiap kategori, ambil yang paling relevan
        candidates = []
        matched_category = None
        for cat in _CATALOG_CATEGORIES:
            results = _find_product_by_name_sql(brief, cat, limit=5)
            if results:
                candidates = results
                matched_category = cat
                break

        # Fallback ChromaDB ke semua kategori kalau SQL kosong
        if not candidates:
            for cat in _CATALOG_CATEGORIES:
                results = _get_candidates_with_stock(brief, cat, limit=5)
                if results:
                    candidates = results
                    matched_category = cat
                    break

        if not candidates:
            raise Exception("Produk tidak ditemukan di semua kategori katalog.")

        candidates_formatted = _format_candidates_for_prompt(candidates)

        prompt = (
            "Anda adalah Catalog Agent QHomeMart — asisten pencarian produk untuk kategori sanitary, "
            "appliance, electrical, tools, dan material bulk order.\n\n"
            f"Konteks Percakapan: {history_summary if history_summary else 'Tidak ada.'}\n\n"
            f"Permintaan klien: '{brief}'\n\n"
            f"Produk kandidat tersedia di gudang (kategori: {matched_category}):\n"
            f"{candidates_formatted}\n\n"
            "Tugas:\n"
            "1. Pilih produk yang PALING COCOK dengan permintaan klien dari daftar kandidat di atas.\n"
            "2. Jika klien menyebut merek/tipe spesifik yang tidak ada di kandidat, pilih yang paling mendekati "
            "   dan jelaskan perbedaannya.\n"
            "3. Jika ada info kuantitas (unit/sak/pcs) dalam permintaan, gunakan itu. Jika tidak, asumsikan 1 unit.\n"
            "4. Berikan reasoning singkat (1 kalimat) mengapa produk ini dipilih.\n\n"
            "Format output HANYA JSON:\n"
            "{\n"
            '  "selected_sku": "SKU produk yang dipilih",\n'
            '  "reasoning": "1 kalimat alasan pemilihan produk",\n'
            '  "qty": integer,\n'
            '  "unit": "Unit/Sak/Pcs/Set/dll"\n'
            "}"
        )

        response = _llm_invoke_with_retry(gemini_specialist, prompt)

        import json, re
        try:
            match = re.search(r"\{.*\}", response.content, re.DOTALL)
            res_json = json.loads(match.group(0)) if match else {}
            selected_sku = res_json.get("selected_sku", candidates[0]["sku"])
            reasoning = res_json.get("reasoning", "")
            qty = int(res_json.get("qty", 1))
            unit = res_json.get("unit", "Unit")
        except Exception:
            selected_sku = candidates[0]["sku"]
            reasoning = ""
            qty = 1
            unit = "Unit"

        selected = next((c for c in candidates if c["sku"] == selected_sku), candidates[0])

        content = (
            f"{reasoning}. "
            f"Produk '{selected['name']}' (SKU: {selected['sku']}) tersedia di gudang dengan stok {selected['stock_qty']} unit."
            + (f" Kebutuhan: {qty} {unit}." if _has_buying_intent(brief) else "")
        )

        product_data = []
        if _has_buying_intent(brief):
            product_data.append({
                "sku": selected["sku"],
                "name": selected["name"],
                "price": selected["base_price"],
                "qty": f"{qty} {unit}",
                "total": selected["base_price"] * qty,
            })

    except Exception as e:
        content = f"Produk tidak ditemukan di katalog untuk permintaan ini. Detail: {str(e)}"
        product_data = []

    report = {"agent": "Catalog Agent", "content": content}
    if product_data:
        report["product"] = product_data

    old_reports = [r for r in state.get("reports", []) if r.get("agent") != "Catalog Agent"]
    return {"reports": old_reports + [report]}
