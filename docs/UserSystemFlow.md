# QHome-MAS: User & System Flow Scenario

---

### Sistem Navigasi Dokumentasi (QHome-MAS)
* **[Panduan Utama (README)](../README.md)**
* **[Blueprint Arsitektur (ArchitectureConcept)](ArchitectureConcept.md)**
* **[Roster Karyawan Digital (AgentRoster)](AgentRoster.md)**
* **[Panduan Struktur Proyek (ProjectStructure)](ProjectStructure.md)**
* **[Alur Skenario Sistem (UserSystemFlow)](UserSystemFlow.md)**

---

Dokumen ini memetakan skenario interaksi end-to-end (dari awal hingga akhir) antara Pelanggan Profesional B2B (User) dan Ekosistem Multi-Agent Qhomemart dalam skema **B2B Consultation & Procurement Hub**.

---

## 1. Profil & Metadata Persona B2B

Sistem menyediakan skenario penanganan logistik cerdas berdasarkan jarak fisik dari kantor pusat (**QHome HQ**) ke lokasi pengiriman masing-masing persona:

1. **Ibu Amalia (Senior Architect & Designer)**
   * **Lokasi Pengiriman**: Sleman
   * **Jarak Tempuh**: **8 Km**
   * **Fokus**: Estetika premium, panel WPC, granit mewah, dan keselarasan desain ruang.

2. **Bapak Joko (General Contractor & Engineer)**
   * **Lokasi Pengiriman**: Bantul
   * **Jarak Tempuh**: **15 Km**
   * **Fokus**: Volume material struktural besar, semen, keramik kokoh, dan optimalisasi bujet proyek.

3. **Ibu Santi (Retail & Procurement Partner)**
   * **Lokasi Pengiriman**: Kulon Progo
   * **Jarak Tempuh**: **35 Km**
   * **Fokus**: Pembelian volume grosir berkala, logistik berjadwal, dan keakuratan daftar belanja.

4. **Bapak Rudi (Lead System Administrator)**
   * **Fokus**: Otentikasi pengawasan sistem, penyesuaian stok gudang kritis (*Out-of-Stock*), dan otorisasi transaksi.

---

## 2. User Flow (Kacamata Pelanggan B2B)

Sistem menampilkan dashboard **Split-Screen Premium** yang terbagi menjadi dua panel aktif utama:

```
+---------------------------------------------------------+
|                  QHomeMart Digital Office               |
+--------------------------+------------------------------+
|                          |                              |
|   Panel Diskusi Chat     |   Halaman Khusus B2B Cart    |
|        (Tengah)          |           (Kanan)            |
|                          |                              |
|  * Murni obrolan alami   |  * Daftar Material Terkurasi |
|  * Bebas tabel panjang   |  * Peringatan Stok Kritis    |
|  * Diskusi alternatif    |  * Kurir & Jadwal Logistik   |
|                          |  * Ringkasan Tagihan B2B     |
|                          |                              |
+--------------------------+------------------------------+
```

### Langkah 1: Input Brief & Konsultasi
1. User (misal: **Ibu Amalia**) masuk ke dashboard, memilih persona, dan memasukkan spesifikasi kebutuhan proyek konstruksinya.
2. **Brief Kebutuhan (Contoh)**: *"Saya ingin merenovasi teras dan ruang tamu dengan marmer putih mewah di Sleman. Dinding area TV tolong dipasang panel kayu bergaris fluted, dan sisa dindingnya dicat warna terang ramah anak."*
3. User menekan tombol **"Konsultasi Sekarang"**.

### Langkah 2: Observasi Live Canvas & Terminal Stream (Agent Activity)
Sistem mulai mengkalkulasi di latar belakang. User disuguhkan dengan nuansa simulasi digital office yang hidup:
1. **Live Office Canvas**: Di layar, avatar **Chief Supervisor** menyala hijau menandakan koordinasi awal dimulai. Avatar agen spesialis (**Tile Estimator**, **Wood Specialist**, dan **Paint Consultant**) menyala secara bergantian sesuai giliran tugas mereka.
2. **Terminal Stream Logs (Aktifitas Agen)**: Pada panel log di dalam chat, user dapat membaca proses berpikir internal (*chain-of-thought*) agen secara *real-time*:
   * *"Tile Estimator sedang mencari granit marmer putih di katalog..."*
   * *"Wood Specialist sedang memverifikasi cakupan panel kayu bergaris..."*
   * *"Paint Consultant sedang memilih opsi cat ramah anak anti noda..."*

