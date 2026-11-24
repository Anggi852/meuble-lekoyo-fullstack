import { Router } from 'express';
import { env, STORE } from '../config/env.js';
import { db } from '../db/index.js';
import { requireAdmin, signAdminToken } from '../middleware/auth.js';
import { orderRateLimiter, loginRateLimiter } from '../middleware/rateLimit.js';
import {
  validate,
  loginSchema,
  productSchema,
  productStockSchema,
  customPortfolioSchema,
  orderCreateSchema,
  orderUpdateSchema,
  saleCreateSchema,
  faqSchema,
  testimonialSchema,
  chatRequestSchema,
  viewMetricSchema,
} from '../validators/schemas.js';
import { processKoyoChat } from '../services/genaiService.js';
import { buildAnalyticsSummary } from '../services/analyticsService.js';

const router = Router();

// Helper wrapper agar error async langsung diteruskan ke errorHandler
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

/* -------------------- HEALTH & BOOTSTRAP -------------------- */
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    service: "Meuble Le'Koyo API v1",
    status: 'ok',
    databaseMode: db.mode,
    genaiConfigured: Boolean(env.genaiApiUrl),
    streamlitConfigured: Boolean(env.streamlitDashboardUrl),
    timestamp: new Date().toISOString(),
  });
});

router.get('/store', (_req, res) => {
  res.json({ success: true, data: STORE });
});

// Mengambil seluruh data publik dalam 1 request awal untuk mempercepat muat Front-End
router.get(
  '/bootstrap',
  asyncHandler(async (_req, res) => {
    const [products, customPortfolio, faqs, testimonials, metrics] = await Promise.all([
      db.getProducts(),
      db.getCustomPortfolio(),
      db.getFaqs(),
      db.getTestimonials(),
      db.getMetrics(),
    ]);
    res.json({
      success: true,
      data: { products, customPortfolio, faqs, testimonials, metrics, store: STORE },
    });
  }),
);

/* -------------------- AUTH (OWNER) -------------------- */
router.post(
  '/auth/login',
  loginRateLimiter,
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    if (req.body.password !== env.adminPassword) {
      return res.status(401).json({
        success: false,
        code: 'INVALID_CREDENTIALS',
        message: 'Password owner salah. Silakan coba lagi.',
      });
    }
    const token = signAdminToken({ role: 'owner', name: STORE.owner });
    return res.json({
      success: true,
      message: 'Login berhasil.',
      data: { token, owner: STORE.owner },
    });
  }),
);

router.get('/auth/me', requireAdmin, (req, res) => {
  res.json({ success: true, data: req.admin });
});

/* -------------------- PRODUCTS -------------------- */
router.get(
  '/products',
  asyncHandler(async (req, res) => {
    let list = await db.getProducts();
    const { category, q } = req.query;
    if (category && category !== 'Semua') {
      list = list.filter((p) => p.category.toLowerCase() === String(category).toLowerCase());
    }
    if (q) {
      const needle = String(q).toLowerCase();
      list = list.filter(
        (p) => p.name.toLowerCase().includes(needle) || p.description.toLowerCase().includes(needle),
      );
    }
    res.json({ success: true, data: list });
  }),
);

router.get(
  '/products/:id',
  asyncHandler(async (req, res) => {
    const item = await db.getProductById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Produk tidak ditemukan.' });
    return res.json({ success: true, data: item });
  }),
);

router.post(
  '/products',
  requireAdmin,
  validate(productSchema),
  asyncHandler(async (req, res) => {
    const created = await db.createProduct(req.body);
    res.status(201).json({ success: true, message: 'Produk berhasil ditambahkan.', data: created });
  }),
);

router.put(
  '/products/:id',
  requireAdmin,
  validate(productSchema),
  asyncHandler(async (req, res) => {
    const updated = await db.updateProduct(req.params.id, req.body);
    if (!updated) return res.status(404).json({ success: false, message: 'Produk tidak ditemukan.' });
    return res.json({ success: true, message: 'Produk berhasil diperbarui.', data: updated });
  }),
);

router.patch(
  '/products/:id/stock',
  requireAdmin,
  validate(productStockSchema),
  asyncHandler(async (req, res) => {
    const updated = await db.updateProduct(req.params.id, { stockStatus: req.body.stockStatus });
    if (!updated) return res.status(404).json({ success: false, message: 'Produk tidak ditemukan.' });
    return res.json({ success: true, message: 'Status stok diperbarui.', data: updated });
  }),
);

