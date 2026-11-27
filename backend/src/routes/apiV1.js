import { Router } from 'express';
import { env, STORE } from '../config/env.js';
import { db } from '../db/index.js';
import {
  requireAdmin,
  requireAuth,
  optionalAuth,
  signAdminToken,
  signToken,
  verifyGoogleCredential,
} from '../middleware/auth.js';
import { orderRateLimiter, loginRateLimiter } from '../middleware/rateLimit.js';
import {
  validate,
  loginSchema,
  productSchema,
  productStockSchema,
  customPortfolioSchema,
  orderCreateSchema,
  orderUpdateSchema,
  paymentRecordCreateSchema,
  paymentRecordUpdateSchema,
  paymentSettingsSchema,
  saleCreateSchema,
  faqSchema,
  chatRequestSchema,
  viewMetricSchema,
} from '../validators/schemas.js';
import { processKoyoChat } from '../services/genaiService.js';
import { buildAnalyticsSummary } from '../services/analyticsService.js';

const router = Router();

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

async function logActivitySafe(payload) {
  if (!payload?.userEmail) return null;
  try {
    return await db.createActivity(payload);
  } catch (err) {
    console.warn('[activity-log] gagal mencatat aktivitas:', err?.message);
    return null;
  }
}

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

router.get(
  '/bootstrap',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const isOwner = req.user?.role === 'owner';
    const [products, rawCustomPortfolio, faqs, testimonials, metrics, paymentSettings] =
      await Promise.all([
        db.getProducts(),
        db.getCustomPortfolio(),
        db.getFaqs(),
        db.getTestimonials(),
        db.getMetrics(),
        db.getPaymentSettings(),
      ]);
    const customPortfolio = isOwner
      ? rawCustomPortfolio
      : rawCustomPortfolio.filter((c) => c.isPublished !== false);
    res.json({
      success: true,
      data: { products, customPortfolio, faqs, testimonials, metrics, paymentSettings, store: STORE },
    });
  }),
);

/* -------------------- PENGATURAN PEMBAYARAN (REKENING & QRIS) -------------------- */
router.get(
  '/settings/payment',
  asyncHandler(async (_req, res) => {
    const data = await db.getPaymentSettings();
    res.json({ success: true, data });
  }),
);

router.put(
  '/settings/payment',
  requireAdmin,
  validate(paymentSettingsSchema),
  asyncHandler(async (req, res) => {
    const updated = await db.updatePaymentSettings(req.body);
    res.json({
      success: true,
      message: 'Pengaturan rekening & pembayaran berhasil disimpan.',
      data: updated,
    });
  }),
);

/* -------------------- AUTH (OWNER & CUSTOMER GOOGLE) -------------------- */
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

router.post(
  '/auth/google',
  loginRateLimiter,
  asyncHandler(async (req, res) => {
    const { credential } = req.body || {};
    if (!credential || typeof credential !== 'string') {
      return res.status(400).json({
        success: false,
        code: 'MISSING_CREDENTIAL',
        message: 'Token login Google tidak ditemukan.',
      });
    }
    try {
      const user = await verifyGoogleCredential(credential);
      const token = signToken(user);
      await logActivitySafe({
        userEmail: user.email,
        userName: user.name,
        action: 'login',
        targetType: 'auth',
        label: user.role === 'owner' ? 'Masuk sebagai Owner via Google' : 'Masuk dengan akun Google',
        metadata: { role: user.role },
      });
      return res.json({
        success: true,
        message: user.role === 'owner' ? 'Login Owner via Google berhasil.' : 'Login Google berhasil.',
        data: { token, user },
      });
    } catch (err) {
      return res.status(401).json({
        success: false,
        code: 'GOOGLE_AUTH_FAILED',
        message: err.message || 'Verifikasi akun Google gagal.',
      });
    }
  }),
);

router.get('/auth/me', requireAuth, (req, res) => {
  res.json({ success: true, data: req.user });
});

/* -------------------- WISHLIST PER AKUN -------------------- */
router.get(
  '/wishlist/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const wishlist = await db.getWishlistByEmail(req.user.email);
    res.json({ success: true, data: wishlist });
  }),
);

