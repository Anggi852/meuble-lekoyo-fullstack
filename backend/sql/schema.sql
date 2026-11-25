-- Skema Database PostgreSQL / Neon untuk Meuble Le'Koyo (Capstone A26-CS019)
-- Otomatis dijalankan oleh backend saat DATABASE_URL dikonfigurasi.

CREATE TABLE IF NOT EXISTS products (
  id BIGINT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price INTEGER NOT NULL CHECK (price > 0),
  image TEXT NOT NULL DEFAULT '',
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  description TEXT NOT NULL DEFAULT '',
  material TEXT NOT NULL DEFAULT 'Kayu Jati Solid',
  production_time TEXT NOT NULL DEFAULT '2 bulan',
  stock_status TEXT NOT NULL DEFAULT 'Tersedia',
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS custom_portfolio (
  id BIGINT PRIMARY KEY,
  name TEXT NOT NULL,
  type_key TEXT NOT NULL DEFAULT 'lainnya',
  category TEXT NOT NULL,
  size TEXT NOT NULL DEFAULT '',
  finish TEXT NOT NULL DEFAULT 'Natural Jati (Doff)',
  city TEXT NOT NULL DEFAULT 'Kota Jambi',
  year TEXT NOT NULL DEFAULT '2026',
  description TEXT NOT NULL DEFAULT '',
  image TEXT NOT NULL DEFAULT '',
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  preset JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id BIGINT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL,
  product TEXT NOT NULL,
  product_id BIGINT,
  quantity INTEGER NOT NULL DEFAULT 1,
  payment TEXT NOT NULL,
  total BIGINT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Menunggu Konfirmasi WA',
  custom JSONB,
  made_before BOOLEAN NOT NULL DEFAULT FALSE,
  made_note TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sales (
  id BIGINT PRIMARY KEY,
  product_id BIGINT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  date TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS faqs (
  id BIGINT PRIMARY KEY,
  title TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS testimonials (
  id BIGINT PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_logs (
  id BIGINT PRIMARY KEY,
  user_label TEXT NOT NULL DEFAULT 'Pengunjung',
  message TEXT NOT NULL,
  reply TEXT NOT NULL DEFAULT '',
  intent TEXT NOT NULL DEFAULT 'lainnya',
  source TEXT NOT NULL DEFAULT 'fallback',
  time_label TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS metrics (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL
);

-- Migrasi aman jika tabel orders sudah pernah dibuat di versi sebelumnya
ALTER TABLE orders ADD COLUMN IF NOT EXISTS phone TEXT NOT NULL DEFAULT '';

-- Migrasi aman untuk rating, produk terkait, & ulasan pembeli terverifikasi
ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS rating INTEGER NOT NULL DEFAULT 5;
ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS product_id BIGINT;
ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS product_name TEXT NOT NULL DEFAULT '';
ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS order_id BIGINT;
ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS user_email TEXT NOT NULL DEFAULT '';
ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'owner';
ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS show_on_home BOOLEAN NOT NULL DEFAULT TRUE;