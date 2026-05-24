"""
Research Agent: Melakukan riset internet untuk produk Out-of-Stock (OOS)
dan menyimpan rekomendasi ke database untuk ditinjau Admin.
"""

import asyncio
import json
import re
from typing import List, Dict, Any
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
from backend.agents.shared import AgentState, _llm_invoke_with_retry, gemini_specialist
from backend.core.config import settings
from backend.core.database import SessionLocal
from backend.models.schema import StockRecommendation


def _extract_products_oos(reports: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Ekstrak semua produk yang Out-of-Stock atau belum terdaftar dari reports.
    Produk OOS diidentifikasi jika:
    - SKU dimulai dengan "OOS-"
    - Harga bernilai 0 (atau tidak ada) dengan nama mengandung "Menunggu Konfirmasi"
    - Nama mengandung "[STOK HABIS]"
    """
    oos_products = []
    for r in reports:
        if "product" in r:
            prod_data = r["product"]
            if not isinstance(prod_data, list):
                prod_data = [prod_data]
            
            for prod in prod_data:
                prod_name = prod.get("name", "").strip()
                prod_sku = prod.get("sku", "").strip()
                prod_price = prod.get("price", 0)
                
                is_oos = (
                    prod_sku.startswith("OOS-") or
                    (prod_price == 0 and ("Menunggu Konfirmasi" in prod_name or "[STOK HABIS]" in prod_name))
                )
                
                if is_oos and prod_name:
                    oos_products.append({
                        "original_name": prod_name,
                        "sku": prod_sku if prod_sku else "OOS-UNKNOWN",
                        "agent": r.get("agent", "Unknown"),
                        "product_data": prod
                    })
    
    return oos_products


def _search_tavily(product_name: str) -> str:
    """
    Melakukan pencarian web menggunakan Tavily API untuk mendapatkan informasi produk.
    Query format: "harga [product_name] indonesia spesifikasi"
    """
    try:
        from backend.mcp_tools.web_search import tavily_web_search
        
        # Format query untuk Indonesia
        if "semen" in product_name.lower() or "cement" in product_name.lower():
            query = f"harga {product_name} indonesia per sak spesifikasi"
        elif "nat" in product_name.lower() or "grout" in product_name.lower():
            query = f"harga {product_name} nat pail indonesia spesifikasi"
        elif "coating" in product_name.lower():
            query = f"harga coating {product_name} indonesia liter spesifikasi"
        elif "primer" in product_name.lower():
            query = f"harga primer {product_name} indonesia liter spesifikasi"
        else:
            query = f"harga {product_name} indonesia spesifikasi"
        
        result = tavily_web_search(query)
        return result if isinstance(result, str) else str(result)
    
    except Exception as e:
        return f"Error dalam pencarian: {str(e)}"


def _parallel_web_research(oos_products: List[Dict[str, Any]]) -> Dict[str, str]:
    """
    Melakukan pencarian web secara paralel untuk semua produk OOS menggunakan ThreadPoolExecutor.
    """
    research_results = {}
    
    if not oos_products:
        return research_results
    
    # Gunakan ThreadPoolExecutor untuk concurrent search
    with ThreadPoolExecutor(max_workers=min(5, len(oos_products))) as executor:
        future_to_product = {
            executor.submit(_search_tavily, prod["original_name"]): prod["original_name"]
            for prod in oos_products
        }
        
        for future in as_completed(future_to_product):
            product_name = future_to_product[future]
            try:
                result = future.result(timeout=30)
                research_results[product_name] = result
            except Exception as e:
                research_results[product_name] = f"Pencarian gagal: {str(e)}"
    
    return research_results


def _extract_json_from_response(response_text: str) -> Dict[str, Any]:
    """
    Ekstrak JSON dari response text LLM, menangani berbagai format.
    """
    try:
        # Coba cari JSON dalam curly braces
        match = re.search(r"\{[\s\S]*\}", response_text)
        if match:
            return json.loads(match.group(0))
    except json.JSONDecodeError:
        pass
    
    # Jika gagal, return empty dict dengan fallback
    return {
        "recommended_brand": "Merek standar industri",
        "estimated_price_rp": 50000,
        "specs": "Produk standar Indonesia",
        "source_url": ""
    }


def _process_product_with_llm(product_name: str, search_result: str) -> Dict[str, Any]:
    """
    Kirim hasil pencarian ke LLM untuk diekstraksi ke format JSON terstruktur.
    """
    if not search_result or "Error" in search_result:
        return {
            "recommended_brand": "Merek standar",
            "estimated_price_rp": 45000,
            "specs": "Data tidak tersedia dari internet",
            "source_url": ""
        }
    
    # Truncate hasil pencarian jika terlalu panjang
    truncated_result = search_result[:1000] if len(search_result) > 1000 else search_result
    
    extraction_prompt = (
        f"Anda adalah expert dalam industri bahan bangunan Indonesia. "
        f"Berdasarkan hasil pencarian internet berikut tentang produk '{product_name}':\n\n"
        f"{truncated_result}\n\n"
        f"Ekstraksi informasi tersebut ke dalam format JSON dengan struktur berikut (HANYA output JSON, tanpa teks tambahan):\n"
        f'{{\n'
        f'  "recommended_brand": "nama merek populer di Indonesia",\n'
        f'  "estimated_price_rp": nilai_angka_harga_dalam_rupiah,\n'
        f'  "specs": "spesifikasi teknis atau kemasan (misal: Sak 40kg, Pail 5L)",\n'
        f'  "source_url": "url_referensi_terpercaya_jika_ada"\n'
        f'}}\n\n'
        f'Catatan: Jika harga tidak ditemukan, estimasi berdasarkan harga pasar rata-rata produk sejenis di Indonesia.'
    )
    
    try:
        response = _llm_invoke_with_retry(gemini_specialist, extraction_prompt)
        extracted = _extract_json_from_response(response.content)
        
        # Pastikan harga adalah angka
        if isinstance(extracted.get("estimated_price_rp"), str):
            # Try to extract number from string
            price_match = re.search(r"(\d+\.?\d*)", extracted["estimated_price_rp"].replace(".", "").replace(",", ""))
            if price_match:
                extracted["estimated_price_rp"] = float(price_match.group(1))
            else:
                extracted["estimated_price_rp"] = 50000
        
        return extracted
    
    except Exception as e:
        print(f"Error processing dengan LLM untuk {product_name}: {str(e)}")
        return {
            "recommended_brand": "Merek standar",
            "estimated_price_rp": 50000,
            "specs": "Produk standar industri",
            "source_url": ""
        }


def _save_recommendations_to_db(
    oos_products: List[Dict[str, Any]],
    processed_data: Dict[str, Dict[str, Any]],
    session_id: str = None
) -> None:
    """
    Simpan rekomendasi stok ke database tabel stock_recommendations.
    """
    db = SessionLocal()
    try:
        for prod in oos_products:
            product_name = prod["original_name"]
            
            # Clean product name dari prefix [STOK HABIS], etc
            clean_name = product_name
            for pfx in ["[STOK TERBATAS]", "[STOK HABIS]", "[STOK KURANG]", "(Menunggu Konfirmasi)"]:
                clean_name = clean_name.replace(pfx, "").strip()
            
            if product_name in processed_data:
                data = processed_data[product_name]
                
                # Cek apakah rekomendasi sudah ada
                existing = db.query(StockRecommendation).filter(
                    StockRecommendation.product_name == clean_name,
                    StockRecommendation.session_id == session_id,
                    StockRecommendation.status == "pending"
                ).first()
                
                if not existing:
                    recommendation = StockRecommendation(
                        session_id=session_id,
                        product_name=clean_name,
                        suggested_sku=prod["sku"],
                        estimated_price=float(data.get("estimated_price_rp", 50000)),
                        source_url=data.get("source_url", ""),
                        specs=data.get("specs", ""),
                        status="pending"
                    )
                    db.add(recommendation)
        
        db.commit()
    
    except Exception as e:
        print(f"Error menyimpan rekomendasi ke database: {str(e)}")
        db.rollback()
    
    finally:
        db.close()


def _update_reports_with_estimated_prices(
    reports: List[Dict[str, Any]],
    oos_products: List[Dict[str, Any]],
    processed_data: Dict[str, Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """
    Perbarui data produk di dalam reports dengan estimasi harga internet dan label khusus.
    """
    updated_reports = []
    
    for r in reports:
        r_copy = dict(r)
        
        if "product" in r_copy:
            prod_data = r_copy["product"]
            if not isinstance(prod_data, list):
                prod_data = [prod_data]
            
            updated_prods = []
            for prod in prod_data:
                prod_copy = dict(prod)
                prod_name = prod_copy.get("name", "").strip()
                
                # Cek apakah produk ini OOS
                is_oos = False
                for oos_prod in oos_products:
                    if oos_prod["original_name"] == prod_name:
                        is_oos = True
                        if prod_name in processed_data:
                            data = processed_data[prod_name]
                            estimated_price = float(data.get("estimated_price_rp", 50000))
                            
                            # Update harga dengan estimasi
                            prod_copy["price"] = estimated_price
                            
                            # Update qty untuk perhitungan total
                            qty_str = prod_copy.get("qty", "1")
                            try:
                                qty_nums = re.findall(r"\d+", str(qty_str))
                                qty_val = int(qty_nums[0]) if qty_nums else 1
                            except:
                                qty_val = 1
                            
                            prod_copy["total"] = estimated_price * qty_val
                            
                            # Update nama dengan label estimasi internet
                            clean_name = prod_name
                            for pfx in ["[STOK TERBATAS]", "[STOK HABIS]", "[STOK KURANG]", "(Menunggu Konfirmasi)", "Menunggu Konfirmasi"]:
                                clean_name = clean_name.replace(pfx, "").strip()
                            clean_name = clean_name.replace("()", "").strip()
                            
                            brand = data.get("recommended_brand", "Merek standar")
                            prod_copy["name"] = f"{clean_name} {brand} (Estimasi Internet - Menunggu Validasi)".replace("  ", " ").strip()
                        
                        break
                
                updated_prods.append(prod_copy)
            
            r_copy["product"] = updated_prods if len(updated_prods) > 1 else updated_prods[0] if updated_prods else prod_data
        
        updated_reports.append(r_copy)
    
    return updated_reports


def restock_researcher(state: AgentState) -> dict:
    """
    Node penelitian stok: Riset internet untuk produk OOS dan simpan rekomendasi ke database.
    
    Logika:
    1. Identifikasi produk Out-of-Stock dari reports
    2. Jika tidak ada OOS, return state tanpa perubahan
    3. Lakukan pencarian web paralel menggunakan Tavily API
    4. Ekstraksi hasil dengan LLM ke format JSON
    5. Simpan rekomendasi ke database
    6. Update harga produk di reports dengan estimasi internet
    7. Return state yang sudah diperbarui
    """
    reports = state.get("reports", [])
    session_id = state.get("session_id", None)
    
    # Step 1: Identifikasi produk OOS
    oos_products = _extract_products_oos(reports)
    
    # Step 2: Jika tidak ada OOS, return state as-is (optimisasi latensi)
    if not oos_products:
        return state
    

    
    # Step 3: Lakukan pencarian paralel
    research_results = _parallel_web_research(oos_products)
    
    # Step 4: Proses each product dengan LLM
    processed_data = {}
    for oos_prod in oos_products:
        product_name = oos_prod["original_name"]
        search_result = research_results.get(product_name, "")
        

        processed = _process_product_with_llm(product_name, search_result)
        processed_data[product_name] = processed
    
    # Step 5: Simpan ke database
    _save_recommendations_to_db(oos_products, processed_data, session_id)
    
    # Step 6: Update reports dengan harga estimasi
    updated_reports = _update_reports_with_estimated_prices(reports, oos_products, processed_data)
    
    # Step 7: Buat laporan terstruktur untuk Research Agent agar tampil lognya di UI (tanpa menampilkan rincian barang)
    research_report = {
        "agent": "Research Agent",
        "content": f"Riset pasar internet untuk {len(oos_products)} produk pendukung telah selesai dilakukan dan rekomendasi stok telah dikirimkan ke Admin Gudang."
    }
    updated_reports.append(research_report)
    

    
    return {
        "reports": updated_reports,
        "session_id": session_id
    }