router.delete(
  '/products/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const ok = await db.deleteProduct(req.params.id);
    if (!ok) return res.status(404).json({ success: false, message: 'Produk tidak ditemukan.' });
    return res.json({ success: true, message: 'Produk berhasil dihapus.' });
  }),
);

/* -------------------- CUSTOM PORTFOLIO (PERNAH DICUSTOM) -------------------- */
router.get(
  '/custom-portfolio',
  asyncHandler(async (req, res) => {
    let list = await db.getCustomPortfolio();
    if (req.query.category && req.query.category !== 'Semua') {
      list = list.filter((c) => c.category.toLowerCase() === String(req.query.category).toLowerCase());
    }
    res.json({ success: true, data: list });
  }),
);

router.post(
  '/custom-portfolio',
  requireAdmin,
  validate(customPortfolioSchema),
  asyncHandler(async (req, res) => {
    const created = await db.createCustomPortfolio(req.body);
    res.status(201).json({ success: true, message: 'Karya custom berhasil ditambahkan.', data: created });
  }),
);

router.put(
  '/custom-portfolio/:id',
  requireAdmin,
  validate(customPortfolioSchema),
  asyncHandler(async (req, res) => {
    const updated = await db.updateCustomPortfolio(req.params.id, req.body);
    if (!updated) return res.status(404).json({ success: false, message: 'Karya custom tidak ditemukan.' });
    return res.json({ success: true, message: 'Karya custom diperbarui.', data: updated });
  }),
);

router.delete(
  '/custom-portfolio/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const ok = await db.deleteCustomPortfolio(req.params.id);
    if (!ok) return res.status(404).json({ success: false, message: 'Karya custom tidak ditemukan.' });
    return res.json({ success: true, message: 'Karya custom dihapus.' });
  }),
);

/* -------------------- ORDERS -------------------- */
router.get(
  '/orders',
  requireAdmin,
  asyncHandler(async (_req, res) => {
    const list = await db.getOrders();
    res.json({ success: true, data: list });
  }),
);

router.post(
  '/orders',
  orderRateLimiter,
  validate(orderCreateSchema),
  asyncHandler(async (req, res) => {
    const cleanPhone = String(req.body.phone || '').replace(/[\s-]+/g, '');
    const estimatedPrice = Number(req.body.estimatedPrice ?? req.body.total) || 0;
    const created = await db.createOrder({
      ...req.body,
      phone: cleanPhone,
      estimatedPrice,
    });
    res.status(201).json({
      success: true,
      message: `Pengajuan pesanan (${created.orderCode}) tercatat. Menunggu penetapan harga dari owner.`,
      data: created,
    });
  }),
);

router.patch(
  '/orders/:id',
  requireAdmin,
  validate(orderUpdateSchema),
  asyncHandler(async (req, res) => {
    const patch = { ...req.body };
    // Jika owner mengisi harga final tanpa memilih status manual, otomatis ubah ke 'Harga Ditetapkan'
    if (patch.finalPrice !== undefined && patch.finalPrice !== null && !patch.status) {
      patch.status = 'Harga Ditetapkan';
    }
    const updated = await db.updateOrder(req.params.id, patch);
    if (!updated) return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan.' });
    return res.json({ success: true, message: 'Pesanan diperbarui.', data: updated });
  }),
);

router.delete(
  '/orders/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const ok = await db.deleteOrder(req.params.id);
    if (!ok) return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan.' });
    return res.json({ success: true, message: 'Pesanan dihapus.' });
  }),
);

/* -------------------- SALES -------------------- */
router.get(
  '/sales',
  requireAdmin,
  asyncHandler(async (_req, res) => {
    const list = await db.getSales();
    res.json({ success: true, data: list });
  }),
);

router.post(
  '/sales',
  requireAdmin,
  validate(saleCreateSchema),
  asyncHandler(async (req, res) => {
    const created = await db.createSale(req.body);
    res.status(201).json({ success: true, message: 'Penjualan berhasil dicatat.', data: created });
  }),
);

router.delete(
  '/sales/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const ok = await db.deleteSale(req.params.id);
    if (!ok) return res.status(404).json({ success: false, message: 'Catatan penjualan tidak ditemukan.' });
    return res.json({ success: true, message: 'Catatan penjualan dihapus.' });
  }),
);

/* -------------------- FAQS -------------------- */
router.get(
  '/faqs',
  asyncHandler(async (_req, res) => {
    res.json({ success: true, data: await db.getFaqs() });
  }),
);

