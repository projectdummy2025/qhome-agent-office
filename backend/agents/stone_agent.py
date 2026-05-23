from backend.agents.shared import (
    AgentState,
    _should_reuse_product,
    _get_stock_and_details_for_sku,
    _get_candidates_with_stock,
    _format_candidates_for_prompt,
    _llm_invoke_with_retry,
    gemini_specialist
)

def stone_specialist(state: AgentState):
    """Stone Veneer Specialist"""
    if "stone" not in state.get("hired_agents", []):
        return state
    brief = state.get("brief", "")
    try:
        reuse_result = _should_reuse_product(brief, "Stone Veneer Specialist", state)
        
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
                raise Exception("No stone product found")

        candidates_formatted = _format_candidates_for_prompt(candidates)
        history_summary = state.get("history_summary", "")
        
        prompt = (
            f"Anda adalah Stone Veneer Specialist.\n"
            f"Konteks Sesi Sebelumnya: {history_summary if history_summary else 'Tidak ada.'}\n\n"
            f"Klien meminta instruksi terbaru: '{brief}'.\n"
            "Daftar produk batu alam (building material) kandidat yang tersedia beserta stok riilnya di gudang:\n"
            f"{candidates_formatted}\n\n"
            "Tugas Anda:\n"
            "1. Ekstrak luas area dinding batu (m2) dari instruksi/brief terbaru atau konteks sesi sebelumnya. Jika tidak ditentukan, asumsikan 15 m2.\n"
            "2. Hitung jumlah unit m2 yang dibutuhkan: luas_area / coverage_m2.\n"
            "3. Pilih produk terbaik dari daftar kandidat di atas yang memiliki STOK mencukupi kebutuhan tersebut.\n"
            "4. Jika tidak ada produk dengan stok mencukupi, pilih kandidat pertama yang paling relevan.\n\n"
            "Format output HANYA JSON:\n"
            "{\n"
            '  "selected_sku": "SKU produk yang dipilih",\n'
            '  "reasoning": "1-2 kalimat analisis profesional termasuk saran bonding agent dan pemilihan produk ini",\n'
            '  "area_m2": float\n'
            "}"
        )
        response = _llm_invoke_with_retry(gemini_specialist, prompt)

        import json
        import re
        from backend.mcp_tools.calculators import calculate_stone_needs

        try:
            match = re.search(r"\{.*\}", response.content, re.DOTALL)
            res_json = (
                json.loads(match.group(0))
                if match
                else {
                    "selected_sku": candidates[0]["sku"],
                    "reasoning": response.content.strip(),
                    "area_m2": 15.0
                }
            )
            selected_sku = res_json.get("selected_sku", candidates[0]["sku"])
            area_m2 = float(res_json.get("area_m2", 15.0))
            reasoning = res_json.get("reasoning", response.content.strip())
        except Exception:
            selected_sku = candidates[0]["sku"]
            area_m2 = 15.0
            reasoning = response.content.strip()

        selected_product = next((c for c in candidates if c["sku"] == selected_sku), candidates[0])

        calc = calculate_stone_needs(area_m2, float(selected_product["coverage_m2"]))
        qty = calc["stone_units_needed"]
        unit = "m2"

        content = (
            f"{reasoning}. Untuk luas dinding batu {area_m2} m2, diperlukan {qty} m2 batu alam. "
            f"Kalkulator merekomendasikan tambahan perekat khusus sebanyak {calc['bonding_agent_bags_needed']} sak heavy-duty bonding agent "
            f"dan {calc['grout_bags_needed']} sak joint filler pengisi nat batu."
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
        content = (
            f"Maaf, produk Stone Veneer tidak ditemukan di katalog. Detail: {str(e)}"
        )
        product_data = {
            "sku": "OOS-STONE",
            "name": "Menunggu Konfirmasi",
            "price": 0,
            "qty": "0",
            "total": 0,
        }

    report = {
        "agent": "Stone Veneer Specialist",
        "content": content,
        "product": product_data,
    }
    old_reports = [
        r
        for r in state.get("reports", [])
        if r.get("agent") != "Stone Veneer Specialist"
    ]
    return {"reports": old_reports + [report]}