### Langkah 3: Sinkronisasi Asinkron Real-Time & Curation
Setelah kalkulasi selesai:
1. **Chat Diskusi (Tengah)**: Menyajikan gelembung dialog alami dari para agen ahli yang menjelaskan rancangan estetika dan pertimbangan sipil secara naratif (tanpa diganggu tabel belanja panjang).
2. **B2B Procurement Cart (Kanan)**: Menyajikan daftar material terkurasi, volume mutlak, harga satuan, dan total subtotal secara instan dan sinkron.

### Langkah 4: Penanganan Interaktif Stok Kritis (Out-of-Stock / OOS)
1. Jika terdeteksi produk yang kehabisan stok atau kuantitasnya kurang:
   * Tombol checkout di Keranjang Belanja B2B **dikunci otomatis**.
   * Banner peringatan menyala merah: *"Butuh Konfirmasi Admin"*.
2. User mengklik tombol **"Intervensi Admin"**:
   * Sistem melakukan transisi mulus ke portal persona **Bapak Rudi (Admin)**.
   * Admin membuka **Portal Admin**, menambahkan pasokan stok material kritis bersangkutan, lalu mengklik setujui (*Approve*).
   * Setelah seluruh item berstatus habis stok terselesaikan, Admin Portal secara asinkron memanggil endpoint `POST /api/projects/sessions/{session_id}/restock-complete`.
   * Sistem *backend* menyuntikkan pesan otomatis dari agen ke dalam obrolan, menginformasikan klien bahwa stok sudah diatasi.
3. User kembali ke chat (atau layar otomatis *refresh* via *BroadcastChannel*): keranjang otomatis ter-sinkronisasi ulang, tanda peringatan hilang, dan tombol checkout kini **terbuka**.

### Langkah 5: Pemilihan Armada Kurir & Penjadwalan Dinamis
User menekan tombol "Lanjutkan ke Pengiriman" untuk masuk ke **Step 2 (Logistics)** pada panel kanan:
1. **Pemilihan Armada**: User memilih jenis truk pengiriman kargo yang cocok. Biaya kirim otomatis terhitung secara real-time berdasarkan formula logistik jarak persona Sleman (**8 Km**):
   * **Colt Diesel Double (CDD)**: Tarif Dasar Rp 400.000 + (Jarak × Rp 15.000/Km)
   * **Truk Fuso Box**: Tarif Dasar Rp 900.000 + (Jarak × Rp 25.000/Km)
   * **Tronton Wingbox**: Tarif Dasar Rp 1.800.000 + (Jarak × Rp 40.000/Km)
2. **Penjadwalan & Catatan**: User menentukan tanggal kirim proyek dan menyertakan catatan logistik (akses jalan, pintu carport, dll).

### Langkah 6: Double Verification Modal (Sweet Popup)
1. User mengklik **"Lanjutkan Verifikasi"**.
2. **Popup Verifikasi Ganda** yang sangat premium muncul memblokir layar dengan efek blur. User wajib mencentang dua kotak verifikasi interaktif:
   * [ ] *"Saya memverifikasi spesifikasi arsitektural dan volume material yang tercantum..."*
   * [ ] *"Saya menyetujui jadwal pengiriman kargo dan biaya logistik B2B..."*
3. Tombol **"PROSES TRANSAKSI RESMI B2B"** menyala aktif setelah kedua kotak tercentang. User mengklik tombol untuk menyelesaikan transaksi.

### Langkah 7: Success Payment, Verifikasi QRIS Interaktif & Sinkronisasi Chat Real-Time
1. Pesanan dikirim secara aman ke database pergudangan.
2. Panel kanan beralih ke **Step 3 (Success)**:
   * Menampilkan ID Tagihan resmi (misal: `ORD-5D7E8F1A`).
   * Menampilkan **Simulated QRIS Stand** interaktif bergaya GPN Standard Indonesia lengkap dengan matrix piksel dinamis sebagai metode pembayaran B2B.
   * Menyediakan tombol **"Unduh PDF Nota Belanja Resmi"** yang memicu backend memproduksi dokumen nota komersial resmi dengan grafis vektor stand QR Code.
   * Menyediakan tombol **"Konfirmasi Sudah Bayar"** interaktif. Ketika diklik, sistem mengirim sinyal verifikasi pembayaran ke backend secara real-time.
   * **Sinkronisasi Otomatis Tanpa Reload**: Setelah tombol konfirmasi diklik, sistem menggunakan **BroadcastChannel (`qhome_payment_channel`)** untuk memicu sinkronisasi riwayat obrolan secara instan di tab obrolan utama. Pengguna otomatis dialihkan kembali ke layar chat utama setelah 1.5 detik dengan gelembung chat dari agen yang langsung menampilkan status verifikasi pembayaran sukses dan pengaktifan kargo logistik tanpa perlu me-reload halaman.

