# QHome-MAS Frontend Setup & Deployment

Berkas ini berisi panduan untuk menyiapkan, menjalankan, dan mendeploy antarmuka web (React + Vite + TypeScript) untuk proyek QHome-MAS, baik secara lokal maupun menggunakan kontainerisasi Docker.

---

## 1. Sistem Resolusi API Dinamis

Untuk memastikan fleksibilitas tinggi tanpa perlu mengompilasi ulang kode untuk setiap perubahan IP/domain, sistem menggunakan resolusi API dinamis pada **`frontend/src/config.ts`**:
*   **Mode Dev Lokal**: Otomatis mendeteksi `import.meta.env.DEV` dan mengarahkan API calls ke `http://localhost:8000`.
*   **Mode Production / Docker**: Otomatis menggunakan `window.location.origin` sebagai *API base URL* (seluruh lalu lintas API dirutekan relatif ke domain saat ini, kemudian ditangkap oleh Reverse Proxy Nginx).
*   **Kustom**: Mendukung override menggunakan variabel lingkungan `VITE_API_URL`.

---

## 2. Pilihan A: Setup Lokal (Host Development)

### Persyaratan Lokal
*   Node.js versi 18 atau lebih baru (direkomendasikan Node.js v20+).
*   `npm` (biasanya sudah terinstal bersama Node.js).

### Langkah-Langkah Setup
1.  **Masuk ke Direktori Frontend & Instal Dependensi**:
    ```bash
    cd frontend
    npm install
    ```
2.  **Jalankan Vite Development Server**:
    ```bash
    npm run dev
    ```
3.  **Akses Aplikasi**:
    Buka browser Anda dan kunjungi `http://localhost:5173`. Pastikan server backend FastAPI juga aktif di `port 8000` pada terminal terpisah.

---

## 3. Pilihan B: Setup Docker (Production-Ready)

Frontend telah dilengkapi konfigurasi penyajian statis (*static serving*) yang sangat ringan dan siap deploy.

### Berkas Konfigurasi Utama
*   **`frontend/Dockerfile`**: Menggunakan teknik *Multi-Stage Build*:
    1.  *Stage 1 (Builder)*: Menggunakan `node:20-alpine` untuk menginstal dependencies (`npm ci`) dan melakukan kompilasi produksi (`npm run build`).
    2.  *Stage 2 (Runner)*: Menggunakan `nginx:1.25-alpine` super ringan untuk menyajikan berkas HTML/JS/CSS statis pada port `80` (di-expose ke port `3000` pada host).
*   **`frontend/nginx.conf`**: Konfigurasi server Nginx khusus yang menangani:
    1.  *SPA Routing Fallback*: Mengarahkan semua rute tidak dikenal ke `index.html` (dukungan React Router).
    2.  *Reverse Proxy `/api`*: Mengalihkan panggilan API internal secara otomatis ke layanan `http://backend:8000/api`.
    3.  *SSE Stream Bypass*: Khusus rute Server-Sent Events `/stream`, buffering dinonaktifkan (`proxy_buffering off;`) untuk menjamin live streaming log agen berjalan tanpa terputus.
*   **`frontend/.dockerignore`**: Memblokir folder `node_modules` lokal, folder build statis `dist` lokal, dan log agar proses *build context* berjalan instan.

