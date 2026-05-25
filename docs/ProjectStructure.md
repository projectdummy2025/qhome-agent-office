# QHome-MAS: Struktur Proyek & Tech Stack MVP

---

### Sistem Navigasi Dokumentasi (QHome-MAS)
* **[Panduan Utama (README)](file:///home/ahmad/projects/qhomemart-mas-agent/README.md)**
* **[Blueprint Arsitektur (ArchitectureConcept)](file:///home/ahmad/projects/qhomemart-mas-agent/docs/ArchitectureConcept.md)**
* **[Roster Karyawan Digital (AgentRoster)](file:///home/ahmad/projects/qhomemart-mas-agent/docs/AgentRoster.md)**
* **[Panduan Struktur Proyek (ProjectStructure)](file:///home/ahmad/projects/qhomemart-mas-agent/docs/ProjectStructure.md)**
* **[Alur Skenario Sistem (UserSystemFlow)](file:///home/ahmad/projects/qhomemart-mas-agent/docs/UserSystemFlow.md)**
* **[Tutorial Penggunaan Mandiri (TutorialUser)](file:///home/ahmad/projects/qhomemart-mas-agent/docs/TutorialUser.md)**

---

Dokumen ini mendefinisikan tumpukan teknologi (*Tech Stack*) dan struktur direktori fisik untuk membangun MVP "Digital Office" Qhomemart. Struktur ini mematuhi prinsip *Separation of Concerns* (Pemisahan Tanggung Jawab) agar *backend* AI dan *frontend* antarmuka tidak tumpang tindih.

---

## 1. Tech Stack (MVP Production-Ready)

| Komponen | Teknologi Pilihan | Alasan Pemilihan untuk MVP |
| :--- | :--- | :--- |
| **Backend API** | FastAPI (Python) | Performa sangat tinggi, mendukung *async/await* secara native (wajib untuk AI calls), dan dokumentasi Swagger UI bawaan. |
| **Orkestrasi AI** | LangGraph (Python) | Konstruksi graf hierarkis (Supervisor $\rightarrow$ Worker) yang sangat *stateful* dan bisa dikontrol. |
| **Frontend UI** | Vite + React (TS) | Reaktivitas tinggi untuk memantau status agen secara *real-time*. *Styling* menggunakan Vanilla CSS murni. |
| **Database Relasional**| PostgreSQL + SQLAlchemy | Persistensi data proyek (*Long-Term Memory*), transaksi pesanan, dan rekam jejak. Menggunakan tipe `JSONB` native. |
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
│   ├── seed.py               # Script seeding database (PostgreSQL & ChromaDB)
│   ├── seed_products.csv     # Data produk awal untuk disemai (seed)
│   ├── requirements.txt      # Dependensi library Python backend
│   │
│   ├── core/                 # Konfigurasi utama
│   │   ├── config.py         # Pengaturan Environment ($SUMOPOD_API_KEY, dll)
│   │   └── database.py       # Inisialisasi PostgreSQL & ChromaDB
│   │
│   ├── agents/               # Modul Orkestrasi AI
│   │   ├── agent_graph.py    # Chief Supervisor & Orkestrasi LangGraph
│   │   ├── tile_agent.py     # Agen Tile Estimator
│   │   ├── wood_agent.py     # Agen Wood Specialist
│   │   ├── paint_agent.py    # Agen Paint Consultant
│   │   ├── stone_agent.py    # Agen Stone Specialist
│   │   ├── research_agent.py # Agen Restock Researcher
│   │   └── shared.py         # Konfigurasi state, LLM, dan fungsi pembantu
│   │
│   ├── api/                  # Jalur Routing API
│   │   └── routes/
│   │       └── chat_routes.py # Endpoint POST analyze, GET stream, GET history, POST orders, dll.
│   │
│   ├── services/             # Layanan Bisnis Tambahan
│   │   ├── chat_service.py   # Manajemen data percakapan & transaksi database
│   │   ├── pdf_service.py    # Pembuatan laporan PDF proposal belanja juri
│   │   └── simulation_service.py # Logika penyaluran log orkestrasi agen secara real-time
│   │
│   ├── mcp_tools/            # Model Context Protocol Tools
│   │   ├── calculators.py    # Rumus estimasi material (Tile, Wood, Paint, Stone)
│   │   └── web_search.py     # Konektor pencarian web Tavily
│   │
│   └── models/               # Model database relasional
│       └── schema.py         # Definisi tabel SQLAlchemy (ChatSession, Product, Order, dll)
│
├── frontend/                 # Domain khusus Frontend (Vite + React)
│   ├── package.json          # Dependensi Node.js frontend
│   ├── index.html            # Entry point web HTML
│   ├── src/
│   │   ├── main.tsx          # React root render
│   │   ├── App.tsx           # Layout dashboard utama / entry portal
│   │   ├── App.css           # Styling CSS dashboard
│   │   ├── index.css         # Styling CSS global & Glassmorphism
│   │   ├── config.ts         # Konfigurasi URL API backend
│   │   │
│   │   ├── components/       # Komponen visual modular dashboard
│   │   │   ├── AdminPortal.tsx   # Portal administrasi restok & substitusi barang
│   │   │   ├── OrderPortal.tsx   # Portal transaksi pesanan B2B, armada & pembayaran
│   │   │   ├── MaterialCatalog.tsx # Katalog pencarian semantik produk RAG
│   │   │   ├── OrderHistory.tsx  # Riwayat pemesanan pelanggan
│   │   │   │
│   │   │   ├── canvas/       # Komponen visualisasi orkestrasi agen
│   │   │   │   ├── ChatCanvas.tsx   # Interaksi obrolan & Live Canvas rapat multi-agent
│   │   │   │   └── PersonaSelect.tsx # Pengaturan Persona Supervisor & Spesialis
│   │   │   │
│   │   │   ├── order/        # Komponen fungsional transaksi pemesanan
│   │   │   │   ├── OrderCart.tsx     # Detail keranjang belanja & item detail
│   │   │   │   ├── OrderShipping.tsx # Pengaturan kurir logistik & kalkulator jarak
│   │   │   │   └── OrderPayment.tsx  # Konfirmasi invoice & simulasi pembayaran
│   │   │   │
│   │   │   └── admin/        # Komponen fungsional admin pergudangan
│   │   │       ├── RestockPanel.tsx    # Restok produk habis
│   │   │       └── SubstitutePanel.tsx # Pengalihan produk alternatif
│   │   │
│   │   ├── hooks/            # Custom React Hooks
│   │   ├── constants/        # Konstanta pengaturan
│   │   └── utils/            # Helper utilitas frontend
│   │
│   └── public/               # File statis publik
│
├── docs/                     # Dokumentasi Arsitektur (Bahasa Inggris & CamelCase)
│   ├── ArchitectureConcept.md
│   ├── AgentRoster.md
│   ├── ProjectStructure.md
│   ├── UserSystemFlow.md
│   └── TutorialUser.md
│
├── .env                      # File rahasia (TIDAK di-commit ke Git)
├── .env.example              # Template variabel environment (API Keys)
└── docker-compose.yml        # Konfigurasi kontainer DB lokal (Postgres & Chroma)
```

---

## 3. Alur Komunikasi Sistem (Backend $\leftrightarrow$ Frontend)

1. **Inisialisasi**: User membuka UI web (React) dan mengetik kebutuhan renovasi, lalu menekan tombol "Mulai Konsultasi".
2. **REST API Call**: Frontend mengirim POST request ke endpoint backend: `POST /api/projects/analyze`.
3. **Orkestrasi AI**: 
   * FastAPI meneruskan *brief* pelanggan ke **Supervisor Agent** (LangGraph).
   * Supervisor mulai merumuskan strategi dan men-*hire* karyawan secara otonom.
4. **Live Streaming (SSE)**: 
   * Selama agen bekerja dan saling menyerahkan laporan, backend menyemburkan (*streaming*) status melalui endpoint `GET /api/projects/{session_id}/stream`.
   * Frontend (React) menangkap sinyal ini dan meng-update UI secara instan (Misal: Avatar *Tile Estimator* menyala, menandakan dia sedang bekerja).
5. **Finalisasi**: Setelah Supervisor melakukan QC dan menyetujui semua laporan bawahan, status proyek menjadi `completed`. Frontend menampilkan *Grand Proposal* PDF yang bisa diunduh pelanggan.
