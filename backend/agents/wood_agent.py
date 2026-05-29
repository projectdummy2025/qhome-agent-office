from backend.agents.shared import (
    AgentState,
    _should_reuse_product,
    _get_stock_and_details_for_sku,
    _get_candidates_with_stock,
    _format_candidates_for_prompt,
    _llm_invoke_with_retry,
    groq_specialist
)

def wood_specialist(state: AgentState):
    """Wood Specialist"""
    if "wood" not in state.get("hired_agents", []):
        return {"reports": [r for r in state.get("reports", []) if r.get("agent") != "Wood Specialist"]}
    brief = state.get("brief", "")
    try:
        reuse_result = _should_reuse_product(brief, "Wood Specialist", state)
        
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
            candidates = _get_candidates_with_stock(brief, "furniture", limit=5)
            if not candidates:
                raise Exception("No product found")

        candidates_formatted = _format_candidates_for_prompt(candidates)
        history_summary = state.get("history_summary", "")
        
        prompt = (
            f"Anda adalah Wood Specialist.\n"
            f"Konteks Sesi Sebelumnya: {history_summary if history_summary else 'Tidak ada.'}\n\n"
            f"Klien meminta instruksi terbaru: '{brief}'.\n"
            "Daftar produk panel kayu (furniture) kandidat yang tersedia beserta stok riilnya di gudang:\n"
            f"{candidates_formatted}\n\n"
            "Tugas Anda:\n"
            "1. Ekstrak luas area dinding/panel (m2) dari instruksi/brief terbaru atau konteks sesi sebelumnya. Jika tidak ditentukan, asumsikan 15 m2.\n"
            "2. Hitung jumlah lembar panel yang dibutuhkan untuk masing-masing kandidat: luas_area / coverage_m2.\n"
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
        from backend.mcp_tools.calculators import calculate_wood_needs

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

        calc = calculate_wood_needs(area_m2, float(selected_product["coverage_m2"]))
        qty = calc["panels_needed"]
        unit = "Lembar"

        content = (
            f"{reasoning}. Untuk luas bidang kayu {area_m2} m2, diperlukan sebanyak {qty} lembar panel. "
            f"Diperlukan pula {calc['coating_cans_needed']} kaleng cairan coating pelindung UV agar warna kayu tahan lama."
        )
        # Dynamic lookup for coating
        coating_qty = calc["coating_cans_needed"]
        coating_candidates = _get_candidates_with_stock("coating", "furniture", limit=1)
        if not coating_candidates:
            coating_candidates = _get_candidates_with_stock("pelapis", "furniture", limit=1)
        
        if coating_candidates:
            coating_match = coating_candidates[0]
            coating_sku = coating_match["sku"]
            coating_name = coating_match["name"]
            coating_price = coating_match["base_price"]
        else:
            coating_sku = "OOS-COATING"
            coating_name = "Cairan Coating Pelindung UV (Menunggu Konfirmasi)"
            coating_price = 0

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
                "sku": coating_sku,
                "name": coating_name if coating_price > 0 else f"{coating_name} (Estimasi Internet)" if "Menunggu" not in coating_name else coating_name,
                "price": coating_price,
                "qty": f"{coating_qty} Kaleng (Est)",
                "total": coating_price * coating_qty,
            }
        ]
    except Exception as e:
        content = f"Maaf, saya tidak menemukan produk panel kayu yang sesuai di database. Detail {str(e)}"
        product_data = [{
            "sku": "OOS-WOOD",
            "name": "Menunggu Konfirmasi",
            "price": 0,
            "qty": "0",
            "total": 0,
        }]

    report = {"agent": "Wood Specialist", "content": content, "product": product_data}
    old_reports = [
        r for r in state.get("reports", []) if r.get("agent") != "Wood Specialist"
    ]
    return {"reports": old_reports + [report]}
