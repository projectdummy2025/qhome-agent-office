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

def paint_consultant(state: AgentState):
    """Paint Consultant"""
    if "paint" not in state.get("hired_agents", []):
        return {"reports": [r for r in state.get("reports", []) if r.get("agent") != "Paint Consultant"]}
    brief = state.get("brief", "")
    history_summary = state.get("history_summary", "")
    if not _has_area_in_text(brief, history_summary):
        clarify = {
            "agent": "Paint Consultant",
            "content": (
                "Untuk menghitung estimasi kebutuhan cat yang akurat, saya memerlukan "
                "luas area dinding yang akan dicat (contoh: 12 m², atau dimensi ruangan seperti 3x4 m tinggi 3 m). "
                "Bisakah Anda menyebutkan ukuran area tersebut?"
            ),
        }
        old = [r for r in state.get("reports", []) if r.get("agent") != "Paint Consultant"]
        return {"reports": old + [clarify]}
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
            # SQL name-search dulu, ChromaDB sebagai fallback
            candidates = _find_product_by_name_sql(brief, "building material", limit=30)
            if not candidates:
                candidates = _get_candidates_with_stock(brief, "building material", limit=30)
            
            # Filter out non-paint products (mortar/cement/waterproofing)
            candidates = [c for c in candidates if not c["sku"].startswith("BM-0")][:5]
            


        candidates_formatted = _format_candidates_for_prompt(candidates)
        history_summary = state.get("history_summary", "")
        
        prompt = (
            f"Anda adalah Paint Consultant.\n"
            f"Konteks Sesi Sebelumnya: {history_summary if history_summary else 'Tidak ada.'}\n\n"
            f"Klien meminta instruksi terbaru: '{brief}'.\n"
            "Daftar produk cat (building material) kandidat yang tersedia beserta stok riilnya di gudang:\n"
            f"{candidates_formatted}\n\n"
            "PERHATIAN PENTING - CEK TERLEBIH DAHULU:\n"
            "1. Apakah klien secara eksplisit menyebut produk cat TERTENTU dalam brief? "
            "Contoh: 'Nippon Paint Spotless sebanyak 8 pail', 'Dulux Weathershield 5 pail', dsb.\n"
            "   - Jika YA dan produk tersebut ADA di daftar kandidat: pilih SKU produk tersebut.\n"
            "   - Jika YA dan produk tersebut TIDAK ada di daftar kandidat: set 'explicit_paint' dengan nama persis sesuai brief, SKU 'OOS-PAINT', harga 0, dan kuantitas sesuai brief.\n"
            "2. JANGAN PERNAH memilih produk semen (SKU BM-055 atau BM-001, atau produk dengan kata 'Semen'/'Cement' di namanya) sebagai cat utama, meskipun kategorinya sama-sama 'building material'.\n\n"
            "Tugas Anda:\n"
            "1. Ekstrak luas area dinding pengecatan BERSIH (m2) dari instruksi/brief terbaru atau konteks sesi sebelumnya — TANPA menambahkan wastage atau faktor lapis, keduanya dihitung terpisah oleh kalkulator. Jika menyebutkan ukuran kamar (misal 3x4 meter dengan tinggi 3 meter), hitung luas keliling dikali tinggi (2*(3+4)*3 = 42 m2). Jika tidak ada spesifikasi ukuran, asumsikan luas dinding 12 m2.\n"
            "2. Pilih produk CAT (bukan semen) terbaik dari daftar kandidat di atas yang memiliki STOK mencukupi kebutuhan tersebut.\n"
            "3. Jika tidak ada produk CAT dengan stok mencukupi, pilih kandidat CAT pertama yang paling relevan.\n\n"
            "Format output HANYA JSON:\n"
            "{\n"
            '  "selected_sku": "SKU produk yang dipilih (harus produk cat, BUKAN semen)",\n'
            '  "reasoning": "1 kalimat alasan estetis & ketersediaan stok memilih produk ini",\n'
            '  "area_m2": float,\n'
            '  "explicit_paint": null atau {"sku": "OOS-PAINT", "name": "nama produk persis sesuai brief", "qty": integer, "unit": "Pail", "price": 0}\n'
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
                    "selected_sku": candidates[0]["sku"] if candidates else None,
                    "reasoning": response.content.strip(),
                    "area_m2": 12.0,
                    "explicit_paint": None,
                }
            )
            selected_sku = res_json.get("selected_sku", candidates[0]["sku"] if candidates else None)
            area_m2 = float(res_json.get("area_m2", 12.0))
            reasoning = res_json.get("reasoning", response.content.strip())
            explicit_paint = res_json.get("explicit_paint")
        except Exception:
            selected_sku = candidates[0]["sku"] if candidates else None
            area_m2 = 12.0
            reasoning = response.content.strip()
            explicit_paint = None

        if not explicit_paint and not candidates:
            # Tidak ada kebutuhan cat eksplisit yang diminta dan tidak ada kandidat di katalog
            report = {
                "agent": "Paint Consultant",
                "content": "Tidak ada kebutuhan pengecatan dinding dalam brief terbaru.",
                "product": []
            }
            old_reports = [r for r in state.get("reports", []) if r.get("agent") != "Paint Consultant"]
            return {"reports": old_reports + [report]}

        selected_product = next((c for c in candidates if c["sku"] == selected_sku), candidates[0] if candidates else None)

        # If LLM returned an explicit paint product not in DB, use it directly
        if explicit_paint:
            paint_qty = None
            if isinstance(explicit_paint, dict):
                try:
                    val = explicit_paint.get("qty")
                    if val is not None and int(val) > 0:
                        paint_qty = int(val)
                except (ValueError, TypeError):
                    pass
            if paint_qty is None:
                paint_qty = 1

            paint_unit = "Pail"
            if isinstance(explicit_paint, dict) and explicit_paint.get("unit"):
                paint_unit = explicit_paint["unit"]

            paint_name = explicit_paint.get("name", "Cat Khusus") if isinstance(explicit_paint, dict) else "Cat Khusus"
            coverage = float(selected_product["coverage_m2"]) if (selected_product and selected_product.get("coverage_m2")) else 12.0
            calc = calculate_paint_needs(area_m2, coverage)

            product_data = [
                {
                    "sku": "OOS-PAINT",
                    "name": f"{paint_name} (Estimasi Internet)",
                    "price": 0,
                    "qty": f"{paint_qty} {paint_unit}",
                    "total": 0,
                },
            ]

            if _has_buying_intent(brief):
                primer_qty = calc["primer_pails_needed"]
                primer_candidates = _find_product_by_name_sql(
                    _extract_explicit_support(brief, "primer") or "cat dasar alkali sealer",
                    "building material", limit=1
                )
                if not primer_candidates:
                    primer_candidates = _get_candidates_with_stock("cat dasar", "building material", limit=1)

                if primer_candidates:
                    pm = primer_candidates[0]
                    product_data.append({
                        "sku": pm["sku"],
                        "name": pm["name"],
                        "price": pm["base_price"],
                        "qty": f"{primer_qty} Pail (Est)",
                        "total": pm["base_price"] * primer_qty,
                    })

            content = (
                f"{reasoning}. Klien secara eksplisit meminta {paint_name} sebanyak {paint_qty} {paint_unit}. "
                f"Produk ini belum terdaftar di katalog, menunggu konfirmasi harga dari tim pengadaan."
                + (f" Tambahan {calc['primer_pails_needed']} pail cat primer alkali sealer dasar juga disertakan." if _has_buying_intent(brief) else "")
            )
        else:
            coverage = float(selected_product["coverage_m2"]) if (selected_product and selected_product.get("coverage_m2")) else 12.0
            calc = calculate_paint_needs(area_m2, coverage)
            qty = calc["pails_needed"]
            unit = "Pail"

            product_data = [
                {
                    "sku": selected_product["sku"] if selected_product else "OOS-PAINT",
                    "name": selected_product["name"] if selected_product else "Cat Dinding / Interior",
                    "price": selected_product["base_price"] if selected_product else 0,
                    "coverage": selected_product["coverage_m2"] if selected_product else 12.0,
                    "qty": f"{qty} {unit} (Est)",
                    "total": (selected_product["base_price"] if selected_product else 0) * qty,
                },
            ]

            if _has_buying_intent(brief):
                primer_qty = calc["primer_pails_needed"]
                primer_candidates = _find_product_by_name_sql(
                    _extract_explicit_support(brief, "primer") or "cat dasar alkali sealer",
                    "building material", limit=1
                )
                if not primer_candidates:
                    primer_candidates = _get_candidates_with_stock("cat dasar", "building material", limit=1)

                if primer_candidates:
                    pm = primer_candidates[0]
                    product_data.append({
                        "sku": pm["sku"],
                        "name": pm["name"],
                        "price": pm["base_price"],
                        "qty": f"{primer_qty} Pail (Est)",
                        "total": pm["base_price"] * primer_qty,
                    })

            content = (
                f"{reasoning}. Dengan estimasi luas dinding {area_m2} m2 untuk pengecatan double-coat (2 lapis), "
                f"dibutuhkan {qty} pail cat utama"
                + (f" dan {calc['primer_pails_needed']} pail cat primer alkali sealer dasar." if _has_buying_intent(brief) else ".")
            )
    except Exception as e:
        paint_kws = ["cat", "paint", "primer", "sealer", "dinding", "tembok", "alkali", "warna", "lukis"]
        has_paint_intent = any(kw in brief.lower() for kw in paint_kws)
        if not has_paint_intent:
            content = "Tidak ada kebutuhan pengecatan dinding dalam brief terbaru."
            product_data = []
        else:
            content = f"Maaf, saya tidak menemukan cat interior yang spesifik sesuai permintaan. Detail {str(e)}"
            product_data = [{
                "sku": "OOS-PAINT",
                "name": "Cat Dinding / Interior",
                "price": 0,
                "qty": "0",
                "total": 0,
            }]

    report = {"agent": "Paint Consultant", "content": content, "product": product_data}
    old_reports = [
        r for r in state.get("reports", []) if r.get("agent") != "Paint Consultant"
    ]
    return {"reports": old_reports + [report]}