---

## 3. System Flow (Di Balik Layar / Under the Hood)

Bagaimana FastAPI, LangGraph, dan SumoPod AI Gateway bekerja mengorkestrasi ekosistem multi-agent secara dinamis:

### Fase 0: Long-Term Memory & Persistent Chat Context
1. **Pengambilan Konteks (Database)**: Sebelum simulasi dijalankan, sistem mengambil riwayat sesi dari database (`ChatSession`). Jika ini adalah percakapan lanjutan, kolom `summary` (yang bertindak sebagai memori jangka panjang) dibaca dan disimpan sebagai variabel `history_summary`.
2. **Injeksi Konteks ke Agen**: `history_summary` disuntikkan ke dalam *State Graph* LangGraph dan diteruskan ke seluruh agen spesialis (`Tile Estimator`, `Wood Specialist`, `Paint Consultant`, `Stone Specialist`, dll.) serta `Chief Supervisor` dan `Synthesizer`. Hal ini memastikan agen-agen dapat membedakan konteks baru dan mengingat riwayat percakapan revisi/estimasi sebelumnya.
3. **Pembaruan Memori Otomatis**: Setelah simulasi selesai (`synthesizer` menyusun narasi akhir), asisten AI (menggunakan SumoPod AI) akan merangkum seluruh percakapan terbaru beserta respons agen, lalu memperbarui kolom `summary` di database (`ChatSession.summary`) secara asinkron.

### Fase 1: Ingestion & Routing (Supervisor)
1. React mengirimkan `POST /api/projects/analyze` brief proyek ke FastAPI.
2. **Supervisor LLM (SumoPod AI Supervisor)** membaca teks.
   * *Intent Extraction*: Area = 20 m² (5x4). Material = Granit Marmer, Panel Kayu Bergaris, Cat mudah dibersihkan.
   * *Dynamic Routing*: Memutuskan untuk men-*hire* (menaktifkan *node* LangGraph menuju) agen-agen spesialis secara dinamis berdasarkan isi brief: `tile`, `wood`, `stone`, `paint`, atau `researchere`.
3. FastAPI memetakan alur kerja sekuensial dan menyimpannya di memori `active_streams[session_id]`. Sinyal **SSE (Server-Sent Events)** dipancarkan ke React untuk mengaktifkan avatar visual: `{"event": "routing", "hired": ["tile", "wood", "paint"]}`.

### Fase 2: Eksekusi Spesialis Sekuensial (Waterfall) & Verifikasi Inventaris Gudang
*(Untuk mengoptimalkan pembagian rate limit dan kelancaran token, eksekusi dilakukan secara bergiliran / sekuensial di dalam LangGraph)*

#### A. Giliran Tile Estimator (SumoPod AI Sub-Agent)
* **RAG Search**: Memanggil MCP `search_vector_catalog("granit marmer putih")`. ChromaDB membalas dengan `TLE-001 (White Carara)`.
* **Kalkulasi**: Memanggil MCP `calculate_tile_needs(area=20, sku="TLE-001")`. 
  * *Sistem Backend (rules.py)* menghitung: Butuh 15 Dus Granit + Margin wastage 5% + 4 Sak Semen MU-480 + 3 Kg Nat AM Putih.
* **Laporan**: Menulis narasi argumen estetika dan menyerahkan *JSON payload* biaya ke memori LangGraph.

#### B. Giliran Wood Specialist (SumoPod AI Sub-Agent)
* **RAG Search**: Memanggil MCP `search_vector_catalog("panel kayu bergaris fluted")`. ChromaDB membalas dengan `WPC-001 (Fluted Teak Wood)`.
* **Kalkulasi**: Memanggil MCP `calculate_wood_needs(area=5, sku="WPC-001")` (Asumsi dinding TV = 5m²).
  * *Sistem Backend* menghitung: Butuh 12 Lembar WPC + 2 Tube Sealant Dextone.
* **Laporan**: Menyerahkan draf narasi ke memori LangGraph.

