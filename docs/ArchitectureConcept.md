# QHome-MAS: Blueprint Arsitektur Dinamis "Digital Office" & Skema MVP

---

### Sistem Navigasi Dokumentasi (QHome-MAS)
* **[Panduan Utama (README)](../README.md)**
* **[Blueprint Arsitektur (ArchitectureConcept)](ArchitectureConcept.md)**
* **[Roster Karyawan Digital (AgentRoster)](AgentRoster.md)**
* **[Panduan Struktur Proyek (ProjectStructure)](ProjectStructure.md)**
* **[Alur Skenario Sistem (UserSystemFlow)](UserSystemFlow.md)**

---

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

## 2. Strategi Penyediaan LLM Terpadu (SumoPod AI Gateway)

Untuk memastikan keseimbangan antara **kecepatan (latency)**, **biaya**, dan **kualitas penalaran**, sistem ini sepenuhnya mengintegrasikan **SumoPod AI Gateway** (OpenAI-compatible) sebagai penyedia LLM eksklusif. Hal ini memusatkan seluruh manajemen rate limit dan penyediaan token:

### A. High-Reasoning Model (Tugas Kompleks & Orkestrasi)
* **Peran**: Digunakan oleh **Chief Supervisor** untuk menganalisis *brief* pelanggan yang ambigu, memutuskan strategi *hiring* karyawan, dan mengevaluasi logika dalam Laporan Analisis.
* **Model Config**: Ditentukan melalui variabel lingkungan `SUPERVISOR_MODEL` (default: `glm-5-turbo`).

### B. Lightweight & Fast Model (Eksekusi Cepat & Efisiensi)
* **Peran**: Digunakan oleh **Dynamic Employees** (misal: Tile Estimator, Paint Consultant) untuk menyusun draf laporan naratif dan memproses RAG dengan cepat.
* **Model Config**: Ditentukan melalui variabel lingkungan `SUBAGENT_MODEL` (default: `gpt-5-nano`).

*Catatan: Seluruh kredensial dikelola secara aman melalui konfigurasi Environment (`.env` memuat `SUMOPOD_API_KEY` dan `SUMOPOD_API_BASE`).*

---

## 3. Analisis Kode & Rencana Refaktor

### A. Yang Dipertahankan (Fondasi Baik)
1. **Pemisahan Mesin Kalkulasi (Decoupled Math Engine)**: File `rules.py` ditransformasikan menjadi salah satu fungsi utama di dalam "Server Custom MCP" kita.
2. **Visualisasi Antarmuka**: UI *Live Canvas* dan *Interaction Log* sudah merepresentasikan konsep "Kantor Digital" dengan sangat baik.

### B. Yang Direfaktor (Untuk Mencapai Dinamisme)
1. **Pemanggilan Agen yang Kaku**: Mengubah `asyncio.gather` statis di `supervisor.py` menjadi loop otonom di mana Supervisor yang memegang kendali untuk membangkitkan agen berdasarkan analisis natural *brief* pelanggan.
2. **Katalog File Statis**: Diganti sepenuhnya dengan Database Relasional (SQL) dan Vektorial (ChromaDB) yang diakses melalui arsitektur MCP.

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

### A. Relational Database (PostgreSQL)
Menyimpan *state* sesi konsultasi, log interaksi agen, detail kalkulasi harga deterministik, metrik performa (KPI), serta pesanan transaksi logistik B2B yang ternormalisasi (3NF).

1. **`chat_sessions` (Sesi Konsultasi & Memori)**
   * `id` (String, PK): ID unik sesi percakapan/estimasi (UUID).
   * `user_id` (String): ID pengguna (default: `default-user`).
   * `title` (String): Judul sesi estimasi (default: `Chat Baru`).
   * `created_at` (DateTime): Waktu pembuatan sesi.
   * `summary` (Text, Nullable): Ringkasan kumulatif percakapan sebagai *long-term memory* bagi agen.

2. **`chat_messages` (Audit Trail Rapat & Interaksi)**
   * `id` (String, PK): ID unik pesan (UUID).
   * `session_id` (String, FK ke `chat_sessions`): ID sesi percakapan terkait.
   * `role` (Enum `ChatRole`): Peran pengirim pesan (`user`, `system`).
   * `content` (Text, Nullable): Isi bubble chat (narasi akhir dari asisten atau input dari pengguna).
   * `agent_logs` (JSONB, Nullable): Log pemikiran internal agen (*agent thoughts* dan kolaborasi multi-agent) dalam format terstruktur.
   * `created_at` (DateTime): Waktu pesan dicatat.

