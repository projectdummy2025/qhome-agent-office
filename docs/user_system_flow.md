# QHome-MAS: User & System Flow Scenario

Dokumen ini memetakan skenario interaksi end-to-end (dari awal hingga akhir) antara Pelanggan (User) dan Ekosistem Multi-Agent Qhomemart.

---

## 1. Skenario Uji Coba (The Brief)
**Profil User**: Bapak Budi, ingin merenovasi ruang tamunya agar terlihat mewah namun ramah anak.
**Input Teks (Brief)**: *"Halo, saya ingin merenovasi ruang tamu ukuran 5x4 meter. Saya ingin lantainya pakai granit marmer putih biar mewah. Dinding area TV mau dipasang panel kayu bergaris biar elegan. Sisa dindingnya tolong dicat warna terang yang gampang dibersihkan kalau dicoret anak saya."*

---

## 2. User Flow (Kacamata Pelanggan)

1. **Input**: User membuka *Web Dashboard* Qhomemart (React). User mengetik brief di atas pada kolom chat/teks yang tersedia.
2. **Submit**: User menekan tombol **"Konsultasi Sekarang"**.
3. **Live Canvas (Observasi)**:
   * Di layar, User melihat animasi *Dashboard Digital Office*.
   * Avatar **Chief Supervisor** menyala hijau bertuliskan: *"Menganalisis kebutuhan proyek Bapak Budi..."*
   * Tiba-tiba, 3 avatar karyawan menyala secara bergiliran: **Tile Estimator**, **Wood Specialist**, dan **Paint Consultant**. (Avatar *Stone Specialist* tetap abu-abu/mati karena Budi tidak meminta batu alam).
   * Di panel samping (*Terminal Stream*), User bisa membaca proses pemikiran mereka secara *real-time* (Misal: *"Tile Estimator sedang mencari granit marmer putih di katalog..."*).
4. **Finalisasi**: Setelah sekitar 5-8 detik, layar berganti menampilkan **Grand Proposal Renovasi**.
   * Menampilkan gambar produk (Granit White Carara, WPC Fluted Panel, Dulux Easy Clean).
   * Menampilkan rincian kuantitas pasti (Jumlah Dus, Jumlah Lembar, Jumlah Galon) beserta harga total.
   * Tombol CTA: *"Download PDF"* atau *"Beli Material via Qhomemart"*.

---

## 3. System Flow (Di Balik Layar / Under the Hood)

Bagaimana FastAPI, LangGraph, Groq, dan Gemini bekerja mengorkestrasi skenario di atas:

### Fase 1: Ingestion & Routing (Supervisor)
1. **API Call**: React mengirim `POST /api/analyze` berisi brief Budi ke FastAPI.
2. **Supervisor LLM (Gemini 3 Flash)** membaca teks.
   * *Intent Extraction*: Area = 20 m² (5x4). Material = Granit Marmer, Panel Kayu Bergaris, Cat mudah dibersihkan.
   * *Dynamic Routing*: Memutuskan untuk men-*hire* (menjalankan *edge* LangGraph menuju) 3 agen: Tile, Wood, Paint.
3. FastAPI memancarkan sinyal **SSE (Server-Sent Events)** ke React: `{"event": "routing", "hired": ["tile", "wood", "paint"]}`.

### Fase 2: Eksekusi Spesialis (Secara Waterfall/Sekuensial)
*(Karena limitasi 6K TPM Groq, Supervisor mendelegasikan tugas satu per satu)*

**A. Giliran Tile Estimator (Gemini 2.5 Flash)**
* **RAG Search**: Memanggil MCP `search_vector_catalog("granit marmer putih")`. ChromaDB membalas dengan `TLE-001 (White Carara)`.
* **Kalkulasi**: Memanggil MCP `calculate_tile_needs(area=20, sku="TLE-001")`. 
  * *Sistem Backend (rules.py)* menghitung: Butuh 15 Dus Granit + Margin wastage 5% + 4 Sak Semen MU-480 + 3 Kg Nat AM Putih.
* **Laporan**: Menulis narasi argumen estetika dan menyerahkan *JSON payload* biaya ke memori LangGraph.

**B. Giliran Wood Specialist (Qwen 32B via Groq)**
* **RAG Search**: Memanggil MCP `search_vector_catalog("panel kayu bergaris fluted")`. ChromaDB membalas dengan `WPC-001 (Fluted Teak Wood)`.
* **Kalkulasi**: Memanggil MCP `calculate_wood_needs(area=5, sku="WPC-001")` (Asumsi dinding TV = 5m²).
  * *Sistem Backend* menghitung: Butuh 12 Lembar WPC + 2 Tube Sealant Dextone.
* **Laporan**: Menyerahkan draf narasi via Groq dengan kecepatan kilat ke memori LangGraph.

**C. Giliran Paint Consultant (Qwen 32B via Groq)**
* **RAG Search**: Memanggil MCP `search_vector_catalog("cat terang mudah dibersihkan ramah anak")`. ChromaDB merekomendasikan `PNT-003 (Dulux Easy Clean)`.
* **Kalkulasi**: Memanggil MCP `calculate_paint_needs(area=45, sku="PNT-003")` (Asumsi sisa dinding).
  * *Sistem Backend* menghitung: Butuh 1 Pail (25kg) dengan asumsi 2 lapis (*double coat*).
* **Laporan**: Diserahkan ke memori LangGraph.

### Fase 3: Quality Control & Sintesis
1. **Supervisor (Gemini 3 Flash)** hidup kembali.
2. Membaca ketiga laporan yang ada di *State Graph*.
3. **Pengecekan Logika**: Supervisor memastikan bahwa *Tile Estimator* tidak lupa memasukkan semen, dan *Paint Consultant* sudah memperhitungkan 2 lapis pengecatan.
4. **Sintesis JSON**: Supervisor menggabungkan ketiga laporan menjadi satu *Grand JSON Object* yang sangat terstruktur.

### Fase 4: Response & Rendering
1. FastAPI menerima hasil akhir graf LangGraph.
2. FastAPI mengembalikan HTTP *Response* berupa JSON lengkap ke Frontend (React).
3. React mem- *parsing* JSON tersebut dan menggambar komponen kartu produk (beserta harga dan kuantitas mutlak) ke layar pelanggan.
4. Sesi selesai. Seluruh interaksi (Audit Log) disimpan ke dalam **SQLite** (`agent_communications` table) untuk *history tracking*.
