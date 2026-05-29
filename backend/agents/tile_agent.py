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
        return {"reports": [r for r in state.get("reports", []) if r.get("agent") != "Tile Estimator"]}
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
            "PERHATIAN PENTING - CEK TERLEBIH DAHULU:\n"
            "Apakah klien secara eksplisit menyebut produk semen perekat/semen instan TERTENTU dalam brief? "
            "Contoh: 'SikaCeram-200 sebanyak 12 sak', 'Semen Instan QHome #1 sebanyak 8 sak', dsb.\n"
            "- Jika YA dan produk tersebut adalah 'Semen Instan QHome #1' atau varian QHome #1: gunakan SKU 'BM-001' dengan kuantitas yang disebutkan di brief.\n"
            "- Jika YA dan produk tersebut TIDAK terdaftar di daftar kandidat (misal SikaCeram-200): gunakan SKU 'OOS-CEMENT-<nama_singkat>' dengan harga 0 dan kuantitas sesuai brief.\n"
            "- Jika TIDAK ada permintaan produk spesifik: lanjutkan dengan kalkulasi area normal.\n\n"
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
            '  "pattern": "standard" atau "vintage",\n'
            '  "explicit_cement": null atau {"sku": "SKU-nya", "name": "nama produk persis sesuai brief", "qty": integer, "unit": "Sak/Bag/dll", "price": harga_atau_0}\n'
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
                    "explicit_cement": None,
                }
            )
            selected_sku = res_json.get("selected_sku", candidates[0]["sku"])
            area_m2 = float(res_json.get("area_m2", 10.0))
            pattern = res_json.get("pattern", "standard")
            wastage = 10.0 if pattern == "vintage" else 5.0
            reasoning = res_json.get("reasoning", response.content.strip())
            explicit_cement = res_json.get("explicit_cement")
        except Exception:
            selected_sku = candidates[0]["sku"]
            area_m2 = 10.0
            wastage = 5.0
            pattern = "standard"
            reasoning = response.content.strip()
            explicit_cement = None

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

        # Resolve Cement
        cement_qty = explicit_cement.get("qty", calc["cement_sacks_needed"]) if explicit_cement else calc["cement_sacks_needed"]
        cement_unit = explicit_cement.get("unit", "Sak") if explicit_cement else "Sak"
        
        # Dynamic database search for cement
        cement_keyword = explicit_cement.get("name", "semen perekat") if explicit_cement else "semen perekat"
        cement_candidates = _get_candidates_with_stock(cement_keyword, "building material", limit=1)
        
        if cement_candidates:
            cement_match = cement_candidates[0]
            cement_sku = cement_match["sku"]
            cement_name = cement_match["name"]
            cement_price = cement_match["base_price"]
        else:
            cement_sku = "OOS-CEMENT"
            cement_name = explicit_cement.get("name", "Semen Perekat Instan") if explicit_cement else "Semen Perekat Instan"
            cement_name = f"{cement_name} (Menunggu Konfirmasi)"
            cement_price = 0

        product_data.append({
            "sku": cement_sku,
            "name": cement_name if cement_price > 0 else f"{cement_name} (Estimasi Internet)" if "Menunggu" not in cement_name else cement_name,
            "price": cement_price,
            "qty": f"{cement_qty} {cement_unit}",
            "total": cement_price * cement_qty,
        })

        # Resolve Grout
        grout_qty = calc["grout_bags_needed"]
        grout_unit = "Bag"
        
        # Dynamic database search for grout
        grout_candidates = _get_candidates_with_stock("nat", "building material", limit=1)
        if grout_candidates:
            grout_match = grout_candidates[0]
            grout_sku = grout_match["sku"]
            grout_name = grout_match["name"]
            grout_price = grout_match["base_price"]
        else:
            grout_sku = "OOS-GROUT"
            grout_name = "Pengisi Nat / Tile Grout (Menunggu Konfirmasi)"
            grout_price = 0

        product_data.append({
            "sku": grout_sku,
            "name": grout_name if grout_price > 0 else f"{grout_name} (Estimasi Internet)" if "Menunggu" not in grout_name else grout_name,
            "price": grout_price,
            "qty": f"{grout_qty} {grout_unit}",
            "total": grout_price * grout_qty,
        })
    except Exception as e:
        content = f"Maaf, setelah menganalisis katalog, saya tidak menemukan material lantai yang persis sesuai permintaan. Detail {str(e)}"
        product_data = [{
            "sku": "OOS-TILE",
            "name": "Menunggu Konfirmasi",
            "price": 0,
            "qty": "0",
            "total": 0,
        }]

    report = {"agent": "Tile Estimator", "content": content, "product": product_data}
    old_reports = [
        r for r in state.get("reports", []) if r.get("agent") != "Tile Estimator"
    ]
    return {"reports": old_reports + [report]}