router.post(
  '/wishlist/toggle',
  requireAuth,
  asyncHandler(async (req, res) => {
    const productId = Number(req.body?.productId);
    if (!Number.isInteger(productId) || productId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'productId tidak valid.',
      });
    }
    const product = await db.getProductById(productId);
    const result = await db.toggleWishlist(req.user.email, productId);

    await logActivitySafe({
      userEmail: req.user.email,
      userName: req.user.name,
      action: result.active ? 'wishlist_add' : 'wishlist_remove',
      targetType: 'product',
      targetId: String(productId),
      label: result.active
        ? `Menambahkan ${product?.name || `Produk #${productId}`} ke Favorit`
        : `Menghapus ${product?.name || `Produk #${productId}`} dari Favorit`,
      metadata: {
        productId,
        productName: product?.name || '',
        category: product?.category || '',
        price: product?.price || 0,
      },
    });

    return res.json({
      success: true,
      message: result.active ? 'Ditambahkan ke Favorit akun.' : 'Dihapus dari Favorit akun.',
      data: result,
    });
  }),
);

/* -------------------- USER ACTIVITIES -------------------- */
router.get(
  '/activities/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const list = await db.getActivitiesByEmail(req.user.email, req.query.limit);
    res.json({ success: true, data: list });
  }),
);

router.post(
  '/activities',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { action, targetType, targetId, label, metadata } = req.body || {};
    if (!action || typeof action !== 'string') {
      return res.status(400).json({ success: false, message: 'Field action wajib diisi.' });
    }
    const created = await db.createActivity({
      userEmail: req.user.email,
      userName: req.user.name,
      action: action.trim().slice(0, 60),
      targetType: String(targetType || '').trim().slice(0, 40),
      targetId: targetId != null ? String(targetId).trim().slice(0, 80) : '',
      label: String(label || '').trim().slice(0, 240),
      metadata: metadata && typeof metadata === 'object' ? metadata : {},
    });
    return res.status(201).json({ success: true, data: created });
  }),
);

router.get(
  '/activities',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const list = await db.getAllActivities({
      email: req.query.email,
      action: req.query.action,
      limit: req.query.limit,
    });
    res.json({ success: true, data: list });
  }),
);

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
  optionalAuth,
  asyncHandler(async (req, res) => {
    const isOwner = req.user?.role === 'owner';
    let list = await db.getCustomPortfolio();
    if (!isOwner) {
      list = list.filter((c) => c.isPublished !== false);
    }
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

/* -------------------- ORDERS & PEMBAYARAN (TUNAI / TABUNG) -------------------- */
router.get(
  '/orders',
  requireAdmin,
  asyncHandler(async (_req, res) => {
    const list = await db.getOrders();
    res.json({ success: true, data: list });
  }),
);

router.get(
  '/orders/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const list = await db.getOrdersByEmail(req.user.email);
    res.json({ success: true, data: list });
  }),
);

