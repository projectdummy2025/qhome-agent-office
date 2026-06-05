from backend.agents.shared import (
    AgentState,
    _should_reuse_product,
    _get_stock_and_details_for_sku,
    _get_candidates_with_stock,
    _find_product_by_name_sql,
    _has_buying_intent,
    _format_candidates_for_prompt,
    _llm_invoke_with_retry,
    _extract_explicit_support,
    _has_area_in_text,
    groq_specialist
)

def wood_specialist(state: AgentState):
    """Wood Specialist"""
    if "wood" not in state.get("hired_agents", []):
        return {"reports": [r for r in state.get("reports", []) if r.get("agent") != "Wood Specialist"]}
    brief = state.get("brief", "")
    history_summary = state.get("history_summary", "")
    if not _has_area_in_text(brief, history_summary):
        clarify = {
            "agent": "Wood Specialist",
            "content": (
                "Untuk menghitung estimasi kebutuhan panel/lantai kayu yang akurat, saya memerlukan "
                "luas area yang akan dipasang (contoh: 10 m², 20 m²). "
                "Bisakah Anda menyebutkan luas area yang dimaksud?"
            ),
        }
        old = [r for r in state.get("reports", []) if r.get("agent") != "Wood Specialist"]
        return {"reports": old + [clarify]}
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
            # SQL name-search dulu, ChromaDB sebagai fallback
            # Wood flooring / SPC / Vinyl are in "floor" category
            candidates = _find_product_by_name_sql(brief, "floor", limit=30)
            if not candidates:
                candidates = _get_candidates_with_stock(brief, "floor", limit=30)
            
            # Filter to include only wood-related products
            wood_keywords = ["spc", "vinyl", "wood", "teak", "oak", "sandalwood", "kayu"]
            candidates = [
                c for c in candidates
                if any(kw in c["name"].lower() or kw in c["desc"].lower() for kw in wood_keywords)
            ][:5]
            
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
            "1. Ekstrak luas area dinding/panel BERSIH (m2) dari instruksi/brief terbaru atau konteks sesi sebelumnya — TANPA menambahkan wastage, wastage dihitung terpisah oleh kalkulator. Jika tidak ditentukan, asumsikan 15 m2.\n"
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

        product_data = [
            {
                "sku": selected_product["sku"],
                "name": selected_product["name"],
                "price": selected_product["base_price"],
                "coverage": selected_product["coverage_m2"],
                "qty": f"{qty} {unit} (Est)",
                "total": selected_product["base_price"] * qty,
            },
        ]

        if _has_buying_intent(brief):
            coating_qty = calc["coating_cans_needed"]
            coating_candidates = _find_product_by_name_sql(
                _extract_explicit_support(brief, "coating") or "coating pelindung",
                "furniture", limit=1
            )
            if not coating_candidates:
                coating_candidates = _get_candidates_with_stock("coating", "furniture", limit=1)

            if coating_candidates:
                cm = coating_candidates[0]
                product_data.append({
                    "sku": cm["sku"],
                    "name": cm["name"],
                    "price": cm["base_price"],
                    "qty": f"{coating_qty} Kaleng (Est)",
                    "total": cm["base_price"] * coating_qty,
                })

        content = (
            f"{reasoning}. Untuk luas bidang kayu {area_m2} m2, diperlukan sebanyak {qty} lembar panel."
            + (f" Diperlukan pula {calc['coating_cans_needed']} kaleng cairan coating pelindung UV agar warna kayu tahan lama." if _has_buying_intent(brief) else "")
        )
    except Exception as e:
        wood_kws = ["spc", "vinyl", "wood", "teak", "oak", "sandalwood", "kayu", "panel", "furniture", "meja", "lemari", "sofa", "kursi", "divan"]
        has_wood_intent = any(kw in brief.lower() for kw in wood_kws)
        if not has_wood_intent:
            content = "Tidak ada kebutuhan material kayu dalam brief terbaru."
            product_data = []
        else:
            content = f"Maaf, saya tidak menemukan produk panel kayu yang sesuai di database. Detail {str(e)}"
            product_data = [{
                "sku": "OOS-WOOD",
                "name": "SPC Flooring / Kayu",
                "price": 0,
                "qty": "0",
                "total": 0,
            }]

    report = {"agent": "Wood Specialist", "content": content, "product": product_data}
    old_reports = [
        r for r in state.get("reports", []) if r.get("agent") != "Wood Specialist"
    ]
    return {"reports": old_reports + [report]}
