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

## 2. Pilihan A: Setup Lokal (Host Development)

### Persyaratan Lokal
*   Python 3.10 atau lebih baru (direkomendasikan Python 3.11/3.12).
*   PostgreSQL & ChromaDB berjalan di latar belakang (dapat dinyalakan via Docker Compose).

### Langkah-Langkah Setup
1.  **Buat & Aktifkan Virtual Environment**:
    ```bash
    python3 -m venv venv
    source venv/bin/activate
    ```
2.  **Instal Dependensi**:
    ```bash
    pip install -r backend/requirements.txt
    ```
3.  **Inisialisasi & Seeding Database**:
    Jalankan file *seed* untuk memuat produk awal dari CSV (`seed_products.csv`) ke PostgreSQL dan ChromaDB. (Dijalankan dari *root* direktori).
    ```bash
    python backend/seed.py
    ```
4.  **Jalankan Server Uvicorn**:
    ```bash
    uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
    ```
    API Anda akan aktif di `http://127.0.0.1:8000`. Dokumentasi Swagger interaktif dapat diakses langsung di `/docs`.

---

## 3. Pilihan B: Setup Docker (Production-Ready)

Backend telah dilengkapi dengan konfigurasi kontainer terisolasi yang sangat ringan dan aman.

### Berkas Konfigurasi Utama
*   **`backend/Dockerfile`**: Menggunakan teknik *Multi-Stage Build* berbasis `python:3.11-slim` untuk memangkas compiler tools pasca kompilasi dependensi. Kontainer berjalan menggunakan user non-privileged (`appuser`) demi keamanan production.
*   **`backend/entrypoint.sh`**: Skrip otomatisasi cold start yang berfungsi:
    1.  Melakukan TCP pinging untuk menunggu layanan database PostgreSQL dan ChromaDB aktif sepenuhnya sebelum API backend dinyalakan.
    2.  Melakukan seeding database otomatis lewat `seed.py` secara aman jika variabel lingkungan `SEED_ON_STARTUP="true"`.
*   **`backend/.dockerignore`**: Memblokir berkas temporer (`__pycache__`), virtual environment lokal (`venv`), logs, dan berkas rahasia host `.env` agar tidak ikut ter-copy ke dalam Docker daemon.

### Variabel Lingkungan Kontainer (Docker Compose)
Dua variabel lingkungan khusus diinjeksikan pada layer orkestrasi:
*   `DATABASE_URL`: Diarahkan ke host internal kontainer DB `postgresql://postgres:postgrespassword@postgres:5432/qhome_db`.
*   `CHROMA_HOST` & `CHROMA_PORT`: Diarahkan ke layanan `chromadb` port `8000`.
*   `SEED_ON_STARTUP`: Disetel `"true"` untuk memaksa database melakukan seeding otomatis saat pertama kali dideploy (*cold-start*).

