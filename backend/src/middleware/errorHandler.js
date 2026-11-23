export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    code: 'NOT_FOUND',
    message: `Endpoint ${req.method} ${req.originalUrl} tidak ditemukan.`,
  });
}

export function errorHandler(err, req, res, _next) {
  const status = err.status || err.statusCode || 500;
  console.error(`[ERROR] ${req.method} ${req.originalUrl}:`, err.message);
  res.status(status).json({
    success: false,
    code: err.code || 'INTERNAL_SERVER_ERROR',
    message:
      status >= 500
        ? 'Terjadi kendala pada server Meuble Le\'Koyo. Silakan coba beberapa saat lagi.'
        : err.message,
  });
}
