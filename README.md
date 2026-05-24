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

## Integrasi Tunggal SumoPod AI Gateway

Sistem ini sepenuhnya ditenagai oleh **SumoPod AI Gateway** (OpenAI-compatible) sebagai penyedia LLM tunggal dan eksklusif untuk menyederhanakan konfigurasi enterprise, menyatukan kuota rate limit, dan mempermudah deployment:

*   **Chief Supervisor (`SUPERVISOR_MODEL`)**: Berjalan menggunakan model high-reasoning (default: `glm-5-turbo`) untuk memahami brief proyek yang rumit, melakukan dekomposisi tugas, mempekerjakan sub-agent spesialis secara dinamis, dan melakukan evaluasi Quality Control laporan final B2B.
*   **Sub-Agents Spesialis (`SUBAGENT_MODEL`)**: Seluruh agen spesialis (Tile, Wood, Stone, Paint, Market Research) berjalan menggunakan model pelaksana berlatensi rendah (default: `gpt-5-nano`) demi kecepatan generasi estimasi yang instan.

---

## Tim Karyawan (Agent Roster)

Seluruh peran agen digital berikut dirutekan dan dieksekusi secara terpadu melalui model SumoPod AI:
1.  **Chief Project Supervisor (Manajer)**: Menganalisis niat pelanggan (*buyer's intent*) dan mendelegasikan tugas ke spesialis relevan. (*SumoPod Supervisor*)
2.  **Ceramic & Tile Estimator**: Mengkalkulasi luas lantai proyek, kebutuhan ubin, rasio limbah ubin (*wastage*), dan sak perekat ubin. (*SumoPod Sub-Agent*)
3.  **Wood Cladding Specialist**: Merekomendasikan panel kayu premium (WPC/Kayu Asli) serta takaran proteksi lapisan anti-rayap/UV. (*SumoPod Sub-Agent*)
4.  **Stone Veneer Specialist**: Mengkalkulasi kebutuhan batu alam untuk pilar/dinding, perekat berat (*heavy-duty bonding*), dan persiapan plesteran. (*SumoPod Sub-Agent*)
5.  **Color & Coating Consultant**: Ahli harmoni palet warna, mengkalkulasi kebutuhan kaleng cat interior/eksterior berbasis teknik *double-coat*. (*SumoPod Sub-Agent*)
6.  **Market Research Analyst**: Agen penjelajah internet (menggunakan **Tavily Search API**) untuk menyajikan referensi arsitektur dan tren material terbaru. (*SumoPod Sub-Agent*)

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

## PILIHAN A: Setup Lokal (Development Mode)

Gunakan metode ini jika Anda ingin melakukan perubahan kode secara langsung dan *live debugging* pada mesin lokal Anda.

### Langkah 2.A: Menjalankan Database Pendukung (Docker)
Putar kontainer database PostgreSQL dan database vektor (ChromaDB) di latar belakang:
```bash
docker compose up -d postgres chromadb
```

### Langkah 3.A: Setup & Seeding Backend (Python)
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
4. Jalankan server API dengan menggunakan Uvicorn:
   ```bash
   uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
   ```

### Langkah 4.A: Setup & Menjalankan Frontend (React)
1. Buka direktori `frontend` di terminal baru:
   ```bash
   cd frontend
   ```
2. Instal seluruh dependensi Node.js dan jalankan dev server:
   ```bash
   npm install
   npm run dev
   ```
3. Akses aplikasi pada alamat `http://localhost:5173`.

---

## PILIHAN B: Setup Full-Container Docker (Production-Ready)

Gunakan metode ini untuk meniru lingkungan production secara instan. Seluruh layanan (PostgreSQL, ChromaDB, Backend, dan Frontend Nginx) akan berjalan dalam kontainer terpisah yang sangat teroptimasi dan aman.

### Langkah 2.B: Jalankan Semua Layanan dengan Satu Perintah
Cukup jalankan perintah berikut di root folder proyek:
```bash
docker compose up --build -d
```

### Langkah 3.B: Verifikasi dan Akses
1. Pastikan semua kontainer berjalan lancar dan statusnya sehat (*healthy*):
   ```bash
   docker compose ps
   ```
   *(Backend memiliki sistem cold-start otomatis yang akan menahan diri untuk aktif sampai PostgreSQL dan ChromaDB siap sepenuhnya, lalu melakukan seeding database otomatis lewat `seed.py` sebelum menghidupkan Uvicorn).*
2. Buka browser Anda dan kunjungi port publik frontend pada alamat **`http://localhost:3000`**.
3. Komunikasi API backend, streaming log simulasi real-time (Server-Sent Events), dan unduhan PDF akan berjalan otomatis di latar belakang melalui reverse proxy Nginx yang sangat efisien!

---

## Manajemen Container Docker (Setelah Perubahan Code)

Setiap kali ada perubahan kode, gunakan perintah berikut sesuai situasinya:

### Rebuild Service Tertentu (Cara Paling Umum)

Karena kode di-*build* ke dalam image Docker, kamu perlu rebuild dulu setelah ada perubahan:

```bash
# Hanya rebuild & restart frontend
docker compose up -d --build frontend

# Hanya rebuild & restart backend
docker compose up -d --build backend

# Rebuild semua sekaligus
docker compose up -d --build
```

### Perubahan File `.env` (Tanpa Rebuild)

Perubahan pada `.env` langsung aktif tanpa perlu rebuild image:

```bash
docker compose up -d backend
```

### Stop & Start Ulang Bersih

```bash
# Stop semua container (data PostgreSQL & ChromaDB tetap aman)
docker compose down

# Jalankan ulang semua service
docker compose up -d --build
```

### Reset Total — ⚠️ Hati-hati, Data Akan Hilang!

```bash
# Hapus container + semua volume (DATABASE AKAN TERHAPUS!)
docker compose down -v

# Rebuild dari awal
docker compose up -d --build
```

### Command Monitoring yang Berguna

```bash
# Lihat status semua container
docker compose ps

# Lihat log realtime semua service
docker compose logs -f

# Lihat log hanya backend
docker compose logs -f backend

# Lihat log hanya frontend
docker compose logs -f frontend

# Restart satu service tanpa rebuild (misal ada hang)
docker compose restart backend
```

### Ringkasan Cepat

| Situasi | Command |
|---------|---------|
| Ubah code frontend | `docker compose up -d --build frontend` |
| Ubah code backend | `docker compose up -d --build backend` |
| Ubah file `.env` | `docker compose up -d backend` |
| Ubah `docker-compose.yml` | `docker compose up -d` |
| Restart bersih | `docker compose down && docker compose up -d --build` |
| Cek status | `docker compose ps` |
| Lihat log | `docker compose logs -f` |

---

## Kebijakan Penanganan Batasan & Mitigasi Rate Limit
Untuk mengoptimalkan kuota API Developer dan efisiensi konsumsi token:
1. **Panggilan Sekuensial (Waterfall Flow)**: Agen spesialis dipanggil bergantian, bukan paralel penuh.
2. **Ultra-Lean Prompting**: Mengurangi muatan teks yang dikirim ke model agar tetap hemat token.
3. **Graceful Fallback**: Mengalihkan proses secara otomatis ke mesin kalkulator lokal sipil (`backend/mcp_tools/calculators.py`) atau model fallback jika terdeteksi galat `429 Too Many Requests`.
