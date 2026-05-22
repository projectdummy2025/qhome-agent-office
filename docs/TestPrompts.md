# Panduan Skenario & Prompt Uji Coba QHome-MAS

Dokumen ini menyediakan daftar prompt uji coba yang dirancang khusus untuk memicu seluruh alur agen (*all agents/specialists*) dalam satu sesi percakapan tunggal, serta skenario revisi lanjutan untuk menguji sifat dinamis dari LangGraph.

---

## Skenario Utama: Memicu Semua Agen dalam Satu Sesi (The Ultimate Prompt)

Untuk memastikan kelima agen spesialis (**Tile Estimator, Wood Specialist, Paint Consultant, Stone Veneer Specialist,** dan **Market Analyst**) terpanggil sekaligus oleh **Chief Supervisor**, prompt harus mencakup kebutuhan ubin, panel kayu, batu alam, pengecatan, serta permintaan riset tren pasar terkini.

### 📝 Prompt Uji Coba (Salin & Tempel)

> "Saya ingin merenovasi ruang tamu utama saya menjadi gaya modern kontemporer yang elegan. Untuk itu, saya membutuhkan rekomendasi **lantai ubin (tile)** premium untuk lantai berukuran 6x6 meter. Saya juga ingin menghias salah satu sisi dinding TV dengan **panel kayu (wood)** hangat, serta menambahkan aksen pilar berbalut **batu alam (stone)** veneer agar tampak kokoh dan alami. Selain itu, tolong pilihkan kombinasi warna **cat (paint)** interior yang mewah dan estetik untuk dinding lainnya. Terakhir, tolong lakukan **riset pasar (researcher/analisis tren)** mengenai tren material dan gaya interior terpopuler di Indonesia saat ini agar ruangan saya terlihat premium dan trendi."

---

## Mengapa Prompt Ini Berhasil? (Pemetaan Agen)

Chief Supervisor akan menganalisis brief di atas dan mendeteksi kebutuhan material berikut untuk menyusun tim spesialis:

| Kata Kunci / Konteks | Agen yang Dipanggil | Tugas Spesialis |
| :--- | :--- | :--- |
| `lantai ubin (tile)` | **Tile Estimator** | Menghitung dus ubin (wastage 5% atau 10%), serta semen perekat & nat pendukung. |
| `panel kayu (wood)` | **Wood Specialist** | Menghitung kebutuhan lembaran panel kayu dan cairan pelindung UV. |
| `batu alam (stone)` | **Stone Veneer Specialist** | Menghitung volume batu alam veneer, perekat heavy-duty, dan pengisi nat batu. |
| `cat (paint)` | **Paint Consultant** | Menghitung kebutuhan pail cat utama double-coat dan cat primer alkali sealer dasar. |
| `riset pasar (researcher)` | **Market Research Analyst** | Melakukan pencarian Google (Tavily), merumuskan insight pasar mentah, dan memolesnya secara premium. |

Setelah semua agen selesai memberikan estimasi, **Inventory Administrator** akan mengecek persediaan stok gudang masing-masing material secara otomatis, merekomendasikan alternatif jika ada stok terbatas, dan **Synthesizer (Chief Supervisor)** akan menyusun proposal final lengkap dengan narasi, rincian biaya, dan disclaimer teknis.

---

## Skenario Lanjutan: Menguji Revisi Dinamis (Follow-up Prompt)

Setelah sistem menghasilkan proposal dari prompt utama di atas, Anda bisa menguji alur **Revisi Dinamis** dalam sesi chat yang sama untuk melihat bagaimana Chief Supervisor hanya memanggil agen yang relevan dengan perubahan tersebut.

### 📝 Prompt Revisi (Salin & Tempel)

> "Rencana belanjanya sudah sangat bagus! Namun, saya ingin mengubah warna **cat (paint)** interiornya menjadi nuansa hijau pastel/sage green agar terasa lebih sejuk. Selain itu, tolong tambah luas area **lantai ubin (tile)**-nya sebesar 10 meter persegi lagi untuk mencakup koridor masuk."

### 🔄 Hasil yang Diharapkan:
- Chief Supervisor mendeteksi bahwa revisi hanya memengaruhi `paint` dan `tile`.
- Hanya **Paint Consultant** dan **Tile Estimator** yang dipanggil kembali untuk melakukan kalkulasi ulang.
- Agen **Wood Specialist** dan **Stone Veneer Specialist** tidak dipanggil kembali (menggunakan data dari sesi sebelumnya secara efisien).
- **Inventory Administrator** mengecek ulang stok ubin dan cat baru.
- **Synthesizer** menyusun proposal final versi revisi dengan ringkasan belanjaan teranyar.
