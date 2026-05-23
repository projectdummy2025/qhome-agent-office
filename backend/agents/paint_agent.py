from backend.agents.shared import (
    AgentState,
    _should_reuse_product,
    _get_stock_and_details_for_sku,
    _get_candidates_with_stock,
    _format_candidates_for_prompt,
    _llm_invoke_with_retry,
    groq_specialist
)

def paint_consultant(state: AgentState):
    """Paint Consultant"""
    if "paint" not in state.get("hired_agents", []):
        return state
    brief = state.get("brief", "")
    try:
        reuse_result = _should_reuse_product(brief, "Paint Consultant", state)
        
        if reuse_result["should_reuse"] and reuse_result["product"]:
            meta = reuse_result["product"]
            sku = meta["sku"]
            db_details = _get_stock_and_details_for_sku(sku)
            if db_details:
                candidates = [db_details]
            else:
                candidates = [{
                    "sku": sku,
                    "name": meta["name"],
                    "base_price": meta["price"],
                    "coverage_m2": meta["coverage"],
                    "stock_qty": 50,
                    "desc": f"Produk reused dari sesi sebelumnya: {meta['name']}"
                }]
        else:
            candidates = _get_candidates_with_stock(brief, "building material", limit=5)
            if not candidates:
                raise Exception("No product found")

        candidates_formatted = _format_candidates_for_prompt(candidates)
        history_summary = state.get("history_summary", "")
        
        prompt = (
            f"Anda adalah Paint Consultant.\n"
            f"Konteks Sesi Sebelumnya: {history_summary if history_summary else 'Tidak ada.'}\n\n"
            f"Klien meminta instruksi terbaru: '{brief}'.\n"
            "Daftar produk cat (building material) kandidat yang tersedia beserta stok riilnya di gudang:\n"
            f"{candidates_formatted}\n\n"
            "Tugas Anda:\n"
            "1. Ekstrak luas area dinding pengecatan (m2) dari instruksi/brief terbaru atau konteks sesi sebelumnya. Jika menyebutkan ukuran kamar (misal 3x4 meter dengan tinggi 3 meter), hitung luas keliling dikali tinggi (2*(3+4)*3 = 42 m2). Jika tidak ada spesifikasi ukuran, asumsikan luas dinding 12 m2.\n"
            "2. Hitung jumlah pail cat yang dibutuhkan: (luas_area * 2) / coverage_m2 (karena double-coat/2 lapis).\n"
            "3. Pilih produk terbaik dari daftar kandidat di atas yang memiliki STOK mencukupi kebutuhan tersebut.\n"
            "4. Jika tidak ada produk dengan stok mencukupi, pilih kandidat pertama yang paling relevan.\n\n"
            "Format output HANYA JSON:\n"
            "{\n"
            '  "selected_sku": "SKU produk yang dipilih",\n'
            '  "reasoning": "1 kalimat alasan estetis & ketersediaan stok memilih produk ini",\n'
            '  "area_m2": float\n'
            "}"
        )
        response = _llm_invoke_with_retry(groq_specialist, prompt)

        import json
        import re
        from backend.mcp_tools.calculators import calculate_paint_needs

        try:
            match = re.search(r"\{.*\}", response.content, re.DOTALL)
            res_json = (
                json.loads(match.group(0))
                if match
                else {
                    "selected_sku": candidates[0]["sku"],
                    "reasoning": response.content.strip(),
                    "area_m2": 12.0
                }
            )
            selected_sku = res_json.get("selected_sku", candidates[0]["sku"])
            area_m2 = float(res_json.get("area_m2", 12.0))
            reasoning = res_json.get("reasoning", response.content.strip())
        except Exception:
            selected_sku = candidates[0]["sku"]
            area_m2 = 12.0
            reasoning = response.content.strip()

        selected_product = next((c for c in candidates if c["sku"] == selected_sku), candidates[0])

        calc = calculate_paint_needs(area_m2, float(selected_product["coverage_m2"]))
        qty = calc["pails_needed"]
        unit = "Pail"

        content = (
            f"{reasoning}. Dengan estimasi luas dinding {area_m2} m2 untuk pengecatan double-coat (2 lapis), "
            f"dibutuhkan {qty} pail cat utama dan {calc['primer_pails_needed']} pail cat primer alkali sealer dasar."
        )
        product_data = [
            {
                "sku": selected_product["sku"],
                "name": selected_product["name"],
                "price": selected_product["base_price"],
                "coverage": selected_product["coverage_m2"],
                "qty": f"{qty} {unit} (Est)",
                "total": selected_product["base_price"] * qty,
            },
            {
                "sku": "OOS-PRIMER",
                "name": "Cat Dasar / Alkali Sealer (Menunggu Konfirmasi)",
                "price": 0,
                "qty": f"{calc['primer_pails_needed']} Pail (Est)",
                "total": 0,
            }
        ]
    except Exception as e:
        content = f"Maaf, saya tidak menemukan cat interior yang spesifik sesuai permintaan. Detail {str(e)}"
        product_data = [{
            "sku": "OOS-PAINT",
            "name": "Menunggu Konfirmasi",
            "price": 0,
            "qty": "0",
            "total": 0,
        }]

    report = {"agent": "Paint Consultant", "content": content, "product": product_data}
    old_reports = [
        r for r in state.get("reports", []) if r.get("agent") != "Paint Consultant"
    ]
    return {"reports": old_reports + [report]}
