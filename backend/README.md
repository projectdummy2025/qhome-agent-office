# QHome-MAS Backend Setup & Architecture

Berkas ini berisi panduan untuk menyiapkan, menjalankan, dan memahami arsitektur layanan *backend* FastAPI untuk proyek QHome-MAS, baik secara lokal maupun menggunakan kontainerisasi Docker.

---

## 1. Arsitektur Komponen Backend

Layanan *backend* dirancang secara modular dan performa tinggi menggunakan:
*   **FastAPI**: Sebagai framework API asinkron.
*   **LangGraph**: Mengelola DAG State Graph untuk penugasan multi-agent AI secara bergiliran (*waterfall execution*).
*   **Server-Sent Events (SSE)**: Menayangkan log pemikiran agen dan hasil simulasi secara *real-time* ke frontend melalui endpoint `/api/projects/{session_id}/stream`.
*   **MCP Tools & Calculators**: Logika komputasi lokal untuk perhitungan ubin, kayu, cat, dan batu alam untuk menghindari halusinasi LLM.

---

## 2. Pilihan A — Lokal (Development)

**Prasyarat**: Python 3.10+, PostgreSQL & ChromaDB aktif (`docker compose up -d postgres chromadb`).

```bash
# Dari root proyek
python3 -m venv venv && source venv/bin/activate
pip install -r backend/requirements.txt
python backend/seed.py
uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
```
API: `http://127.0.0.1:8000` · Swagger: `/docs`

---

## 3. Pilihan B — Deployment (Docker)

Dijalankan otomatis sebagai bagian dari `docker compose up --build -d` di root proyek.

### Berkas Konfigurasi Utama
*   **`backend/Dockerfile`**: *Multi-Stage Build* berbasis `python:3.11-slim`, berjalan sebagai user non-privileged (`appuser`).
*   **`backend/entrypoint.sh`**: Menunggu PostgreSQL & ChromaDB siap (TCP ping), lalu seed otomatis bila `SEED_ON_STARTUP="true"`, baru menyalakan Uvicorn.
*   **`backend/.dockerignore`**: Memblokir `__pycache__`, `venv`, log, dan `.env` host.

### Variabel Lingkungan (diinjeksi via Docker Compose)
| Var | Nilai |
|---|---|
| `DATABASE_URL` | `postgresql://postgres:postgrespassword@postgres:5432/qhome_db` |
| `CHROMA_HOST` / `CHROMA_PORT` | `chromadb` / `8000` |
| `SEED_ON_STARTUP` | `"true"` untuk cold-start otomatis |

