from backend.agents.shared import (
    AgentState,
    _should_reuse_product,
    _get_stock_and_details_for_sku,
    _get_candidates_with_stock,
    _find_product_by_name_sql,
    _has_buying_intent,
    _get_resolved,
    _mark_resolved,
    _format_candidates_for_prompt,
    _llm_invoke_with_retry,
    _extract_explicit_support,
    gemini_specialist
)

def stone_specialist(state: AgentState):
    """Stone Veneer Specialist"""
    if "stone" not in state.get("hired_agents", []):
        return {"reports": [r for r in state.get("reports", []) if r.get("agent") != "Stone Veneer Specialist"]}
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
            # SQL name-search dulu, ChromaDB sebagai fallback
            # Stone/granite products are in "floor" category
            candidates = _find_product_by_name_sql(brief, "floor", limit=30)
            if not candidates:
                candidates = _get_candidates_with_stock(brief, "floor", limit=30)
            
            # Filter to include only stone/granite/marble/slate/veneer/travertine/carrara/calacatta/statario/rustic/matte
            # and exclude wood/spc/vinyl
            stone_keywords = ["granit", "keramik", "carrara", "calacatta", "travertine", "statario", "rustic", "matte", "stone", "batu"]
            wood_keywords = ["spc", "vinyl", "wood", "teak", "oak", "sandalwood", "kayu"]
            candidates = [
                c for c in candidates
                if any(kw in c["name"].lower() or kw in c["desc"].lower() for kw in stone_keywords)
                and not any(wkw in c["name"].lower() for wkw in wood_keywords)
            ][:5]
            
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
            "1. Ekstrak luas area dinding batu BERSIH (m2) dari instruksi/brief terbaru atau konteks sesi sebelumnya — TANPA menambahkan wastage, wastage dihitung terpisah oleh kalkulator. Jika tidak ditentukan, asumsikan 15 m2.\n"
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

        resolved = list(state.get("resolved_supporting", []))

        if _has_buying_intent(brief):
            # Bonding agent — pakai resolved kalau tile_agent sudah resolve cement
            bonding_qty = calc["bonding_agent_bags_needed"]
            existing_cement = _get_resolved(state, "cement")
            if existing_cement:
                bonding_sku, bonding_name, bonding_price = existing_cement["sku"], existing_cement["name"], existing_cement["price"]
            else:
                bonding_candidates = _find_product_by_name_sql(
                    _extract_explicit_support(brief, "cement") or "semen perekat",
                    "building material", limit=1
                )
                if not bonding_candidates:
                    bonding_candidates = _get_candidates_with_stock("perekat", "building material", limit=1)
                if bonding_candidates:
                    bm = bonding_candidates[0]
                    bonding_sku, bonding_name, bonding_price = bm["sku"], bm["name"], bm["base_price"]
                else:
                    bonding_sku, bonding_name, bonding_price = "OOS-CEMENT", "Semen Perekat (Menunggu Konfirmasi)", 0
                resolved = _mark_resolved(resolved, "cement", bonding_sku, bonding_name, bonding_price)

            product_data.append({
                "sku": bonding_sku,
                "name": bonding_name,
                "price": bonding_price,
                "qty": f"{bonding_qty} Sak (Est)",
                "total": bonding_price * bonding_qty,
            })

            # Grout — pakai resolved kalau tile_agent sudah resolve grout
            grout_qty = calc["grout_bags_needed"]
            existing_grout = _get_resolved(state, "grout")
            if existing_grout:
                grout_sku, grout_name, grout_price = existing_grout["sku"], existing_grout["name"], existing_grout["price"]
            else:
                grout_candidates = _find_product_by_name_sql(
                    _extract_explicit_support(brief, "grout") or "nat keramik",
                    "building material", limit=1
                )
                if not grout_candidates:
                    grout_candidates = _get_candidates_with_stock("nat", "building material", limit=1)
                if grout_candidates:
                    gm = grout_candidates[0]
                    grout_sku, grout_name, grout_price = gm["sku"], gm["name"], gm["base_price"]
                else:
                    grout_sku, grout_name, grout_price = "OOS-GROUT", "Pengisi Nat Batu (Menunggu Konfirmasi)", 0
                resolved = _mark_resolved(resolved, "grout", grout_sku, grout_name, grout_price)

            product_data.append({
                "sku": grout_sku,
                "name": grout_name,
                "price": grout_price,
                "qty": f"{grout_qty} Sak (Est)",
                "total": grout_price * grout_qty,
            })

        content = (
            f"{reasoning}. Untuk luas dinding batu {area_m2} m2, diperlukan {qty} m2 batu alam."
            + (
                f" Kalkulator merekomendasikan tambahan perekat khusus sebanyak {calc['bonding_agent_bags_needed']} sak heavy-duty bonding agent "
                f"dan {calc['grout_bags_needed']} sak joint filler pengisi nat batu."
                if _has_buying_intent(brief) else ""
            )
        )
    except Exception as e:
        content = f"Maaf, produk Stone Veneer tidak ditemukan di katalog. Detail: {str(e)}"
        product_data = [{
            "sku": "OOS-STONE",
            "name": "Menunggu Konfirmasi",
            "price": 0,
            "qty": "0",
            "total": 0,
        }]
        resolved = list(state.get("resolved_supporting", []))

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
    return {"reports": old_reports + [report], "resolved_supporting": resolved}
