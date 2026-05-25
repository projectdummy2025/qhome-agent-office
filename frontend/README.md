# QHome-MAS Frontend Setup & Deployment

Berkas ini berisi panduan untuk menyiapkan, menjalankan, dan mendeploy antarmuka web (React + Vite + TypeScript) untuk proyek QHome-MAS, baik secara lokal maupun menggunakan kontainerisasi Docker.

---

## 1. Sistem Resolusi API Dinamis

Untuk memastikan fleksibilitas tinggi tanpa perlu mengompilasi ulang kode untuk setiap perubahan IP/domain, sistem menggunakan resolusi API dinamis pada **`frontend/src/config.ts`**:
*   **Mode Dev Lokal**: Otomatis mendeteksi `import.meta.env.DEV` dan mengarahkan API calls ke `http://localhost:8000`.
*   **Mode Production / Docker**: Otomatis menggunakan `window.location.origin` sebagai *API base URL* (seluruh lalu lintas API dirutekan relatif ke domain saat ini, kemudian ditangkap oleh Reverse Proxy Nginx).
*   **Kustom**: Mendukung override menggunakan variabel lingkungan `VITE_API_URL`.

---

## 2. Pilihan A — Lokal (Development)

**Prasyarat**: Node.js 18+ (rekomendasi v20+), backend FastAPI aktif di port `8000`.

```bash
cd frontend
npm install
npm run dev
```
Akses: `http://localhost:5173`

---

## 3. Pilihan B — Deployment (Docker)

Dijalankan otomatis sebagai bagian dari `docker compose up --build -d` di root proyek. Akses: `http://localhost:3000`.

### Berkas Konfigurasi Utama
*   **`frontend/Dockerfile`** — *Multi-Stage Build*:
    1.  *Builder* (`node:20-alpine`): `npm ci` + `npm run build`.
    2.  *Runner* (`nginx:1.25-alpine`): menyajikan statis di port `80` (mapped ke host `3000`).
*   **`frontend/nginx.conf`** — menangani:
    *   *SPA Routing Fallback*: rute tidak dikenal → `index.html`.
    *   *Reverse Proxy `/api`* → `http://backend:8000/api`.
    *   *SSE Bypass*: `proxy_buffering off;` untuk streaming log agen.
*   **`frontend/.dockerignore`**: memblokir `node_modules`, `dist` lokal, dan log.

