# QHome-MAS: Blueprint Arsitektur Dinamis "Digital Office" & Skema MVP

Dokumen ini menguraikan arsitektur *Multi-Agent System* (MAS) untuk Qhomemart yang didesain agar beroperasi selayaknya **Kantor Konsultasi B2B di dunia nyata**. Sistem ini mengedepankan komunikasi ala manusia (penyerahan laporan), orkestrasi dinamis berbasis hierarki (hiring), dan integrasi alat bantu melalui konsep MCP (*Model Context Protocol*) kustom.

---

## 1. Konsep Inti Arsitektur: "The Digital Office"

Alih-alih menggunakan *state-machine* graf (DAG) yang statis dan kaku, kita mengadopsi model **Hierarchical Task-Driven Orchestration** (mirip dengan kapabilitas tingkat lanjut di CrewAI atau AutoGen). 

Pilar utama arsitektur ini meliputi:

### A. Supervisor-Led "Hiring" (Orkestrasi Dinamis)
* **Konsep**: Chief Supervisor bertindak sebagai Manajer Proyek yang otonom. Saat menerima permintaan dari pelanggan (misal: "Saya ingin memasang ubin dan mengecat ruang tamu"), Supervisor akan membaca *intent* tersebut dan **secara dinamis men-hire (memanggil instansiasi)** karyawan yang tepat.
* **Keuntungan**: Sangat efisien dan skalabel. Jika pelanggan tidak butuh batu alam, *Stone Specialist* sama sekali tidak akan dibangun/dipanggil ke memori.

### B. Komunikasi Human-Like (Penyerahan Laporan)
* **Konsep**: Karyawan (Agen LLM) tidak saling melempar variabel JSON mentah secara pemrograman kaku. Ketika seorang karyawan selesai bertugas, mereka menyusun sebuah **"Laporan Hasil Analisis Teknis"** dalam format naratif (disertai lampiran angka).
* **Alur Rapat**: Supervisor membaca laporan tersebut selayaknya manusia, mengevaluasinya (QC), dan dapat merespons: *"Laporan diterima, silakan lanjut,"* atau *"Hitungan wastage Anda sepertinya kurang untuk pola vintage, tolong revisi."*

### C. Custom MCP (Model Context Protocol) Sederhana
* **Konsep**: Karyawan yang dibentuk akan dicolokkan ke antarmuka MCP kustom. MCP ini berfungsi sebagai jembatan tunggal yang aman bagi agen untuk mengakses dunia luar.
* **Isi MCP Qhomemart**: 
  1. *Tool Akses Database*: Menembak query ke Vector DB / SQL untuk mencari harga & spesifikasi produk.
  2. *Tool Kalkulator Sipil*: Pemanggilan sandboxed ke `rules.py` untuk menghitung volume dan kebutuhan perekat (anti-halusinasi).

---

## 2. Strategi Routing LLM Dinamis (Berdasarkan Beban Kognitif)

Untuk memastikan keseimbangan antara **kecepatan (latency)**, **biaya**, dan **kualitas penalaran**, sistem tidak akan mengandalkan satu model LLM secara kaku. Kita akan menerapkan *Dynamic LLM Routing* di mana agen akan memilih "otak" yang sesuai dengan beratnya tugas:

### A. Heavy-Duty LLM (Tugas Kompleks & Orkestrasi)
* **Peran**: Digunakan oleh **Chief Supervisor** untuk menganalisis *brief* pelanggan yang ambigu, memutuskan strategi *hiring* karyawan, dan mengevaluasi logika dalam Laporan Analisis.
* **Engine**: **Gemini 3 Flash Preview**
* **Integrasi**: Native HTTP/cURL Request dengan header `x-goog-api-key: $GEMINI_API_KEY`.

