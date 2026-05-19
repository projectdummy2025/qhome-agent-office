import os
import sys

# Add project root to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.core.database import SessionLocal, init_db, get_chroma_collection
from backend.models.schema import Product

import csv

def parse_csv_catalog():
    products = []
    file_path = os.path.join(os.path.dirname(__file__), 'seed_products.csv')
    
    if not os.path.exists(file_path):
        print(f"File {file_path} tidak ditemukan!")
        return []
        
    with open(file_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                products.append({
                    "sku": row["sku"],
                    "name": row["name"],
                    "category": row["category"].lower(),
                    "base_price": float(row["base_price"]),
                    "coverage_m2": float(row["coverage_m2"]),
                    "desc": row["desc"]
                })
            except Exception as e:
                print(f"Skipping row {row.get('sku')} due to parsing error: {e}")
                continue
    return products

PRODUCTS = parse_csv_catalog()

def seed_db():
    print("Initializing Database...")
    init_db()
    
    db = SessionLocal()
    chroma_col = get_chroma_collection()
    
    for item in PRODUCTS:
        # Save to PostgreSQL
        if not db.query(Product).filter_by(sku=item["sku"]).first():
            product = Product(
                sku=item["sku"],
                name=item["name"],
                category=item["category"],
                base_price=item["base_price"],
                coverage_m2=item["coverage_m2"]
            )
            db.add(product)
            print(f"Added into Database: {item['sku']}")
            
        # Save to ChromaDB
        chroma_col.add(
            documents=[item["desc"]],
            metadatas=[{"sku": item["sku"], "name": item["name"], "category": item["category"], "price": item["base_price"], "coverage": item["coverage_m2"]}],
            ids=[item["sku"]]
        )
        print(f"Added into ChromaDB: {item['sku']}")

    db.commit()
    db.close()
    print("Seed complete.")

if __name__ == "__main__":
    seed_db()