#### C. Giliran Paint Consultant (SumoPod AI Sub-Agent)
* **RAG Search**: Memanggil MCP `search_vector_catalog("cat terang mudah dibersihkan ramah anak")`. ChromaDB merekomendasikan `PNT-003 (Dulux Easy Clean)`.
* **Kalkulasi**: Memanggil MCP `calculate_paint_needs(area=45, sku="PNT-003")` (Asumsi sisa dinding).
  * *Sistem Backend* menghitung: Butuh 1 Pail (25kg) dengan asumsi 2 lapis (*double coat*).
* **Laporan**: Diserahkan ke memori LangGraph.

#### D. Verifikasi Inventaris & Alternatif Substitusi (Inventory Administrator)
* **Pengecekan database riil**: `Inventory Administrator` dijalankan secara otomatis di dalam graf untuk memeriksa ketersediaan stok fisik produk yang direkomendasikan spesialis pada tabel `products` di database PostgreSQL.
* **Logika Pengecekan**:
  * Jika stok produk tercukupi (`stock_qty >= 20` dan `>= qty_int`), status diset `TERSEDIA`.
  * Jika stok produk kritis (`< 20`) atau kosong (`0`), status diset `TERBATAS` atau `HABIS`.
  * **Pencarian Alternatif Otomatis**: Jika stok habis, sistem secara otonom mencari produk sejenis di kategori yang sama yang memiliki ketersediaan stok melimpah (`stock_qty >= qty_int`), menyematkannya sebagai produk substitusi di keranjang belanja, serta menyuntikkan tag `[STOK TERBATAS]` atau `[STOK HABIS]` ke dalam metadata produk untuk mengunci tombol *checkout* di frontend.

#### E. Riset Harga Pasar & Rekomendasi Restok Paralel (Restock Researcher)
* **Identifikasi OOS**: Mendeteksi produk pendukung baru hasil internet riset (seperti semen pendukung, cairan coating, pengisi nat) atau produk berlabel `[STOK HABIS]` / SKU `"OOS-"`.
* **Riset Internet Paralel**: Jika ada produk OOS, agen memicu **web search paralel menggunakan `ThreadPoolExecutor`** (maksimal 5 pekerja bersamaan) untuk mencari informasi harga riil pasar Indonesia menggunakan Tavily Search API.
* **Ekstraksi Cerdas LLM**: Hasil pencarian web dikirim ke `gemini_specialist` dengan format prompt ekstraksi ketat guna menghasilkan JSON berisi: `recommended_brand`, `estimated_price_rp`, `specs`, dan `source_url`.
* **Penyimpanan Rekomendasi B2B**: Menyimpan otomatis rekomendasi riset pasar tersebut ke dalam tabel `stock_recommendations` dengan status `pending` agar siap ditinjau dan di-restok secara instan oleh admin Bapak Rudi di Admin Portal.
* **Update Draf Belanja**: Mengisi harga taksiran pasar ke dalam gelembung obrolan & keranjang dengan label `[Nama Produk] [Brand] (Estimasi Internet - Menunggu Validasi)`.

### Fase 3: Quality Control & Sintesis Proposal (Supervisor)
1. **Supervisor (SumoPod AI Supervisor)** diaktifkan kembali.
2. Membaca seluruh laporan yang dikumpulkan spesialis di *State Graph*.
3. **Pengecekan Logika & Konsistensi**: Supervisor memastikan bahwa *Tile Estimator* tidak lupa memasukkan semen pelapis, *Wood Specialist* mengikutsertakan sealant pengisi celah, dan *Paint Consultant* sudah memperhitungkan 2 lapis pengecatan ramah anak.
4. **Sintesis JSON (Synthesizer)**: Supervisor menggabungkan seluruh laporan menjadi satu *Grand JSON Object* yang sangat terstruktur berisi narasi gabungan, daftar produk terpadu, dan disclaimer hukum sipil.
5. **SSE Log Buffer & Delay Cleanup**: Seluruh log aktivitas disalurkan melalui EventSourceResponse `GET /api/projects/{session_id}/stream`. Setelah simulasi tuntas, sistem menahan pembersihan data streaming in-memory selama 10 detik (`cleanup_stream`) agar frontend React memiliki waktu yang cukup untuk membaca seluruh potongan SSE log secara sempurna.

