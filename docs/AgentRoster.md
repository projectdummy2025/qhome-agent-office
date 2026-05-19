# QHome-MAS: Agent Roster (Daftar Karyawan Digital)

---

### 📂 Sistem Navigasi Dokumentasi (QHome-MAS)
* 🏠 **[Panduan Utama (README)](../README.md)**
* 🏛️ **[Blueprint Arsitektur (ArchitectureConcept)](ArchitectureConcept.md)**
* 👥 **[Roster Karyawan Digital (AgentRoster)](AgentRoster.md)**
* 🏗️ **[Panduan Struktur Proyek (ProjectStructure)](ProjectStructure.md)**
* 🔄 **[Alur Skenario Sistem (UserSystemFlow)](UserSystemFlow.md)**

---

Dokumen ini memuat daftar lengkap para agen (*Digital Employees*) yang akan di-hire dan dioperasikan di dalam ekosistem QHome-MAS. Masing-masing agen memiliki porsi tugas kognitif yang berbeda, dan ditenagai oleh model LLM yang disesuaikan dengan berat ringannya peran mereka.

---

## 1. Chief Project Supervisor (Manajer Utama)
* **Karakter**: Pemimpin proyek yang teliti, analitis, dan tegas dalam menjaga *Quality Control* (QC) agar sesuai dengan standar B2B Qhomemart.
* **LLM Engine**: **Gemini 3 Flash Preview** (Membutuhkan *context window* raksasa dan *reasoning* mendalam untuk mengorkestrasi agen lain).
* **Tanggung Jawab**:
  1. Membaca instruksi mentah/brief dari pelanggan.
  2. Menganalisis niat/kebutuhan pelanggan (*buyer's intent*) dan HANYA me-hire karyawan spesialis yang benar-benar relevan dengan proyek tersebut (*Dynamic Routing*).
  3. Membaca "Laporan Analisis Teknis" dari para bawahan.
  4. Melakukan QC (memaksa revisi jika hitungan agen salah, atau meng-ACC laporan).
  5. Menyusun *Grand Proposal* akhir untuk klien.
* **Akses MCP**: `hire_employee()`, `reject_report()`, `approve_report()`, `finalize_proposal()`.

---

## 2. Ceramic & Tile Estimator (Spesialis Lantai)
* **Karakter**: Insinyur lantai yang cermat. Sangat paham soal pola pemasangan (standard vs vintage) dan selalu memperhitungkan risiko ubin meletup (*popping*).
* **LLM Engine**: **Gemini 2.5 Flash (atau Gemini 3 Flash Standard)** (Untuk mendistribusikan beban token API).
* **Tanggung Jawab**:
  1. Mencari ubin lantai yang cocok dengan estetika ruangan.
  2. Menghitung kebutuhan Box ubin berdasarkan luas (m²).
  3. Menambahkan *wastage margin* (5-10% tergantung pola).
  4. Menghitung kebutuhan sak perekat & semen nat pendukung.
* **Akses MCP**: `search_vector_catalog(category="tile")`, `calculate_tile_needs()`.
* **Output Laporan**: "Laporan Rekomendasi Lantai Ubin & Kebutuhan Perekat".

---

## 3. Wood & Cladding Specialist (Spesialis Kayu & Eksterior)
* **Karakter**: Seniman kayu yang fokus pada kehangatan alami, presisi modul buatan tangan, dan ketahanan jangka panjang (anti-rayap/jamur).
* **LLM Engine**: **Qwen 3 (32B) via Groq**.
* **Tanggung Jawab**:
  1. Menyesuaikan jenis kayu (Jati Klasik vs Recycle Mixwood Modern).
  2. Menghitung jumlah panel cladding per m².
  3. Menganalisis kebutuhan kaleng *Coating UV* sebagai pelindung ekstra.
* **Akses MCP**: `search_vector_catalog(category="wood")`, `calculate_wood_needs()`.
* **Output Laporan**: "Laporan Estetika Cladding Kayu & Proteksi Coating".

---

## 4. Stone Veneer Specialist (Spesialis Batu Alam)
* **Karakter**: Ahli struktur dinding. Fokus utamanya bukan hanya pada keindahan batu alam, tetapi pada teknik pengikatan yang kuat (*double-buttering*) dan keamanan.
* **LLM Engine**: **Gemini 2.5 Flash (atau Gemini 3 Flash Standard)**.
* **Tanggung Jawab**:
  1. Menghitung kebutuhan lembaran batu (Golden Sand vs Slate Grey).
  2. Mengkalkulasi *bonding agent* beban berat (*heavy-duty*).
  3. Menyusun instruksi persiapan permukaan (wajib plester rata & *chipping*).
* **Akses MCP**: `search_vector_catalog(category="stone")`, `calculate_stone_needs()`.
* **Output Laporan**: "Laporan Kalkulasi Batu Alam & Instruksi Persiapan Dinding".

---

## 5. Color & Coating Consultant (Spesialis Qpaint Gallery)
* **Karakter**: Konsultan warna yang *up-to-date* dengan tren warna 2025. Paham betul tentang harmoni *color palette* ruangan.
* **LLM Engine**: **Qwen 3 (32B) via Groq**.
* **Tanggung Jawab**:
  1. Menyelaraskan warna cat interior dengan tekstur ubin dan kayu yang sudah dipilih bawahan lain.
  2. Menerapkan teknik *double-coat* (2 lapis) dalam perhitungannya.
  3. Menghitung kebutuhan liter/galon secara akurat.
* **Akses MCP**: `search_vector_catalog(category="paint")`, `calculate_paint_needs()`.
* **Output Laporan**: "Laporan Harmoni Warna & Volume Cat (Double-Coat)".

---

## 6. Market Research Analyst (Spesialis Riset Internet)
* **Karakter**: Peneliti yang selalu *up-to-date* dengan dunia luar. Fokus utamanya adalah memastikan rekomendasi Qhomemart tidak tertinggal zaman dengan meriset tren desain global secara *real-time*.
* **LLM Engine**: **Gemini 2.5 Flash** (Paling andal untuk mencerna teks panjang/rangkuman artikel hasil pencarian internet).
* **Tanggung Jawab**:
  1. Mencari referensi tren arsitektur dan interior terbaru di web (misal: "Tren warna cat interior 2026").
  2. Meriset teknologi material terbaru atau perbandingan harga pasar eksternal jika diperlukan oleh Supervisor.
  3. Memasok konteks *real-world* agar laporan agen lain terasa lebih kekinian.
* **Akses MCP**: `tavily_web_search(query)` (Menggunakan API Tavily.com).
* **Output Laporan**: "Laporan Tren Eksternal & Riset Pasar Terkini".

---

**Catatan Integrasi Sistem**: 
Agen-agen spesialis (Nomor 2 hingga 6) hanya akan "hidup" (di-instansiasi) jika **Chief Project Supervisor** memanggil fungsi `hire_employee()` terhadap mereka melalui Custom MCP. Jika ruangan tidak membutuhkan batu alam, agen nomor 4 tidak akan pernah diaktifkan.

---

## Mitigasi Batasan Infrastruktur (Groq Rate Limits)

Berdasarkan spesifikasi *Free Tier / Developer Plan* pada infrastruktur Groq, model `qwen/qwen3-32b` memiliki limitasi **Tokens Per Minute (TPM)** yang sangat ketat, yaitu maksimal **6.000 TPM**.

Untuk mencegah *Crash* atau *HTTP 429 Too Many Requests*, ekosistem MAS ini wajib menerapkan aturan berikut:
1. **No Pure Parallel Execution**: Supervisor tidak boleh membangkitkan 3-4 agen Groq secara bersamaan. Eksekusi (*hiring*) harus dilakukan secara bergiliran (*sequential/waterfall*) atau menggunakan *Throttling Task Queue*.
2. **Ultra-Lean Prompting**: Prompt dan *System Instruction* yang dikirimkan ke Groq harus sangat padat dan ringkas (*Token-Optimized*). *Payload* RAG dari Vector DB harus dibatasi maksimal 1-2 dokumen paling relevan untuk menjaga ukuran *context window* tetap di bawah batas aman.
3. **Graceful Degradation (Retry & Fallback)**: Modul *Custom MCP* harus dilengkapi penangkap error (Try/Catch) pada *header* HTTP 429. Jika TPM jebol, agen otomatis akan melakukan penundaan (*sleep*) selama beberapa detik atau langsung mengembalikan draf statis dari mesin *local fallback*.