3. **`products` (Katalog Material & Stok Deterministik)**
   * `sku` (String, PK): Kode unik produk (Stock Keeping Unit).
   * `category` (String): Kategori material (misalnya: `tile`, `paint`, dll.).
   * `name` (String): Nama lengkap material.
   * `base_price` (Float): Harga dasar produk per unit.
   * `coverage_m2` (Float): Luas cakupan area per unit (m²).
   * `desc` (Text, Nullable): Keterangan deskriptif detail mengenai produk.
   * `stock_qty` (Integer): Jumlah stok fisik yang tersedia di gudang.

4. **`estimation_kpi` (Pelacak KPI & Performa Sistem - P6)**
   * `id` (String, PK): ID unik log KPI.
   * `session_id` (String, FK ke `chat_sessions`): Sesi estimasi yang diukur.
   * `started_at` (DateTime): Waktu dimulainya proses simulasi.
   * `completed_at` (DateTime, Nullable): Waktu selesainya seluruh proses simulasi.
   * `lead_time_seconds` (Float, Nullable): Total waktu pengerjaan simulasi (KPI target: < 30 detik).
   * `agent_count` (Integer): Jumlah agen yang di-hire oleh Chief Supervisor selama sesi berlangsung.
   * `product_count` (Integer): Jumlah produk unik yang dihasilkan dalam estimasi akhir.
   * `brief_length` (Integer): Panjang teks input pelanggan (*brief* awal) dalam karakter.
   * `pdf_generated` (Integer): Status ekspor PDF proposal (0 = belum, 1 = sudah dibuat).

5. **`orders` (Master Transaksi Pengiriman B2B - 3NF)**
   * `id` (String, PK): ID transaksi pesanan unik (UUID).
   * `session_id` (String, FK ke `chat_sessions`): Sesi konsultasi asal transaksi.
   * `user_id` (String): ID pengguna pembuat pesanan.
   * `client_name` (String, Nullable): Nama pelanggan/instansi B2B.
   * `client_role` (String, Nullable): Peran/jabatan perwakilan pelanggan.
   * `materials_total` (Float): Total biaya untuk seluruh kuantitas material.
   * `shipping_cost` (Float): Biaya armada pengiriman logistik berdasarkan jarak.
   * `total_invoice` (Float): Total tagihan akhir (`materials_total` + `shipping_cost`).
   * `truck_type` (String): Jenis armada angkutan logistik yang digunakan.
   * `delivery_date` (String): Tanggal pengapalan/pengiriman barang.
   * `distance_km` (Float, Nullable): Jarak tempuh lokasi pengiriman (km).
   * `notes` (Text, Nullable): Catatan instruksi pengiriman.
   * `created_at` (DateTime): Waktu transaksi diselesaikan.

6. **`order_items` (Detail Transaksi / Order Line Items - 3NF)**
   * `id` (String, PK): ID unik baris item transaksi.
   * `order_id` (String, FK ke `orders`): ID order induk terkait.
   * `product_sku` (String, FK ke `products`): SKU material produk yang dibeli.
   * `qty` (Float): Jumlah kuantitas material yang dibeli.
   * `price` (Float): Harga satuan barang saat dibeli.
   * `total` (Float): Subtotal harga item (`qty` * `price`).

7. **`stock_recommendations` (Rekomendasi Restok Eksternal dari Research Agent)**
   * `id` (Integer, PK): ID auto-increment.
   * `session_id` (String, FK ke `chat_sessions`): Sesi riset di mana rekomendasi diusulkan.
   * `product_name` (String): Nama barang baru hasil penelusuran internet.
   * `suggested_sku` (String): Usulan kode SKU baru untuk dimasukkan ke katalog.
   * `estimated_price` (Float, Nullable): Estimasi harga pasar terendah.
   * `source_url` (Text, Nullable): Tautan referensi/sumber penelusuran.
   * `specs` (Text, Nullable): Spesifikasi teknis dari produk baru yang direkomendasikan.
   * `status` (String): Status persetujuan restok (misalnya: `pending`, `approved`, dll.).
   * `created_at` (DateTime): Waktu pencatatan rekomendasi.

### B. Vector Database (ChromaDB)
Menyimpan representasi *embeddings* teks untuk pencarian kognitif cepat dan kemampuan *Retrieval-Augmented Generation* (RAG) oleh sub-agent melalui *server* MCP.

1. **Collection `catalog_knowledge`**
   * *Embeddings* dari deskripsi visual, keunggulan, petunjuk pemasangan, dan SOP produk.
   * Spesialis Agen (Tile Estimator, Paint Consultant, dll.) melakukan *Semantic Search* ke koleksi ini guna menemukan kesesuaian estetik material dengan *brief* pelanggan.
