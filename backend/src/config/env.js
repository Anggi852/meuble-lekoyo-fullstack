import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: Number(process.env.PORT) || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigins: (process.env.CORS_ORIGIN || 'http://localhost:5173,http://127.0.0.1:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  adminPassword: process.env.ADMIN_PASSWORD || 'lekoyo2026',
  authSecret: process.env.AUTH_SECRET || 'meuble-lekoyo-jambi-secret-key-2026',
  databaseUrl: (process.env.DATABASE_URL || '').trim(),
  genaiApiUrl: (process.env.GENAI_API_URL || '').trim().replace(/\/$/, ''),
  genaiApiKey: (process.env.GENAI_API_KEY || '').trim(),
  genaiTimeoutMs: Number(process.env.GENAI_TIMEOUT_MS) || 12000,
  streamlitDashboardUrl: (process.env.STREAMLIT_DASHBOARD_URL || '').trim(),
  dsApiUrl: (process.env.DS_API_URL || '').trim().replace(/\/$/, ''),
};

export const STORE = {
  name: "Meuble Le'Koyo",
  owner: 'Pak Nanang Suryadi',
  phoneRaw: '6281366181400',
  phoneDisplay: '+62 813-661-81400',
  address: '9HQW+WP9, Jl. Sumantri Brojonegoro, Selamat, Kec. Telanaipura, Kota Jambi, Jambi 36124',
  mapsUrl: 'https://maps.app.goo.gl/Vkt8ACs14CzB4i8i6',
  hoursWeekday: 'Senin – Sabtu: 08.00 – 17.00 WIB',
  hoursSunday: 'Minggu: Tutup',
};
