# Meuble Le'Koyo — Full-Stack Web App (v18 — Full-Stack + Pengaman Anti-Pesanan Iseng)

Solusi digital **Full-Stack (Decoupled Front-End + Back-End)** untuk UMKM **Meuble Le'Koyo** (Jambi), milik **Pak Nanang Suryadi** (Capstone Project A26-CS019).

- **Alamat Showroom:** 9HQW+WP9, Jl. Sumantri Brojonegoro, Selamat, Kec. Telanaipura, Kota Jambi, Jambi 36124
- **Google Maps:** https://maps.app.goo.gl/Vkt8ACs14CzB4i8i6
- **WhatsApp / HP Resmi:** +62 813-661-81400

---

## Struktur Proyek (Decoupled)
```text
meuble-lekoyo-fullstack/
├── frontend/          # React + Vite + Tailwind CSS + Axios + Framer Motion
├── backend/           # Node.js + Express (/api/v1/*) + Joi + Swagger (/api-docs) + PostgreSQL/Neon
├── API_CONTRACT.md    # Kontrak API lintas tim (FS, Gen AI, Data Science)
├── render.yaml        # Blueprint deploy Backend ke Render (Free Tier)
└── README.md
```

---

## Cara Menjalankan Secara Lokal

Buka **2 terminal** terpisah (satu untuk Backend, satu untuk Frontend):

### 1. Jalankan Backend (Express + Swagger)
```powershell
cd backend
Copy-Item .env.example .env
npm install
npm run dev
```
- API aktif di: `http://localhost:4000/api/v1`
- Swagger interaktif di: `http://localhost:4000/api-docs`
- **Database Persisten:** Tanpa konfigurasi tambahan, backend langsung menyimpan data secara persisten ke `backend/data/database.json`. Untuk produksi dengan **Neon PostgreSQL**, cukup isi `DATABASE_URL` di `backend/.env` — seluruh tabel dari `backend/sql/schema.sql` akan dibuat dan di-seed otomatis.

### 2. Jalankan Frontend (React + Vite + Axios)
```powershell
cd frontend
Copy-Item .env.example .env
npm install
npm run dev
```
- Aplikasi web aktif di: `http://localhost:5173`
- Portal Owner: `http://localhost:5173/admin/login` (password default: `lekoyo2026`)

---

## Panduan Deploy Gratis (Free Tier)

1. **Database (Neon PostgreSQL):**
   - Buat project gratis di [neon.tech](https://neon.tech) lalu salin Connection String (`postgresql://...`).
2. **Backend (Render):**
   - Hubungkan repo GitHub ke [render.com](https://render.com) menggunakan `render.yaml` (Root Directory: `backend`).
   - Isi environment variables: `DATABASE_URL` (dari Neon), `CORS_ORIGIN` (URL Netlify/Vercel), `GENAI_API_URL` (URL FastAPI tim Gen AI), dan `STREAMLIT_DASHBOARD_URL` (URL Streamlit tim DS).
3. **Frontend (Netlify / Vercel / Cloudflare Pages):**
   - Root Directory: `frontend`, Build Command: `npm run build`, Publish Directory: `dist`.
   - Tambahkan environment variable:
     - `VITE_API_BASE_URL=https://<nama-app-render>.onrender.com/api/v1`
     - `VITE_STREAMLIT_URL=https://<app-streamlit>.streamlit.app`
   - Routing SPA sudah disiapkan lewat `frontend/public/_redirects` (Netlify) dan `frontend/vercel.json` (Vercel).

---

## Cakupan Tech Stack Full-Stack
- **Decoupled Architecture:** `frontend/` & `backend/` terpisah, terhubung lewat **Axios** (`frontend/src/services/api.js`).
- **REST API v1 + Express:** `/api/v1/products`, `/api/v1/custom-portfolio`, `/api/v1/orders`, `/api/v1/sales`, `/api/v1/faqs`, `/api/v1/testimonials`, `/api/v1/chats`, `/api/v1/analytics/summary`, `/api/v1/auth/login`.
- **Schema Validation:** **Joi** di Backend (`backend/src/validators/schemas.js`) + **Yup** di Frontend.
- **Integrasi Gen AI via Backend:** `POST /api/v1/chats` mengakses FastAPI/Flask tim Gen AI dari server Backend, menangani timeout/kuota (429)/offline dengan fallback jelas, serta menyimpan riwayat chat ke database.
- **Integrasi Data Science:** Halaman `/admin/analytics` menampilkan ringkasan KPI live dari `/api/v1/analytics/summary` serta embed dasbor **Streamlit**.
- **Swagger / OpenAPI:** Dokumentasi API interaktif dapat langsung dicoba di `/api-docs`.

---

## Pengaman Anti-Pesanan Iseng (v18)
- **Wajib Nomor WhatsApp Aktif:** Validasi format HP Indonesia (`08...` / `+628...`) di Frontend (Yup & Chat Koyo) serta Backend (Joi), lengkap tombol **Hubungi Pemesan via WA** di Dashboard Owner.
- **Status Awal `Menunggu Konfirmasi WA`:** Pengajuan dari website tidak langsung dihitung ke omzet/penjualan sebelum owner mengubah status ke `Diproses` / `Selesai` setelah deal di WhatsApp.
- **Checkbox Komitmen & Anti Double-Click:** Pemesan wajib menyetujui ketentuan konfirmasi WA & DP, serta tombol otomatis terkunci saat proses kirim berlangsung.
- **Anti-Spam Rate Limiter (`429 Too Many Requests`):** Backend membatasi maksimal **3 pengajuan pesanan per 15 menit** per perangkat/IP (`backend/src/middleware/rateLimit.js`).