router.post(
  '/orders',
  optionalAuth,
  orderRateLimiter,
  validate(orderCreateSchema),
  asyncHandler(async (req, res) => {
    const cleanPhone = String(req.body.phone || '').replace(/[\s-]+/g, '');
    const estimatedPrice = Number(req.body.estimatedPrice ?? req.body.total) || 0;
    const customerEmail = req.user?.email || req.body.customerEmail || '';
    const created = await db.createOrder({
      ...req.body,
      phone: cleanPhone,
      estimatedPrice,
      customerEmail,
    });

    await logActivitySafe({
      userEmail: customerEmail,
      userName: req.user?.name || created.name,
      action: created.custom ? 'custom_order_create' : 'order_create',
      targetType: 'order',
      targetId: String(created.orderCode || created.id),
      label: `Mengajukan pesanan ${created.product} (${created.orderCode})`,
      metadata: {
        orderId: created.id,
        orderCode: created.orderCode,
        product: created.product,
        productId: created.productId,
        quantity: created.quantity,
        payment: created.payment,
        estimatedPrice: created.estimatedPrice,
        isCustom: Boolean(created.custom),
        hasGps: created.latitude != null && created.longitude != null,
      },
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
    const existing = await db.getOrderById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan.' });

    const patch = { ...req.body };
    // Jika Owner menetapkan/mengubah harga final pada pesanan yang belum diproses/selesai,
    // otomatis pindahkan status ke 'Harga Ditetapkan' (termasuk jika sebelumnya dibatalkan)
    if (
      patch.finalPrice !== undefined &&
      patch.finalPrice !== null &&
      !patch.status &&
      existing.status !== 'Diproses' &&
      existing.status !== 'Selesai'
    ) {
      patch.status = 'Harga Ditetapkan';
    }
    const updated = await db.updateOrder(req.params.id, patch);
    return res.json({ success: true, message: 'Pesanan diperbarui.', data: updated });
  }),
);

// Tambah setoran tabungan / pembayaran tunai (tidak boleh melebihi sisa tagihan)
router.post(
  '/orders/:id/payments',
  requireAuth,
  validate(paymentRecordCreateSchema),
  asyncHandler(async (req, res) => {
    const order = await db.getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan.' });
    }

    const isOwner = req.user?.role === 'owner';
    if (!isOwner) {
      if (String(order.customerEmail || '').toLowerCase() !== String(req.user?.email || '').toLowerCase()) {
        return res.status(403).json({
          success: false,
          message: 'Anda tidak berhak mengirim pembayaran untuk pesanan ini.',
        });
      }
      if (order.status === 'Dibatalkan') {
        return res.status(400).json({
          success: false,
          message: 'Pesanan yang dibatalkan tidak dapat menerima pembayaran.',
        });
      }
      if (req.body.method !== 'Tunai di Toko' && !req.body.proofImage) {
        return res.status(400).json({
          success: false,
          message: 'Mohon unggah foto bukti transfer / pembayaran QRIS.',
        });
      }
    }

    const bill = Number(order.finalPrice) || 0;
    if (bill <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Menunggu Pak Nanang menetapkan Harga Final terlebih dahulu sebelum melakukan pembayaran.',
      });
    }

    const existingRecords = Array.isArray(order.paymentRecords) ? order.paymentRecords : [];
    const verifiedPaid = existingRecords
      .filter((r) => r.status === 'Terverifikasi')
      .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
    const remaining = Math.max(0, bill - verifiedPaid);

    if (remaining <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Pesanan ini sudah LUNAS dan tidak memiliki sisa tagihan.',
      });
    }

    if (Number(req.body.amount) > remaining) {
      return res.status(400).json({
        success: false,
        message: `Nominal pembayaran tidak boleh melebihi sisa tagihan (maksimal Rp ${remaining.toLocaleString('id-ID')}).`,
      });
    }

    const nowIso = new Date().toISOString();
    const record = {
      id: Date.now(),
      amount: Number(req.body.amount),
      date: req.body.date || nowIso.slice(0, 10),
      method: req.body.method || 'Transfer Bank',
      accountLabel: req.body.accountLabel || '',
      note: req.body.note || '',
      proofImage: req.body.proofImage || '',
      status: isOwner ? 'Terverifikasi' : 'Menunggu Verifikasi',
      verifiedBy: isOwner ? req.user?.name || STORE.owner : '',
      verifiedAt: isOwner ? nowIso : '',
      rejectReason: '',
      recordedBy: isOwner ? 'owner' : 'customer',
      createdAt: nowIso,
    };

    const nextRecords = [...existingRecords, record];
    const updated = await db.updateOrder(order.id, { paymentRecords: nextRecords });

    if (!isOwner && req.user?.email) {
      await logActivitySafe({
        userEmail: req.user.email,
        userName: req.user.name,
        action: 'payment_submit',
        targetType: 'order',
        targetId: String(order.orderCode || order.id),
        label: `Mengirim bukti bayar Rp ${record.amount.toLocaleString('id-ID')} untuk ${order.product}`,
        metadata: {
          orderId: order.id,
          orderCode: order.orderCode,
          amount: record.amount,
          method: record.method,
        },
      });
    }

    return res.status(201).json({
      success: true,
      message: isOwner
        ? 'Pembayaran berhasil dicatat & terverifikasi.'
        : 'Bukti pembayaran terkirim! Menunggu verifikasi Pak Nanang.',
      data: updated,
    });
  }),
);

// Verifikasi atau tolak bukti pembayaran oleh Owner
router.patch(
  '/orders/:id/payments/:paymentId',
  requireAdmin,
  validate(paymentRecordUpdateSchema),
  asyncHandler(async (req, res) => {
    const order = await db.getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan.' });
    }
    const targetId = Number(req.params.paymentId);
    const records = Array.isArray(order.paymentRecords) ? order.paymentRecords : [];
    const idx = records.findIndex((r) => Number(r.id) === targetId);
    if (idx === -1) {
      return res.status(404).json({ success: false, message: 'Catatan pembayaran tidak ditemukan.' });
    }

    if (req.body.status === 'Terverifikasi') {
      const bill = Number(order.finalPrice) || 0;
      const otherVerified = records
        .filter((r, i) => i !== idx && r.status === 'Terverifikasi')
        .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
      const remaining = Math.max(0, bill - otherVerified);
      if (bill > 0 && Number(records[idx].amount) > remaining) {
        return res.status(400).json({
          success: false,
          message: `Tidak dapat diverifikasi: nominal (Rp ${Number(records[idx].amount).toLocaleString('id-ID')}) melebihi sisa tagihan (Rp ${remaining.toLocaleString('id-ID')}).`,
        });
      }
    }

    const nowIso = new Date().toISOString();
    const updatedRecord = {
      ...records[idx],
      status: req.body.status,
      rejectReason: req.body.status === 'Ditolak' ? req.body.rejectReason || '' : '',
      verifiedBy: req.user?.name || STORE.owner,
      verifiedAt: nowIso,
    };
    const nextRecords = records.map((r, i) => (i === idx ? updatedRecord : r));
    const updated = await db.updateOrder(order.id, { paymentRecords: nextRecords });

    return res.json({
      success: true,
      message:
        req.body.status === 'Terverifikasi'
          ? 'Pembayaran berhasil diverifikasi.'
          : 'Pembayaran ditolak.',
      data: updated,
    });
  }),
);

