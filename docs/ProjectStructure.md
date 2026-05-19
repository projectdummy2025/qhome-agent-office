# QHome-MAS: Struktur Proyek & Tech Stack MVP

Dokumen ini mendefinisikan tumpukan teknologi (*Tech Stack*) dan struktur direktori fisik untuk membangun MVP "Digital Office" Qhomemart. Struktur ini mematuhi prinsip *Separation of Concerns* (Pemisahan Tanggung Jawab) agar *backend* AI dan *frontend* antarmuka tidak tumpang tindih.

---

## 1. Tech Stack (MVP Production-Ready)

| Komponen | Teknologi Pilihan | Alasan Pemilihan untuk MVP |
| :--- | :--- | :--- |
| **Backend API** | FastAPI (Python) | Performa sangat tinggi, mendukung *async/await* secara native (wajib untuk AI calls), dan dokumentasi Swagger UI bawaan. |
| **Orkestrasi AI** | LangGraph (Python) | Konstruksi graf hierarkis (Supervisor $\rightarrow$ Worker) yang sangat *stateful* dan bisa dikontrol. |
| **Frontend UI** | Vite + React (TS) | Reaktivitas tinggi untuk memantau status agen secara *real-time*. *Styling* menggunakan Vanilla CSS murni. |
| **Database Relasional**| SQLite + SQLAlchemy | Persistensi data proyek (*Long-Term Memory*) tanpa perlu instalasi *server* database (bersifat file lokal). |
| **Vector Database** | ChromaDB (Local) | *Embedded vector search* yang sangat cepat dan gratis untuk menyimpan konteks/katalog RAG tanpa latensi internet. |
| **Komunikasi Live** | Server-Sent Events (SSE)| *Streaming* log agen dari backend ke frontend satu arah secara *real-time* (lebih ringan dibanding WebSockets). |

---

## 2. Struktur Direktori Utama (Directory Tree)

Proyek akan dibagi menjadi dua wilayah utama: `/backend` dan `/frontend`.

```text
qhomemart-mas-agent/
│
├── backend/                  # Domain khusus Backend (FastAPI & AI Agents)
│   ├── main.py               # Entry point FastAPI
│   ├── seed.py               # Script seeding database (SQLite & ChromaDB)
│   ├── seed_products.csv     # Data produk awal untuk disemai (seed)
│   ├── requirements.txt      # Dependensi library Python backend
│   │
│   ├── core/                 # Konfigurasi utama
│   │   ├── config.py         # Pengaturan Environment ($GEMINI_API_KEY, dll)
│   │   └── database.py       # Inisialisasi SQLite & ChromaDB
│   │
│   ├── agents/               # Modul Orkestrasi AI
│   │   └── supervisor.py     # Chief Supervisor & Node Spesialis (Tile, Wood, Paint, Stone, Researcher)
│   │
│   ├── api/                  # Jalur Routing API
│   │   └── routes/
│   │       └── chat.py       # Endpoint POST analyze, GET stream (SSE), GET history, GET PDF
│   │
│   ├── services/             # Layanan Bisnis Tambahan
│   │   ├── pdf_service.py    # Pembuatan laporan PDF proposal belanja juri
│   │   └── simulation_service.py # Logika simulasi stream log agen
│   │
│   ├── mcp_tools/            # Model Context Protocol Tools
│   │   ├── calculators.py    # Rumus estimasi material (Tile, Wood, Paint, Stone)
│   │   └── web_search.py     # Konektor pencarian web Tavily
│   │
│   └── models/               # Model database relasional
│       └── schema.py         # Definisi tabel SQLAlchemy (Project, Product, dll)
│
├── frontend/                 # Domain khusus Frontend (Vite + React)
│   ├── package.json          # Dependensi Node.js frontend
│   ├── index.html            # Entry point web HTML
│   ├── src/
│   │   ├── main.tsx          # React root render
│   │   ├── App.tsx           # Layout dashboard tunggal (Live Canvas, Chat, & Terminal)
│   │   ├── App.css           # Styling CSS dashboard
│   │   ├── index.css         # Styling CSS global & Glassmorphism
│   │   └── assets/           # Gambar & ikon statis (Vite, React, Hero)
│   │
│   └── public/               # File statis publik
│
├── docs/                     # Dokumentasi Arsitektur (Bahasa Inggris & CamelCase)
│   ├── ArchitectureConcept.md
│   ├── AgentRoster.md
│   ├── ProjectStructure.md
│   └── UserSystemFlow.md
│
├── .env                      # File rahasia (TIDAK di-commit ke Git)
├── .env.example              # Template variabel environment (API Keys)
└── docker-compose.yml        # Konfigurasi kontainer DB lokal (Postgres & Chroma)
```

---

## 3. Alur Komunikasi Sistem (Backend $\leftrightarrow$ Frontend)

1. **Inisialisasi**: User membuka UI web (React) dan mengetik kebutuhan renovasi, lalu menekan tombol "Mulai Konsultasi".
2. **REST API Call**: Frontend mengirim POST request ke endpoint backend: `POST /api/v1/projects/analyze`.
3. **Orkestrasi AI**: 
   * FastAPI meneruskan *brief* pelanggan ke **Supervisor Agent** (LangGraph).
   * Supervisor mulai merumuskan strategi dan men-*hire* karyawan.
4. **Live Streaming (SSE)**: 
   * Selama agen bekerja dan saling menyerahkan laporan, backend menyemburkan (*streaming*) status melalui endpoint `GET /api/v1/projects/{id}/stream`.
   * Frontend (React) menangkap sinyal ini dan meng-update UI secara instan (Misal: Avatar *Tile Estimator* menyala, menandakan dia sedang bekerja).
5. **Finalisasi**: Setelah Supervisor melakukan QC dan menyetujui semua laporan bawahan, status proyek menjadi `completed`. Frontend menampilkan *Grand Proposal* PDF yang bisa diunduh pelanggan.
