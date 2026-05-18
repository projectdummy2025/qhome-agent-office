# QHome-MAS: Autonomous Agentic Office (B2B)

QHome-MAS (Multi-Agent System) adalah sistem cerdas generasi terbaru untuk konsultasi material sipil dan desain interior Qhomemart. Sistem ini membuang pendekatan *chatbot* linier konvensional dan menggantinya dengan konsep **"Kantor Konsultasi Digital"**.

Di dalam kantor digital ini, agen-agen kecerdasan buatan beroperasi layaknya **karyawan manusia sesungguhnya**. Mereka memiliki hierarki, melakukan komunikasi berbasis *Laporan Analisis*, menggunakan alat bantu khusus melalui antarmuka *Model Context Protocol (MCP)*, dan direkrut (*hired*) secara dinamis berdasarkan cakupan proyek.

---

## Arsitektur Teknologi Utama (The Stack)

Proyek ini menggunakan *stack* mutakhir yang memisahkan beban kerja antara *backend* komputasi dan *frontend* visualisasi secara terstruktur.

### 1. Backend (Orkestrasi Agen & API)
* **Framework Utama**: **FastAPI** (Python) untuk *endpoint* performa tinggi berbekal dukungan fungsi asinkron.
* **Orkestrasi AI**: **LangGraph** digunakan untuk menciptakan alur hirarki di mana Supervisor memegang kendali (DAG/State Graph) dalam mendelegasikan tugas ke spesialis lain secara bergiliran (*waterfall/throttled execution*).
* **Komunikasi Data**: **Server-Sent Events (SSE)** digunakan untuk men- *stream* proses pemikiran agen ke *frontend* secara instan.
* **Integrasi Alat (Custom MCP)**: Sebuah *Model Context Protocol* kustom di *backend* yang menjembatani agen LLM dengan Kalkulator Matematika Sipil deterministik (anti-halusinasi) dan Vector DB.

### 2. Frontend (Real-Time Live Canvas)
* **Framework**: **Vite + React (TypeScript)** untuk reaktivitas super tinggi, memungkinkan status agen ("Aktif", "Berpikir", "Menulis Laporan") dilacak secara visual di layar tanpa distorsi DOM.
* **Styling**: Mematuhi aturan desain estetis tinggi menggunakan **Vanilla CSS murni** untuk menghadirkan efek *premium Glassmorphism* dan *Dark Mode*, tanpa bergantung pada Tailwind.

### 3. Database (Long-Term Memory & RAG)
* **Relational DB**: **SQLite / PostgreSQL** menyimpan kepastian harga dasar produk dan riwayat interaksi (*audit logs*), mengeliminasi probabilitas agen salah menebak harga.
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

## Mitigasi Infrastruktur Sistem
Mengingat infrastruktur API gratis memiliki batasan (seperti model Groq yang dibatasi maksimal **6.000 TPM**), eksekusi agen tidak dilakukan secara paralel murni. Supervisor mendelegasikan perintah secara sekuensial (*waterfall*), dibantu dengan metode *Ultra-Lean Prompting* yang sangat ringkas, serta perlindungan tangkapan *error 429* untuk otomatis melakukan *graceful fallback* agar sistem tidak pernah hancur (crash).

---

## Persiapan Database (Docker & Seeding)
Untuk mendukung *scale* level *Enterprise*, proyek ini menggunakan **PostgreSQL** (Chat History BSON/JSONB) dan **ChromaDB** (Vector RAG) yang berjalan di dalam Docker Container. 

1. Pastikan Docker/Podman sudah terinstal.
2. Putar container database di latar belakang:
   ```bash
   docker compose up -d
   ```
3. Lakukan injeksi (*seeding*) 80+ katalog material QHomeMart dari Markdown langsung ke dalam database:
   ```bash
   python backend/seed.py
   ```

---

## Persiapan Pengembangan Awal (Getting Started)
Lihat konfigurasi kerangka sistem pada folder `/docs`. Modul `.env.example` sudah disertakan di repositori ini. Salin file tersebut menjadi `.env` dan isi dengan **GEMINI_API_KEY**, **GROQ_API_KEY**, **TAVILY_API_KEY** serta konfigurasi **DATABASE_URL** dan **CHROMA_PORT** milik Anda sebelum memulai *scaffolding* server.