### Fase 4: Pelacakan KPI & Performa Sistem (KPI Tracker - P6)
1. Saat simulasi dimulai, sistem mencatat waktu presisi `kpi_started_at` di memori.
2. Begitu `synthesizer` selesai memproses proposal akhir, sistem mencatat waktu `kpi_completed_at` dan menghitung durasi pengerjaan (`lead_time_seconds = completed_at - started_at`).
3. Sistem secara otomatis menyimpan catatan performa ke tabel `estimation_kpi` untuk memantau indikator keberhasilan:
   * `lead_time_seconds`: Total waktu pengerjaan proposal (Target B2B: < 30 detik).
   * `agent_count`: Jumlah agen yang terlibat dalam orkestrasi.
   * `product_count`: Jumlah produk yang direkomendasikan.
   * `brief_length`: Panjang teks input pelanggan (karakter).
   * `pdf_generated`: Inisialisasi awal bernilai `0`.

### Fase 5: Sinkronisasi Transaksi & API Pemesanan (3NF Database)
Saat pengguna menyetujui verifikasi ganda dan memproses transaksi resmi, frontend menembak API:
* **HTTP POST `/api/projects/orders`**
* **Integritas Database (schema.py & chat_service.py)**: Menulis relasi transaksi ke dalam tabel `orders` dan `order_items` yang ternormalisasi (3NF).
* **Mitigasi ForeignKeyViolation**: Sebelum menulis baris order, sistem secara otonom mendeteksi apakah `product_sku` hasil riset internet sudah terdaftar di master produk database. Jika belum, sistem menyuntikkan placeholder pendukung sementara (seperti `Semen Perekat Instan (Menunggu Konfirmasi)`) ke tabel `products` secara otomatis sebelum melakukan *flush* data transaksi order, guna menjamin integritas relasi tabel data pergudangan.

### Fase 6: Roda Nota Belanja & Vector QRIS Drawing
Saat tombol "Unduh PDF" ditekan:
1. React memicu endpoint GET `/api/projects/{session_id}/generate-pdf`.
2. Backend [pdf_service.py](file:///home/ahmad/projects/qhomemart-mas-agent/backend/services/pdf_service.py) mendeteksi adanya data `orders` resmi untuk sesi tersebut.
3. Sistem secara otomatis menyusun layout PDF bertema **Nota Belanja Resmi B2B**, mencakup rincian jarak logistik, armada pengiriman, jadwal pengantaran, catatan akses, subtotal, dan pajak.
4. **Drawing Barcode Vektor Terintegrasi**: Di bagian bawah PDF, modul ReportLab shapes digunakan untuk menggambar representasi stand QRIS (grafik vektor) yang tajam lengkap dengan corner square markers, penanda penyelarasan, dan simulated QR bits secara mandiri tanpa membebani library eksternal, menjamin performa tinggi dan keamanan dokumen.
5. Lembar PDF disajikan kembali ke klien secara asinkron sebagai berkas unduhan instan.

### Fase 7: Verifikasi Transaksi & Sinkronisasi Obrolan Lintas-Tab (BroadcastChannel)
Ketika pengguna mengklik "Konfirmasi Sudah Bayar" pada halaman sukses QRIS:
1. Frontend mengirimkan request `POST /api/projects/orders/{order_id}/confirm-payment` ke backend.
2. **Penyuntikan Pesan Otomatis (backend/api/routes/chat_routes.py)**:
   * Backend menyisipkan pesan baru bertindak sebagai pengguna (`role=user`) yang mengonfirmasi penyelesaian pembayaran QRIS.
   * Backend menyisipkan tanggapan otomatis dari agen (`role=system`) yang menyatakan pembayaran sukses diterima dan kargo logistik diaktifkan secara resmi.
   * Kedua pesan tersebut disimpan ke database SQL dengan UUID pesan (`id=str(uuid.uuid4())`) yang di-generate secara manual untuk menghindari pelanggaran not-null constraint.
3. **Sinkronisasi Obrolan Instan (BroadcastChannel)**:
   * Frontend mengirim sinyal `payment_confirmed` melalui `BroadcastChannel('qhome_payment_channel')`.
   * Tab obrolan utama mendengarkan channel tersebut dan langsung me-refresh/memuat ulang seluruh riwayat chat secara asinkron dari API `/api/projects/sessions/{session_id}/messages` tanpa memicu pemuatan ulang halaman web secara keseluruhan (hard reload).
   * Portal B2B ditutup secara elegan setelah 1.5 detik untuk transisi visual yang mulus.
