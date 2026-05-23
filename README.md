# QHome-MAS: Autonomous B2B Sales & Project Agent

QHome-MAS (Multi-Agent System) adalah sistem cerdas **MVP (Minimum Viable Product)** yang dirancang khusus sebagai **Sales & Project Agent** untuk konsultasi material sipil, desain interior, dan manajemen logistik B2B Qhomemart. Sistem ini membuang pendekatan *chatbot* linier konvensional dan menggantinya dengan konsep **"Kantor Konsultasi Digital"**.

Di dalam kantor digital ini, agen-agen kecerdasan buatan beroperasi layaknya **karyawan manusia sesungguhnya**. Mereka memiliki hierarki, melakukan komunikasi berbasis *Laporan Analisis*, menggunakan alat bantu khusus melalui antarmuka *Model Context Protocol (MCP)*, dan direkrut (*hired*) secara dinamis berdasarkan cakupan proyek.

---

### Sistem Navigasi Dokumentasi (QHome-MAS)
* **[Panduan Utama (README)](README.md)**
* **[Blueprint Arsitektur (ArchitectureConcept)](docs/ArchitectureConcept.md)**
* **[Roster Karyawan Digital (AgentRoster)](docs/AgentRoster.md)**
* **[Panduan Struktur Proyek (ProjectStructure)](docs/ProjectStructure.md)**
* **[Alur Skenario Sistem (UserSystemFlow)](docs/UserSystemFlow.md)**

---

## Arsitektur Teknologi Utama (The Stack)

Proyek ini menggunakan *stack* mutakhir yang memisahkan beban kerja antara *backend* komputasi dan *frontend* visualisasi secara terstruktur.

### 1. Backend (Orkestrasi Agen & API)
* **Framework Utama**: **FastAPI** (Python) untuk *endpoint* performa tinggi berbekal dukungan fungsi asinkron.
* **Modular Architecture**: Menggunakan **APIRouter** (`backend/api/routes`) dan pemisahan logika ke `backend/services/` untuk menjamin kebersihan kode dan kemudahan penambahan fitur di skala *Enterprise*.
* **Orkestrasi AI**: **LangGraph** digunakan untuk menciptakan alur hirarki di mana Supervisor memegang kendali (DAG/State Graph) dalam mendelegasikan tugas ke spesialis lain secara bergiliran (*waterfall/throttled execution*).
* **Komunikasi Data**: **Server-Sent Events (SSE)** digunakan untuk men- *stream* proses pemikiran agen ke *frontend* secara instan.
* **Integrasi Alat (Custom MCP)**: Sebuah *Model Context Protocol* kustom di *backend* yang menjembatani agen LLM dengan Kalkulator Matematika Sipil deterministik (anti-halusinasi) dan Vector DB.

### 2. Frontend (Real-Time Live Canvas)
* **Framework**: **Vite + React (TypeScript)** untuk reaktivitas super tinggi, memungkinkan status agen ("Aktif", "Berpikir", "Menulis Laporan") dilacak secara visual di layar tanpa distorsi DOM.
* **Styling**: Mematuhi aturan desain estetis tinggi menggunakan **Vanilla CSS murni** untuk menghadirkan efek *premium Glassmorphism* dan *Dark Mode*, tanpa bergantung pada Tailwind.

### 3. Database (Long-Term Memory & RAG)
* **Relational DB**: **PostgreSQL** menyimpan kepastian harga dasar produk, riwayat interaksi (*audit logs*), dan menggunakan tipe data **JSONB** asli untuk performa tinggi dalam menyimpan struktur pemikiran (*chain-of-thought*) agen. Mengeliminasi probabilitas agen salah menebak harga.
* **Vector DB**: **ChromaDB** menyimpan *embeddings* dari pustaka material/SOP untuk pencarian semantik agen (RAG).

---

## Strategi "Dynamic LLM Routing"

Untuk mengakali batasan *Rate Limit* pada penyedia layanan API pihak ketiga, serta menyeimbangkan biaya dan *reasoning quality*, sistem ini menggunakan **Distribusi LLM Otomatis**:

* **Gemini 3 Flash Preview**: Berperan sebagai **Chief Supervisor**, karena kemampuannya dalam memahami instruksi kompleks, memutuskan *hiring*, dan melakukan *Quality Control* tingkat tinggi.
* **Groq LPU (Qwen 3 - 32B)**: Berperan sebagai agen pelaksana spesialis (Wood, Paint). Berkat infrastruktur *ultra-low latency* Groq, *drafting* laporan sangat instan.
* **Gemini 2.5 Flash**: Berperan sebagai spesialis lainnya (Tile, Stone, Market Research) untuk mendistribusikan limitasi token Groq (terbatas 6K TPM) dan mengeksekusi pencarian web panjang.

---