// Hapus catatan pembayaran (Owner)
router.delete(
  '/orders/:id/payments/:paymentId',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const order = await db.getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan.' });
    }
    const targetId = Number(req.params.paymentId);
    const records = Array.isArray(order.paymentRecords) ? order.paymentRecords : [];
    const nextRecords = records.filter((r) => Number(r.id) !== targetId);
    if (nextRecords.length === records.length) {
      return res.status(404).json({ success: false, message: 'Catatan pembayaran tidak ditemukan.' });
    }
    const updated = await db.updateOrder(order.id, { paymentRecords: nextRecords });
    return res.json({
      success: true,
      message: 'Catatan pembayaran dihapus.',
      data: updated,
    });
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

/* -------------------- TESTIMONIALS & PRODUCT REVIEWS -------------------- */
router.get(
  '/testimonials',
  asyncHandler(async (req, res) => {
    let list = await db.getTestimonials();
    if (req.query.productId) {
      list = list.filter((t) => Number(t.productId) === Number(req.query.productId));
    }
    if (req.query.home === 'true') {
      list = list.filter((t) => t.showOnHome !== false);
    }
    res.json({ success: true, data: list });
  }),
);

router.post(
  '/testimonials',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const name = String(req.body?.name || '').trim();
    const city = String(req.body?.city || '').trim();
    const text = String(req.body?.text || '').trim();
    if (name.length < 2 || city.length < 2 || text.length < 5) {
      return res.status(400).json({
        success: false,
        message: 'Nama, kota asal, dan isi testimoni wajib diisi dengan lengkap.',
      });
    }
    const rawPid = req.body?.productId;
    const productId = rawPid !== null && rawPid !== undefined && rawPid !== '' ? Number(rawPid) : null;
    let productName = String(req.body?.productName || '').trim();
    if (productId && !productName) {
      const prod = await db.getProductById(productId);
      if (prod) productName = prod.name;
    }
    const rating = Math.min(5, Math.max(1, Number(req.body?.rating) || 5));
    const showOnHome = req.body?.showOnHome === undefined ? true : Boolean(req.body.showOnHome);

    const created = await db.createTestimonial({
      name,
      city,
      text,
      rating,
      productId,
      productName,
      source: 'owner',
      showOnHome,
    });
    return res.status(201).json({ success: true, message: 'Testimoni ditambahkan.', data: created });
  }),
);

