/**
 * Middleware pembatas permintaan (Rate Limiter) ringan tanpa dependensi tambahan.
 * Mencegah spam pesanan palsu & percobaan login berulang dari perangkat/IP yang sama.
 */
export function createRateLimiter({
  windowMs = 15 * 60 * 1000,
  max = 3,
  code = 'RATE_LIMITED',
  message = 'Terlalu banyak percobaan. Mohon tunggu beberapa menit sebelum mencoba lagi.',
} = {}) {
  const hits = new Map();

  // Bersihkan entri kadaluarsa setiap 10 menit agar memori tetap hemat
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [key, timestamps] of hits.entries()) {
      const active = timestamps.filter((t) => now - t < windowMs);
      if (active.length === 0) hits.delete(key);
      else hits.set(key, active);
    }
  }, 10 * 60 * 1000);
  if (typeof timer.unref === 'function') timer.unref();

  return (req, res, next) => {
    const now = Date.now();
    const ip =
      req.ip ||
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      'unknown';

    const recent = (hits.get(ip) || []).filter((t) => now - t < windowMs);

    if (recent.length >= max) {
      const oldest = recent[0];
      const retryAfterSec = Math.max(1, Math.ceil((windowMs - (now - oldest)) / 1000));
      const retryAfterMin = Math.max(1, Math.ceil(retryAfterSec / 60));
      res.set('Retry-After', String(retryAfterSec));
      return res.status(429).json({
        success: false,
        code,
        retryAfterSec,
        message: `${message} (coba lagi dalam ±${retryAfterMin} menit).`,
      });
    }

    recent.push(now);
    hits.set(ip, recent);
    return next();
  };
}

export const orderRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 3, // maksimal 3 pengajuan pesanan per 15 menit per perangkat/IP
  code: 'ORDER_RATE_LIMITED',
  message:
    'Batas pengiriman pesanan sementara tercapai untuk mencegah spam. Jika perlu memesan lebih banyak, silakan langsung hubungi Pak Nanang lewat WhatsApp',
});

export const loginRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  code: 'LOGIN_RATE_LIMITED',
  message: 'Terlalu banyak percobaan login. Mohon tunggu sebentar',
});
