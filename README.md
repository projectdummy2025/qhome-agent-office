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

## Panduan Setup

### Prasyarat
* **Lokal**: Python 3.10+, Node.js 18+, Docker (untuk PostgreSQL & ChromaDB).
* **Deployment**: Docker saja.

### Konfigurasi `.env`
```bash
cp .env.example .env
```
Isi key berikut di `.env`:
* `SUMOPOD_API_KEY`, `SUMOPOD_API_BASE` (contoh: `https://ai.sumopod.com/v1`)
* `SUPERVISOR_MODEL` (mis. `glm-5-turbo`), `SUBAGENT_MODEL` (mis. `gpt-5-nano`)
* `TAVILY_API_KEY`

---

### Pilihan A — Lokal (Development)

```bash
# 1. Nyalakan DB pendukung
docker compose up -d postgres chromadb

# 2. Backend (terminal 1)
python3 -m venv venv && source venv/bin/activate
pip install -r backend/requirements.txt
python backend/seed.py
uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000

# 3. Frontend (terminal 2)
cd frontend && npm install && npm run dev
```
Akses: `http://localhost:5173`

---

### Pilihan B — Deployment (Full Docker)

```bash
docker compose up --build -d
```
Akses: `http://localhost:3000` (Nginx reverse proxy meneruskan `/api` ke backend; seeding DB jalan otomatis pada cold-start).

Verifikasi:
```bash
docker compose ps
docker compose logs -f
```

---

### Perintah Docker yang Sering Dipakai

| Situasi | Command |
|---------|---------|
| Ubah code frontend / backend | `docker compose up -d --build <service>` |
| Ubah `.env` | `docker compose up -d backend` |
| Restart bersih | `docker compose down && docker compose up -d --build` |
| Reset total (⚠️ hapus data DB) | `docker compose down -v` |
| Cek status / log | `docker compose ps` / `docker compose logs -f` |

---

## Kebijakan Penanganan Batasan & Mitigasi Rate Limit
Untuk mengoptimalkan kuota API Developer dan efisiensi konsumsi token:
1. **Panggilan Sekuensial (Waterfall Flow)**: Agen spesialis dipanggil bergantian, bukan paralel penuh.
2. **Ultra-Lean Prompting**: Mengurangi muatan teks yang dikirim ke model agar tetap hemat token.
3. **Graceful Fallback**: Mengalihkan proses secara otomatis ke mesin kalkulator lokal sipil (`backend/mcp_tools/calculators.py`) atau model fallback jika terdeteksi galat `429 Too Many Requests`.
