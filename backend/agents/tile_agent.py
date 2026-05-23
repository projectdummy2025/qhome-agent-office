from backend.agents.shared import (
    AgentState,
    _should_reuse_product,
    _get_stock_and_details_for_sku,
    _get_candidates_with_stock,
    _format_candidates_for_prompt,
    _llm_invoke_with_retry,
    gemini_specialist
)

def tile_estimator(state: AgentState):
    """Tile Estimator"""
    if "tile" not in state.get("hired_agents", []):
        return state
    brief = state.get("brief", "")
    try:
        reuse_result = _should_reuse_product(brief, "Tile Estimator", state)
        
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
            candidates = _get_candidates_with_stock(brief, "floor", limit=5)
            if not candidates:
                raise Exception("No product found")

        candidates_formatted = _format_candidates_for_prompt(candidates)
        history_summary = state.get("history_summary", "")
        
        prompt = (
            f"Anda adalah Tile Estimator.\n"
            f"Konteks Sesi Sebelumnya: {history_summary if history_summary else 'Tidak ada.'}\n\n"
            f"Klien meminta instruksi terbaru: '{brief}'.\n"
            "Daftar produk ubin lantai (floor) kandidat yang tersedia beserta stok riilnya di gudang:\n"
            f"{candidates_formatted}\n\n"
            "Tugas Anda:\n"
            "1. Ekstrak luas area lantai (m2) dari instruksi/brief terbaru atau konteks sesi sebelumnya. Jika tidak ditentukan, asumsikan 10 m2.\n"
            "2. Tentukan pola pemasangan: 'standard' (wastage 5%) atau 'vintage' (wastage 10%).\n"
            "3. Hitung jumlah dus yang dibutuhkan untuk masing-masing kandidat: (luas_area * (1 + wastage_decimal)) / coverage_m2.\n"
            "4. Pilih produk terbaik dari daftar kandidat di atas yang memiliki STOK mencukupi kebutuhan tersebut.\n"
            "5. Jika tidak ada produk dengan stok mencukupi, pilih kandidat pertama yang paling relevan (kami akan mengurus restoknya).\n\n"
            "Format output HANYA JSON:\n"
            "{\n"
            '  "selected_sku": "SKU produk yang dipilih",\n'
            '  "reasoning": "1 kalimat alasan estetis & ketersediaan stok memilih produk ini",\n'
            '  "area_m2": float,\n'
            '  "pattern": "standard" atau "vintage"\n'
            "}"
        )
        response = _llm_invoke_with_retry(gemini_specialist, prompt)

        import json
        import re
        from backend.mcp_tools.calculators import calculate_tile_needs

        try:
            match = re.search(r"\{.*\}", response.content, re.DOTALL)
            res_json = (
                json.loads(match.group(0))
                if match
                else {
                    "selected_sku": candidates[0]["sku"],
                    "reasoning": response.content.strip(),
                    "area_m2": 10.0,
                    "pattern": "standard",
                }
            )
            selected_sku = res_json.get("selected_sku", candidates[0]["sku"])
            area_m2 = float(res_json.get("area_m2", 10.0))
            pattern = res_json.get("pattern", "standard")
            wastage = 10.0 if pattern == "vintage" else 5.0
            reasoning = res_json.get("reasoning", response.content.strip())
        except Exception:
            selected_sku = candidates[0]["sku"]
            area_m2 = 10.0
            wastage = 5.0
            pattern = "standard"
            reasoning = response.content.strip()

        selected_product = next((c for c in candidates if c["sku"] == selected_sku), candidates[0])
        
        calc = calculate_tile_needs(area_m2, float(selected_product["coverage_m2"]), wastage)
        qty = calc["boxes_needed"]
        unit = "Dus"

        content = (
            f"{reasoning}. Dengan estimasi luas area lantai {area_m2} m2 menggunakan pola {pattern} "
            f"(wastage {wastage}%), dibutuhkan {qty} dus ubin. "
            f"Kalkulator sipil merekomendasikan tambahan {calc['cement_sacks_needed']} sak semen perekat "
            f"dan {calc['grout_bags_needed']} bag semen nat pendukung."
        )
        product_data = {
            "sku": selected_product["sku"],
            "name": selected_product["name"],
            "price": selected_product["base_price"],
            "coverage": selected_product["coverage_m2"],
            "qty": f"{qty} {unit} (Est)",
            "total": selected_product["base_price"] * qty,
        }
    except Exception as e:
        content = f"Maaf, setelah menganalisis katalog, saya tidak menemukan material lantai yang persis sesuai permintaan. Detail {str(e)}"
        product_data = {
            "sku": "OOS-TILE",
            "name": "Menunggu Konfirmasi",
            "price": 0,
            "qty": "0",
            "total": 0,
        }

    report = {"agent": "Tile Estimator", "content": content, "product": product_data}
    old_reports = [
        r for r in state.get("reports", []) if r.get("agent") != "Tile Estimator"
    ]
    return {"reports": old_reports + [report]}
