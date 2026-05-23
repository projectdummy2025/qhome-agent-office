#!/bin/sh

# Exit immediately if a command exits with a non-zero status
set -e


# Wait for PostgreSQL to be ready via Python socket ping
python3 -c "
import socket
import time
import os
from urllib.parse import urlparse

db_url = os.getenv('DATABASE_URL', '')
if db_url:
    parsed = urlparse(db_url)
    host = parsed.hostname
    port = parsed.port or 5432
    print(f'Menunggu PostgreSQL siap di {host}:{port}...')
    while True:
        try:
            s = socket.create_connection((host, port), timeout=2)
            s.close()
            print('database terdeteksi aktif!')
            break
        except Exception:
            time.sleep(1)
"

# Wait for ChromaDB to be ready via Python socket ping
python3 -c "
import socket
import time
import os

host = os.getenv('CHROMA_HOST', 'chromadb')
port = int(os.getenv('CHROMA_PORT', '8000'))
print(f'Menunggu ChromaDB siap di {host}:{port}...')
while True:
    try:
        s = socket.create_connection((host, port), timeout=2)
        s.close()
        print('chromadb terdeteksi aktif!')
        break
    except Exception:
        time.sleep(1)
"

# Run database seeding conditionally
if [ "$SEED_ON_STARTUP" = "true" ]; then
    echo "Menjalankan Database Seeding"
    python3 backend/seed.py
else
    echo "Melewati Seeding"
fi

echo "Memulai Server Backend"
exec uvicorn backend.main:app --host 0.0.0.0 --port 8000
