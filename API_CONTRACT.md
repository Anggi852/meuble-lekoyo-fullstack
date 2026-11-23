# Kontrak API Lintas Tim — Meuble Le'Koyo (Capstone A26-CS019)

Dokumen ini menjadi kesepakatan format request/response antara tim **Full-Stack**, **Gen AI**, dan **Data Science**.

## 1. Base URL & Dokumentasi Interaktif
- **Lokal:** `http://localhost:4000/api/v1`
- **Swagger / OpenAPI:** `http://localhost:4000/api-docs`
- **Format umum sukses:** `{ "success": true, "data": ... }`
- **Format umum error:** `{ "success": false, "code": "ERROR_CODE", "message": "Pesan jelas bahasa Indonesia", "details": [...] }`

## 2. Kontrak Full-Stack ↔ Tim Gen AI (FastAPI / Flask)
Frontend **tidak pernah** memanggil layanan Gen AI secara langsung. Alur resmi:
`Frontend (Axios) → POST /api/v1/chats (Express) → POST ${GENAI_API_URL}/chat (FastAPI/Flask) → Simpan riwayat ke Database`

### Request dari Backend Express ke FastAPI Gen AI (`POST /chat`)
```json
{
  "message": "Cari meja makan jati di bawah 5 juta dan bisa sistem tabung?",
  "session_id": "web-guest",
  "active_product": {
    "id": 1,
    "name": "Meja Makan Jati Minimalis",
    "category": "Meja",
    "price": 4500000
  }
}
```

### Response yang diharapkan dari FastAPI Gen AI (`200 OK`)
```json
{
  "reply": "Di Meuble Le'Koyo tersedia Meja Makan Jati Minimalis seharga Rp 4.500.000 dan bisa dibayar dengan Sistem Tabung...",
  "intent": "rekomendasi",
  "product_ids": [1, 6],
  "quick_replies": ["Cara sistem tabung", "Pesan sekarang"],
  "wa": false
}
```
Nilai `intent` yang didukung: `info_produk`, `rekomendasi`, `sistem_tabung`, `custom_order`, `estimasi_waktu`, `pengiriman`, `garansi`, `pemesanan`, `keluhan`, `out_of_scope`, `lainnya`.

### Penanganan Error Gen AI di Backend
- **Timeout (`> 12 detik`)**, **Kuota Habis (`429`)**, atau **Server Offline (`5xx`)**: Backend otomatis mengalihkan ke mesin cadangan toko, menyertakan field `warning` yang jelas kepada pengguna, dan tetap mencatat log di database (`source: "backend-engine"`).

## 3. Kontrak Full-Stack ↔ Tim Data Science (Streamlit / API)
1. **Embed Dasbor Streamlit:** Set `VITE_STREAMLIT_URL` di `frontend/.env` (atau `STREAMLIT_DASHBOARD_URL` di `backend/.env`). Dasbor otomatis tampil di halaman `/admin/analytics` beserta fallback jika layanan free-tier sedang tertidur.
2. **Endpoint Data Mentah untuk Analitik DS (jika dibutuhkan):**
   - `GET /api/v1/products` (daftar katalog)
   - `GET /api/v1/custom-portfolio` (daftar karya pernah dicustom)
   - `GET /api/v1/orders` (Bearer token — pesanan, kota tujuan, metode bayar Tunai/Tabung)
   - `GET /api/v1/chats` (Bearer token — riwayat pertanyaan & intent Koyo)
   - `GET /api/v1/analytics/summary` (Bearer token — agregasi KPI & status DS)

## 4. Pengaman Endpoint Pemesanan (`POST /api/v1/orders`)
- **Validasi Joi Wajib:** `name`, `phone` (format HP Indonesia `^(?:\+?62|0)8[1-9][0-9\s-]{7,15}$`), `address`, `product`, `quantity`, `payment`, dan `agreedToTerms: true`.
- **Status Awal:** `Menunggu Konfirmasi WA` (tidak masuk hitungan omzet sebelum status diubah owner menjadi `Selesai`).
- **Rate Limit Anti-Spam:** Maksimal 3 pengajuan per 15 menit per IP; jika melebihi, mengembalikan HTTP `429` (`ORDER_RATE_LIMITED`) dengan header `Retry-After`.
