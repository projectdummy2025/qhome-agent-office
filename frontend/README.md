# QHome-MAS Frontend Setup

Panduan ini berisi cara menyiapkan dan menjalankan antarmuka web (Vite + React) untuk proyek QHome-MAS.

## Persyaratan
- Node.js versi 18 atau lebih baru.
- `npm` (biasanya sudah terinstal bersama Node.js).

## Langkah-Langkah Setup

1. **Masuk ke Direktori Frontend**
   Buka terminal baru dan masuk ke dalam folder `frontend`:
   ```bash
   cd /home/ahmad/projects/qhomemart-mas-agent/frontend
   ```

2. **Install Dependensi**
   Jalankan perintah ini untuk menginstal seluruh dependensi NPM yang dibutuhkan, termasuk Tailwind CSS, shadcn/ui (Lucide-react, dll), dan React Router.
   ```bash
   npm install
   ```

3. **Jalankan Development Server**
   Setelah selesai instalasi, nyalakan Vite *dev server*:
   ```bash
   npm run dev
   ```

4. **Akses Aplikasi**
   Buka browser Anda dan kunjungi URL yang muncul (biasanya `http://localhost:5173`). Pastikan *server backend* (FastAPI) juga sedang berjalan di `port 8000` pada terminal terpisah agar aplikasi berfungsi dengan baik dan bisa menerima *streaming* dari agen AI.
