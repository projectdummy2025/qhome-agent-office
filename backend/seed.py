import os
import sys

# Add project root to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.core.database import SessionLocal, init_db, get_chroma_collection
from backend.models.schema import Product

import os

def parse_markdown_catalog():
    products = []
    # Dapatkan path ke file markdown
    file_path = os.path.join(os.path.dirname(__file__), '..', 'docs', 'seed_database_products.md')
    
    if not os.path.exists(file_path):
        print(f"File {file_path} tidak ditemukan!")
        return []
        
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        for line in lines:
            # Lewati header tabel dan separator
            if line.startswith('|') and not line.startswith('| SKU') and not line.startswith('| :---'):
                cols = [c.strip() for c in line.split('|')[1:-1]]
                if len(cols) >= 7:
                    price_str = cols[4].replace('.', '')
                    try:
                        products.append({
                            "sku": cols[0],
                            "name": cols[1],
                            "category": cols[3].lower(),
                            "base_price": float(price_str),
                            "coverage_m2": float(cols[5]),
                            "desc": cols[6]
                        })
                    except ValueError:
                        continue
    return products

PRODUCTS = parse_markdown_catalog()

def seed_db():
    print("Initializing Database...")
    init_db()
    
    db = SessionLocal()
    chroma_col = get_chroma_collection()
    
    for item in PRODUCTS:
        # Save to SQLite
        if not db.query(Product).filter_by(sku=item["sku"]).first():
            product = Product(
                sku=item["sku"],
                name=item["name"],
                category=item["category"],
                base_price=item["base_price"],
                coverage_m2=item["coverage_m2"]
            )
            db.add(product)
            print(f"Added SQLite: {item['sku']}")
            
        # Save to ChromaDB
        chroma_col.add(
            documents=[item["desc"]],
            metadatas=[{"sku": item["sku"], "name": item["name"], "category": item["category"], "price": item["base_price"], "coverage": item["coverage_m2"]}],
            ids=[item["sku"]]
        )
        print(f"Added ChromaDB: {item['sku']}")

    db.commit()
    db.close()
    print("Seed complete.")

if __name__ == "__main__":
    seed_db()