### B. Distributed Lightweight LLMs (Eksekusi Cepat & Load Balancing)
* **Peran**: Digunakan oleh **Dynamic Employees** (misal: Tile Estimator, Paint Consultant) untuk menyusun draf laporan naratif dan memproses RAG.
* **Strategi Load Balancing**: Untuk menghindari limitasi *Token Per Minute* (TPM) yang ketat pada Groq (Maks 6K TPM), beban agen karyawan akan disebar (*distributed*):
  * **Engine 1**: **Qwen (qwen/qwen3-32b)** via Groq (untuk 2 agen spesialis).
  * **Engine 2**: **Gemini 2.5 Flash** atau **Gemini 3 Flash Standard** (untuk 2 agen spesialis lainnya).
* **Integrasi**: Native HTTP/cURL Request dengan header masing-masing sesuai dokumentasi API.

*Catatan: Seluruh kredensial akan dilindungi dan dikelola melalui konfigurasi Environment (`.env` memuat `$GEMINI_API_KEY` dan `$GROQ_API_KEY`).*

---

## 3. Analisis Kode Saat Ini & Rencana Refaktor

### A. Yang Dipertahankan (Fondasi Baik)
1. **Pemisahan Mesin Kalkulasi (Decoupled Math Engine)**: File `rules.py` akan dipertahankan dan ditransformasikan menjadi salah satu fungsi utama di dalam "Server Custom MCP" kita.
2. **Visualisasi Antarmuka**: UI *Live Canvas* dan *Interaction Log* sudah merepresentasikan konsep "Kantor Digital" dengan sangat baik.

### B. Yang Direfaktor (Untuk Mencapai Dinamisme)
1. **Pemanggilan Agen yang Kaku**: Mengubah `asyncio.gather` statis di `supervisor.py` menjadi loop otonom di mana Supervisor yang memegang kendali untuk membangkitkan agen berdasarkan analisis natural *brief* pelanggan.
2. **Katalog File Statis**: Akan dibuang dan diganti sepenuhnya dengan Database Relasional (SQL) dan Vektorial (Qdrant/Milvus) yang diakses melalui arsitektur MCP.

---

## 4. Pemetaan Peran dalam "Digital Office"

1. **The Chief Supervisor (Manajer & Router)**
   * Menerima pelanggan, menganalisis proyek.
   * Men-hire/memanggil agen spesialis yang relevan.
   * Menerima *Laporan Analisis* dari spesialis, memberikan validasi/koreksi, dan akhirnya merangkum semua laporan menjadi *Proposal Final*.
2. **The Dynamic Employees (Task-Oriented Agents)**
   * *Tile Estimator*, *Paint Consultant*, dll. Mereka adalah entitas LLM yang dilengkapi persona kuat.
   * Menerima instruksi kerja dari Supervisor.
   * Memanggil alat melalui Custom MCP untuk mencari material dan menghitung volume.
   * Menyerahkan *Laporan Analisis* naratif (berisi argumen estetika + hitungan mutlak) kembali ke Supervisor.

---

## 5. Skema Database MVP (Sebagai Backend MCP)

### A. Relational Database (PostgreSQL / SQLite)
Menyimpan state proyek dan kebenaran mutlak harga (deterministik).

1. **`projects` (Sesi Konsultasi)**
   * `id` (UUID), `customer_name`, `project_scope_brief` (Teks asli pelanggan).
   * `status` (Enum: scoping, delegating, reviewing, completed).
2. **`products` (Katalog Harga Deterministik - No Hallucination)**
   * `sku` (String, PK), `category`, `name`, `base_price`, `coverage_m2`.
3. **`agent_communications` (Audit Trail Rapat)**
   * `id`, `project_id`, `sender_role`, `receiver_role`
   * `message` (Teks naratif "Laporan Analisis" atau "Revisi dari Supervisor").

### B. Vector Database (Pinecone / Qdrant)
Menyimpan *embeddings* teks untuk pencarian kognitif melalui MCP.

1. **Collection `catalog_knowledge`**
   * *Embeddings* dari narasi visual/SOP produk (misal: "Ubin motif bata merah klasik untuk nuansa hangat vintage").
   * Agen (via MCP) dapat melakukan *Semantic Search* pada koleksi ini.