router.post(
  '/testimonials/review',
  requireAuth,
  asyncHandler(async (req, res) => {
    const orderId = Number(req.body?.orderId);
    const rating = Math.min(5, Math.max(1, Math.round(Number(req.body?.rating) || 5)));
    const text = String(req.body?.text || '').trim();
    const cityInput = String(req.body?.city || '').trim();

    if (!Number.isFinite(orderId) || orderId <= 0) {
      return res.status(400).json({ success: false, message: 'ID pesanan tidak valid.' });
    }
    if (text.length < 5 || text.length > 600) {
      return res.status(400).json({
        success: false,
        message: 'Isi ulasan minimal 5 karakter dan maksimal 600 karakter.',
      });
    }

    const order = await db.getOrderById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan.' });
    }
    if (String(order.customerEmail || '').toLowerCase() !== String(req.user.email || '').toLowerCase()) {
      return res.status(403).json({ success: false, message: 'Anda tidak berhak mengulas pesanan ini.' });
    }
    if (order.status !== 'Selesai') {
      return res.status(400).json({
        success: false,
        message: 'Ulasan hanya dapat diberikan untuk pesanan yang sudah berstatus Selesai.',
      });
    }

    const existing = await db.getTestimonialByOrderId(order.id);
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Anda sudah memberikan ulasan untuk pesanan ini.',
      });
    }

    const city =
      cityInput ||
      String(order.address || '')
        .split(',')
        .pop()
        .trim()
        .slice(0, 60) ||
      'Jambi';

    const created = await db.createTestimonial({
      name: order.name || req.user.name || 'Pelanggan',
      city,
      text,
      rating,
      productId: order.productId ?? null,
      productName: order.product || '',
      orderId: order.id,
      userEmail: req.user.email,
      source: 'customer',
      showOnHome: true,
    });

    try {
      const linkedPortfolio = await db.getCustomPortfolioByOrderId(order.id);
      if (linkedPortfolio) {
        await db.updateCustomPortfolio(linkedPortfolio.id, {
          customerFeedback: text,
          customerRating: rating,
          customerName: linkedPortfolio.customerName || order.name || req.user.name || 'Pelanggan',
        });
      }
    } catch {
      /* abaikan bila gagal sinkronisasi */
    }

    await logActivitySafe({
      userEmail: req.user.email,
      userName: req.user.name,
      action: 'review_create',
      targetType: order.productId ? 'product' : 'order',
      targetId: String(order.productId || order.orderCode || order.id),
      label: `Memberi ulasan bintang ${rating} untuk ${order.product}`,
      metadata: {
        orderId: order.id,
        orderCode: order.orderCode,
        productId: order.productId ?? null,
        rating,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Terima kasih! Ulasan Anda berhasil dikirim.',
      data: created,
    });
  }),
);

router.put(
  '/testimonials/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const patch = {};
    if (req.body?.name !== undefined) patch.name = String(req.body.name).trim();
    if (req.body?.city !== undefined) patch.city = String(req.body.city).trim();
    if (req.body?.text !== undefined) patch.text = String(req.body.text).trim();
    if (req.body?.rating !== undefined) patch.rating = Math.min(5, Math.max(1, Number(req.body.rating) || 5));
    if (req.body?.productId !== undefined) {
      const rawPid = req.body.productId;
      patch.productId = rawPid !== null && rawPid !== '' ? Number(rawPid) : null;
    }
    if (req.body?.productName !== undefined) patch.productName = String(req.body.productName).trim();
    if (req.body?.showOnHome !== undefined) patch.showOnHome = Boolean(req.body.showOnHome);

    const updated = await db.updateTestimonial(req.params.id, patch);
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
  optionalAuth,
  validate(chatRequestSchema),
  asyncHandler(async (req, res) => {
    const { message, activeProductId, sessionId, logOnly, intent } = req.body;
    const userLabel = req.user?.name || req.user?.email || 'Pengunjung';

    if (logOnly) {
      const saved = await db.createChatLog({
        user: userLabel,
        message,
        intent: intent || 'pemesanan',
        source: 'order-flow',
      });
      await logActivitySafe({
        userEmail: req.user?.email,
        userName: req.user?.name,
        action: 'chat_koyo',
        targetType: 'chat',
        targetId: String(saved.id),
        label: `Mengirim pesan ke Koyo: "${String(message || '').slice(0, 80)}"`,
        metadata: { intent: intent || 'pemesanan', source: 'order-flow' },
      });
      return res.status(201).json({ success: true, data: { log: saved } });
    }

    const result = await processKoyoChat({ message, activeProductId, sessionId });
    await logActivitySafe({
      userEmail: req.user?.email,
      userName: req.user?.name,
      action: 'chat_koyo',
      targetType: 'chat',
      targetId: String(activeProductId || ''),
      label: `Berkonsultasi dengan Koyo: "${String(message || '').slice(0, 80)}"`,
      metadata: {
        intent: result?.intent || 'lainnya',
        source: result?.source || 'fallback',
        activeProductId: activeProductId || null,
      },
    });
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

/* -------------------- METRICS & ANALYTICS -------------------- */
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
  optionalAuth,
  validate(viewMetricSchema),
  asyncHandler(async (req, res) => {
    const productId = Number(req.body.productId);
    const data = await db.incrementProductView(productId);

    if (req.user?.email) {
      const product = await db.getProductById(productId);
      await logActivitySafe({
        userEmail: req.user.email,
        userName: req.user.name,
        action: 'view_product',
        targetType: 'product',
        targetId: String(productId),
        label: `Melihat produk ${product?.name || `#${productId}`}`,
        metadata: {
          productId,
          productName: product?.name || '',
          category: product?.category || '',
          price: product?.price || 0,
        },
      });
    }

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