router.post(
  '/faqs',
  requireAdmin,
  validate(faqSchema),
  asyncHandler(async (req, res) => {
    const created = await db.createFaq(req.body);
    res.status(201).json({ success: true, message: 'FAQ ditambahkan.', data: created });
  }),
);

router.put(
  '/faqs/:id',
  requireAdmin,
  validate(faqSchema),
  asyncHandler(async (req, res) => {
    const updated = await db.updateFaq(req.params.id, req.body);
    if (!updated) return res.status(404).json({ success: false, message: 'FAQ tidak ditemukan.' });
    return res.json({ success: true, message: 'FAQ diperbarui.', data: updated });
  }),
);

router.delete(
  '/faqs/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const ok = await db.deleteFaq(req.params.id);
    if (!ok) return res.status(404).json({ success: false, message: 'FAQ tidak ditemukan.' });
    return res.json({ success: true, message: 'FAQ dihapus.' });
  }),
);

/* -------------------- TESTIMONIALS -------------------- */
router.get(
  '/testimonials',
  asyncHandler(async (_req, res) => {
    res.json({ success: true, data: await db.getTestimonials() });
  }),
);

router.post(
  '/testimonials',
  requireAdmin,
  validate(testimonialSchema),
  asyncHandler(async (req, res) => {
    const created = await db.createTestimonial(req.body);
    res.status(201).json({ success: true, message: 'Testimoni ditambahkan.', data: created });
  }),
);

router.put(
  '/testimonials/:id',
  requireAdmin,
  validate(testimonialSchema),
  asyncHandler(async (req, res) => {
    const updated = await db.updateTestimonial(req.params.id, req.body);
    if (!updated) return res.status(404).json({ success: false, message: 'Testimoni tidak ditemukan.' });
    return res.json({ success: true, message: 'Testimoni diperbarui.', data: updated });
  }),
);

router.delete(
  '/testimonials/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const ok = await db.deleteTestimonial(req.params.id);
    if (!ok) return res.status(404).json({ success: false, message: 'Testimoni tidak ditemukan.' });
    return res.json({ success: true, message: 'Testimoni dihapus.' });
  }),
);

/* -------------------- GEN AI CHAT PROXY & LOGS -------------------- */
router.get(
  '/chats',
  requireAdmin,
  asyncHandler(async (_req, res) => {
    res.json({ success: true, data: await db.getChatLogs() });
  }),
);

router.post(
  '/chats',
  validate(chatRequestSchema),
  asyncHandler(async (req, res) => {
    const { message, activeProductId, sessionId, logOnly, intent } = req.body;
    if (logOnly) {
      const saved = await db.createChatLog({
        user: 'Pengunjung',
        message,
        intent: intent || 'pemesanan',
        source: 'order-flow',
      });
      return res.status(201).json({ success: true, data: { log: saved } });
    }
    const result = await processKoyoChat({ message, activeProductId, sessionId });
    return res.status(201).json({ success: true, data: result });
  }),
);

router.delete(
  '/chats',
  requireAdmin,
  asyncHandler(async (_req, res) => {
    await db.clearChatLogs();
    res.json({ success: true, message: 'Semua riwayat chat dibersihkan.' });
  }),
);

/* -------------------- METRICS & ANALYTICS (DATA SCIENCE) -------------------- */
router.get(
  '/metrics',
  asyncHandler(async (_req, res) => {
    res.json({ success: true, data: await db.getMetrics() });
  }),
);

router.post(
  '/metrics/visit',
  asyncHandler(async (_req, res) => {
    const data = await db.incrementVisits();
    res.json({ success: true, data });
  }),
);

router.post(
  '/metrics/view',
  validate(viewMetricSchema),
  asyncHandler(async (req, res) => {
    const data = await db.incrementProductView(req.body.productId);
    res.json({ success: true, data });
  }),
);

router.get(
  '/analytics/summary',
  requireAdmin,
  asyncHandler(async (_req, res) => {
    const summary = await buildAnalyticsSummary();
    res.json({ success: true, data: summary });
  }),
);

/* -------------------- ADMIN RESET -------------------- */
router.post(
  '/admin/reset',
  requireAdmin,
  asyncHandler(async (_req, res) => {
    const data = await db.resetAll();
    res.json({ success: true, message: 'Semua data dikembalikan ke contoh awal.', data });
  }),
);

export default router;