## Tim Karyawan (Agent Roster)

1. **Chief Project Supervisor (Manajer)**: Menganalisis niat pelanggan (*buyer's intent*) dan HANYA memanggil agen yang relevan. (*Gemini 3 Flash*)
2. **Ceramic & Tile Estimator**: Menghitung kebutuhan ubin, *wastage*, dan sak perekat ubin. (*Gemini 2.5 Flash*)
3. **Wood Cladding Specialist**: Merekomendasikan panel kayu asli serta proteksi lapisan anti-rayap/UV. (*Groq Qwen 32B*)
4. **Stone Veneer Specialist**: Mengkalkulasi pilar batu alam, *heavy-duty bonding*, dan instruksi persiapan dinding. (*Gemini 2.5 Flash*)
5. **Color & Coating Consultant**: Ahli harmoni warna, mengkalkulasi galon cat interior menggunakan teknik *double-coat*. (*Groq Qwen 32B*)
6. **Market Research Analyst**: Agen pencari fakta internet (didukung oleh **Tavily Search API**) untuk mencari referensi gaya arsitektur terkini dari luar. (*Gemini 2.5 Flash*)

---

## Panduan Setup & Instalasi Utama (Developer Onboarding)

Ikuti langkah-langkah di bawah ini untuk menjalankan seluruh sistem QHome-MAS di komputer lokal Anda.

### Prasyarat Sistem
* **OS**: Linux / macOS (Windows disarankan menggunakan WSL2).
* **Python**: Versi 3.10 atau lebih tinggi.
* **Node.js**: Versi 18 atau lebih tinggi dengan `npm` / `yarn`.
* **Docker**: Dipasang dan dapat berjalan di latar belakang (untuk ChromaDB & PostgreSQL).
* **RTK (Rust Token Killer)**: CLI proxy penghemat token wajib dipasang (lihat aturan global).

---

### Langkah 1: Kloning & Persiapan Environment
Salin file template `.env.example` menjadi `.env` di direktori utama:
```bash
cp .env.example .env
```
Buka file `.env` dan lengkapi API Key berikut (menggunakan format endpoint *OpenAI-Compatible* via SumoPod):
* `SUMOPOD_API_KEY`: Kunci akses API utama Anda.
* `SUMOPOD_API_BASE`: Endpoint base URL (contoh: https://ai.sumopod.com/v1).
* `SUPERVISOR_MODEL`: Nama model untuk agen manajer (misal: glm-5-turbo).
* `SUBAGENT_MODEL`: Nama model untuk agen spesialis (misal: gpt-5-nano).
* `TAVILY_API_KEY`: Kunci akses pencarian web Tavily.

---

### Langkah 2: Menjalankan Database (Docker Compose)
Putar kontainer database relasional dan database vektor (ChromaDB) di latar belakang:
```bash
docker compose up -d
```
Pastikan kontainer berjalan normal dengan mengecek status:
```bash
docker compose ps
```

---

### Langkah 3: Setup & Seeding Backend (Python)
1. Buka folder root proyek dan buat virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```
2. Instal semua dependensi pustaka Python yang dibutuhkan:
   ```bash
   pip install -r backend/requirements.txt
   ```
3. Lakukan **Seeding Katalog Produk** (menyemai 80+ item produk QHomeMart ke PostgreSQL dan ChromaDB Vector Store):
   ```bash
   python backend/seed.py
   ```

---

### Langkah 4: Menjalankan Server Backend
Jalankan server API FastAPI dengan menggunakan Uvicorn:
```bash
uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
```
Server backend sekarang aktif di `http://127.0.0.1:8000`. Anda dapat mengakses dokumentasi interaktif Swagger API di `http://127.0.0.1:8000/docs`.

---

### Langkah 5: Setup & Menjalankan Frontend (React)
1. Buka direktori `frontend`:
   ```bash
   cd frontend
   ```
2. Instal seluruh dependensi Node.js:
   ```bash
   npm install
   ```
3. Jalankan server pengembangan Vite:
   ```bash
   npm run dev
   ```
4. Buka peramban (browser) dan akses alamat `http://localhost:5173`.
---

## Kebijakan Penanganan Batasan & Mitigasi Rate Limit
Meningkatnya batasan kuota API Developer (Groq dibatasi maksimum **6.000 TPM**):
1. **Panggilan Sekuensial (Waterfall Flow)**: Agen spesialis dipanggil bergantian, bukan paralel penuh.
2. **Ultra-Lean Prompting**: Mengurangi muatan teks yang dikirim ke model agar tetap hemat token.
3. **Graceful Fallback**: Mengalihkan proses secara otomatis ke mesin kalkulator lokal sipil (`backend/mcp_tools/calculators.py`) atau model fallback jika terdeteksi galat `429 Too Many Requests`.
