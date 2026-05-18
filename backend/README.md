# QHome-MAS Backend Setup

Panduan ini berisi cara menyiapkan dan menjalankan *backend* FastAPI untuk proyek QHome-MAS.

## Persyaratan
- Python 3.10 atau lebih baru (direkomendasikan)
- Akun dan API Key untuk: Gemini, Groq, dan (opsional) Tavily.

## Langkah-Langkah Setup

1. **Masuk ke Direktori Proyek Utama**
   Kembali ke root proyek utama jika Anda belum di sana.
   ```bash
   cd /home/ahmad/projects/qhomemart-mas-agent
   ```

2. **Buat Virtual Environment**
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install Dependensi**
   Masuk ke direktori `backend` atau *install* secara langsung menggunakan *requirements.txt* dari *root*:
   ```bash
   pip install -r backend/requirements.txt
   ```

4. **Konfigurasi Environment**
   Buat file `.env` di dalam folder *root* proyek (`/home/ahmad/projects/qhomemart-mas-agent/.env`) atau di *environment system* Anda, lalu isi variabel berikut:
   ```env
   GEMINI_API_KEY=your_gemini_api_key
   GROQ_API_KEY=your_groq_api_key
   TAVILY_API_KEY=your_tavily_api_key
   ```

5. **Inisialisasi & Seeding Database**
   Jalankan file *seed* untuk memuat produk awal ke SQLite dan ChromaDB. (Pastikan dijalankan dari *root* direktori).
   ```bash
   python backend/seed.py
   ```

6. **Jalankan Server API**
   Setelah semua terinstal dan database siap, nyalakan *server*:
   ```bash
   uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
   ```
   *Server backend* akan berjalan pada `http://localhost:8000`.
