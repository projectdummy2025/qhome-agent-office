import os
import sys
import csv
import time

# Add project root to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.core.database import (
    SessionLocal,
    init_db,
    get_chroma_collection,
    chroma_client,
)
from backend.models.schema import Product

def parse_csv_catalog():
    products = []
    file_path = os.path.join(os.path.dirname(__file__), "seed_products.csv")

    if not os.path.exists(file_path):
        print(f"Error: File {file_path} tidak ditemukan!")
        sys.exit(1)

    print(f"Reading catalog from {file_path}...")
    with open(file_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                products.append(
                    {
                        "sku": row["sku"],
                        "name": row["name"],
                        "category": row["category"].lower(),
                        "base_price": float(row["base_price"]),
                        "coverage_m2": float(row["coverage_m2"]),
                        "desc": row["desc"],
                    }
                )
            except Exception as e:
                print(f"Skipping row {row.get('sku')} due to parsing error: {e}")
                continue
    print(f"Successfully parsed {len(products)} products from CSV.")
    return products

def seed_db():
    start_time = time.time()
    
    # 1. Parse CSV Catalog
    products_to_seed = parse_csv_catalog()
    if not products_to_seed:
        print("No products to seed. Exiting.")
        return

    # 2. Re-initialize relational database (create tables if they don't exist)
    print("Initializing relational database schema...")
    try:
        init_db()
        print("Relational database schema initialized.")
    except Exception as e:
        print(f"Error: Gagal menginisialisasi database SQL: {e}")
        print("Tips: Pastikan service 'postgres' di docker-compose.yml sudah berjalan:")
        print("   docker compose up -d postgres")
        print("   Dan pastikan setelan DATABASE_URL di file .env sudah sesuai.")
        sys.exit(1)

    # 3. Clean and seed Relational DB
    print("Connecting to relational database...")
    db = SessionLocal()
    try:
        print("Clearing existing products in relational database...")
        deleted_count = db.query(Product).delete()
        print(f"Deleted {deleted_count} existing products.")

        print("Inserting products into relational database...")
        db_products = [
            Product(
                sku=item["sku"],
                name=item["name"],
                category=item["category"],
                base_price=item["base_price"],
                coverage_m2=item["coverage_m2"],
                desc=item["desc"]
            )
            for item in products_to_seed
        ]
        db.bulk_save_objects(db_products)
        db.commit()
        print(f"Successfully seeded {len(db_products)} products in relational database.")
    except Exception as e:
        db.rollback()
        print(f"Error: Gagal melakukan seeding ke relational database: {e}")
        sys.exit(1)
    finally:
        db.close()

    # 4. Clean and seed Vector DB (ChromaDB)
    print("Connecting to ChromaDB...")
    try:
        print("Cleaning old ChromaDB collection 'catalog_knowledge'...")
        try:
            chroma_client.delete_collection("catalog_knowledge")
            print("Deleted existing ChromaDB collection.")
        except Exception:
            print("No existing ChromaDB collection found. Creating new one.")

        # Re-create collection
        chroma_col = get_chroma_collection("catalog_knowledge")
        print("Created 'catalog_knowledge' collection.")

        # Bulk insert to ChromaDB in chunks
        print("Ingesting products into ChromaDB...")
        
        documents = [item["desc"] for item in products_to_seed]
        metadatas = [
            {
                "sku": item["sku"],
                "name": item["name"],
                "category": item["category"],
                "price": item["base_price"],
                "coverage": item["coverage_m2"],
            }
            for item in products_to_seed
        ]
        ids = [item["sku"] for item in products_to_seed]

        chunk_size = 100
        for i in range(0, len(products_to_seed), chunk_size):
            end_idx = i + chunk_size
            chroma_col.add(
                documents=documents[i:end_idx],
                metadatas=metadatas[i:end_idx],
                ids=ids[i:end_idx]
            )
        
        print("Successfully seeded all products into ChromaDB.")
    except Exception as e:
        print(f"Error: Gagal menghubungkan atau melakukan seeding ke ChromaDB: {e}")
        print("Tips: Pastikan service 'chromadb' di docker-compose.yml sudah berjalan:")
        print("   docker compose up -d chromadb")
        print("   Dan pastikan setelan CHROMA_HOST / CHROMA_PORT di file .env sudah sesuai.")
        sys.exit(1)

    elapsed_time = time.time() - start_time
    print(f"Seeding completed in {elapsed_time:.2f} seconds.")

if __name__ == "__main__":
    seed_db()
