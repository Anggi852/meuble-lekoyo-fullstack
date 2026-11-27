import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { env } from '../config/env.js';
import { generateOrderCode } from '../utils/orderCode.js';
import {
  seedProducts,
  seedCustomPortfolio,
  seedFaqs,
  seedTestimonials,
} from './seedData.js';

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.resolve(__dirname, '../../data/database.json');
const SCHEMA_FILE = path.resolve(__dirname, '../../sql/schema.sql');

const DEFAULT_PAYMENT_SETTINGS = {
  accounts: [],
  qrisImage: '',
  cashNote:
    "Pembayaran tunai dapat dibayarkan langsung di showroom Meuble Le'Koyo (Telanaipura, Kota Jambi) atau transfer penuh sesuai nominal tagihan.",
  tabungNote:
    'Sistem Tabung fleksibel: Anda dapat menyetor bertahap sesuai kemampuan. Setiap setoran yang terverifikasi otomatis mengurangi sisa tagihan hingga LUNAS.',
};

const USER_TRACKING_SQL = `
CREATE TABLE IF NOT EXISTS user_wishlists (
  user_email TEXT NOT NULL,
  product_id BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_email, product_id)
);
CREATE INDEX IF NOT EXISTS idx_user_wishlists_email ON user_wishlists (user_email);

CREATE TABLE IF NOT EXISTS user_activities (
  id BIGSERIAL PRIMARY KEY,
  user_email TEXT NOT NULL,
  user_name TEXT NOT NULL DEFAULT '',
  action TEXT NOT NULL,
  target_type TEXT NOT NULL DEFAULT '',
  target_id TEXT NOT NULL DEFAULT '',
  label TEXT NOT NULL DEFAULT '',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_user_activities_email_time ON user_activities (user_email, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activities_action ON user_activities (action);

CREATE TABLE IF NOT EXISTS store_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL
);

ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS rating INTEGER NOT NULL DEFAULT 5;
ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS product_id BIGINT;
ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS product_name TEXT NOT NULL DEFAULT '';
ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS order_id BIGINT;
ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS user_email TEXT NOT NULL DEFAULT '';
ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'owner';
ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS show_on_home BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS finished_photos JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS published_portfolio_id BIGINT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_records JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS price_agreed_at TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS price_adjustment JSONB;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS price_history JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE custom_portfolio ADD COLUMN IF NOT EXISTS order_id BIGINT;
ALTER TABLE custom_portfolio ADD COLUMN IF NOT EXISTS order_code TEXT NOT NULL DEFAULT '';
ALTER TABLE custom_portfolio ADD COLUMN IF NOT EXISTS customer_name TEXT NOT NULL DEFAULT '';
ALTER TABLE custom_portfolio ADD COLUMN IF NOT EXISTS customer_feedback TEXT NOT NULL DEFAULT '';
ALTER TABLE custom_portfolio ADD COLUMN IF NOT EXISTS customer_rating INTEGER;
ALTER TABLE custom_portfolio ADD COLUMN IF NOT EXISTS show_feedback BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE custom_portfolio ADD COLUMN IF NOT EXISTS price INTEGER;
ALTER TABLE custom_portfolio ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT TRUE;
`;

function normalizeImages(item) {
  const raw =
    Array.isArray(item.images) && item.images.length > 0
      ? item.images
      : item.image
        ? [{ url: item.image, label: 'Tampak Depan' }]
        : [];
  const clean = raw
    .map((x, i) =>
      typeof x === 'string'
        ? { url: x, label: `Foto ${i + 1}` }
        : { url: x?.url || '', label: x?.label || `Foto ${i + 1}` },
    )
    .filter((x) => Boolean(x.url));
  return {
    images: clean,
    image: clean[0]?.url || item.image || '',
  };
}

function normalizePaymentSettings(raw) {
  const src = raw && typeof raw === 'object' ? raw : {};
  const accounts = Array.isArray(src.accounts)
    ? src.accounts
        .map((a, idx) => ({
          id: a?.id ? String(a.id) : `acc-${idx + 1}`,
          bankName: String(a?.bankName || '').trim(),
          accountNumber: String(a?.accountNumber || '').trim(),
          accountHolder: String(a?.accountHolder || '').trim(),
        }))
        .filter((a) => a.bankName && a.accountNumber && a.accountHolder)
    : [];
  return {
    accounts,
    qrisImage: typeof src.qrisImage === 'string' ? src.qrisImage : '',
    cashNote:
      typeof src.cashNote === 'string' && src.cashNote.trim()
        ? src.cashNote.trim()
        : DEFAULT_PAYMENT_SETTINGS.cashNote,
    tabungNote:
      typeof src.tabungNote === 'string' && src.tabungNote.trim()
        ? src.tabungNote.trim()
        : DEFAULT_PAYMENT_SETTINGS.tabungNote,
  };
}

function normalizeTestimonial(r) {
  const rawPid = r.productId ?? r.product_id;
  const rawOid = r.orderId ?? r.order_id;
  return {
    id: Number(r.id),
    name: r.name || '',
    city: r.city || '',
    text: r.text || '',
    rating: Math.min(5, Math.max(1, Number(r.rating) || 5)),
    productId: rawPid === null || rawPid === undefined || rawPid === '' ? null : Number(rawPid),
    productName: r.productName ?? r.product_name ?? '',
    orderId: rawOid === null || rawOid === undefined || rawOid === '' ? null : Number(rawOid),
    userEmail: r.userEmail ?? r.user_email ?? '',
    source: r.source || 'owner',
    showOnHome:
      r.showOnHome !== undefined
        ? Boolean(r.showOnHome)
        : r.show_on_home !== undefined
          ? Boolean(r.show_on_home)
          : true,
    createdAt:
      r.createdAt ||
      (r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at) ||
      new Date().toISOString(),
  };
}

function initialSnapshot() {
  return {
    products: seedProducts.map((p) => ({
      stockStatus: 'Tersedia',
      featured: false,
      ...p,
      ...normalizeImages(p),
    })),
    customPortfolio: seedCustomPortfolio.map((c) => ({
      orderId: null,
      orderCode: '',
      customerName: '',
      customerFeedback: '',
      customerRating: null,
      showFeedback: true,
      price: null,
      isPublished: true,
      ...c,
      ...normalizeImages(c),
    })),
    orders: [],
    sales: [],
    faqs: [...seedFaqs],
    testimonials: [...seedTestimonials],
    chatLogs: [],
    wishlists: {},
    activities: [],
    paymentSettings: { ...DEFAULT_PAYMENT_SETTINGS },
    metrics: {
      visits: 0,
      views: {},
    },
  };
}

/* ================================================================== */
/* DRIVER 1: FILE JSON PERSISTEN (lokal tanpa perlu setup PostgreSQL) */
/* ================================================================== */
function createJsonDriver() {
  let state = null;

  function load() {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    if (!fs.existsSync(DATA_FILE)) {
      state = initialSnapshot();
      persist();
      return state;
    }
    try {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      const base = initialSnapshot();
      state = {
        products: Array.isArray(parsed.products) ? parsed.products : base.products,
        customPortfolio: Array.isArray(parsed.customPortfolio) ? parsed.customPortfolio : base.customPortfolio,
        orders: Array.isArray(parsed.orders) ? parsed.orders : [],
        sales: Array.isArray(parsed.sales) ? parsed.sales : [],
        faqs: Array.isArray(parsed.faqs) ? parsed.faqs : base.faqs,
        testimonials: Array.isArray(parsed.testimonials) ? parsed.testimonials : base.testimonials,
        chatLogs: Array.isArray(parsed.chatLogs) ? parsed.chatLogs : [],
        wishlists: parsed.wishlists && typeof parsed.wishlists === 'object' ? parsed.wishlists : {},
        activities: Array.isArray(parsed.activities) ? parsed.activities : [],
        paymentSettings: normalizePaymentSettings(parsed.paymentSettings),
        metrics: {
          visits: Number(parsed.metrics?.visits) || 0,
          views: parsed.metrics?.views && typeof parsed.metrics.views === 'object' ? parsed.metrics.views : {},
        },
      };
    } catch {
      state = initialSnapshot();
      persist();
    }
    return state;
  }

  function persist() {
    const tmp = `${DATA_FILE}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(state, null, 2), 'utf-8');
    fs.renameSync(tmp, DATA_FILE);
  }

  const normalizeOrderObj = (o) => ({
    ...o,
    finishedPhotos: Array.isArray(o.finishedPhotos) ? o.finishedPhotos : [],
    publishedPortfolioId: o.publishedPortfolioId ?? null,
    paymentRecords: Array.isArray(o.paymentRecords) ? o.paymentRecords : [],
    priceAgreedAt: o.priceAgreedAt || null,
    priceAdjustment: o.priceAdjustment || null,
    priceHistory: Array.isArray(o.priceHistory) ? o.priceHistory : [],
  });

  return {
    mode: 'json-file',
    async init() {
      load();
    },

    async getPaymentSettings() {
      return normalizePaymentSettings(state.paymentSettings);
    },
    async updatePaymentSettings(data) {
      state.paymentSettings = normalizePaymentSettings(data);
      persist();
      return state.paymentSettings;
    },

    async getProducts() { return state.products; },
    async getProductById(id) { return state.products.find((p) => p.id === Number(id)) || null; },
    async createProduct(data) {
      const item = {
        id: Date.now(),
        stockStatus: 'Tersedia',
        featured: false,
        ...data,
        ...normalizeImages(data),
      };
      state.products = [item, ...state.products];
      persist();
      return item;
    },
    async updateProduct(id, data) {
      const numId = Number(id);
      const idx = state.products.findIndex((p) => p.id === numId);
      if (idx === -1) return null;
      const merged = { ...state.products[idx], ...data, id: numId };
      const normalized = { ...merged, ...normalizeImages(merged) };
      state.products[idx] = normalized;
      persist();
      return normalized;
    },
    async deleteProduct(id) {
      const before = state.products.length;
      state.products = state.products.filter((p) => p.id !== Number(id));
      if (state.products.length === before) return false;
      persist();
      return true;
    },

    async getCustomPortfolio() {
      return state.customPortfolio.map((c) => ({
        orderId: null,
        orderCode: '',
        customerName: '',
        customerFeedback: '',
        customerRating: null,
        showFeedback: true,
        price: null,
        isPublished: true,
        ...c,
      }));
    },
    async getCustomPortfolioById(id) {
      const found = state.customPortfolio.find((c) => c.id === Number(id));
      return found ? { isPublished: true, showFeedback: true, ...found } : null;
    },
    async getCustomPortfolioByOrderId(orderId) {
      const found = state.customPortfolio.find((c) => Number(c.orderId) === Number(orderId));
      return found ? { isPublished: true, showFeedback: true, ...found } : null;
    },
    async createCustomPortfolio(data) {
      const item = {
        id: Date.now(),
        orderId: null,
        orderCode: '',
        customerName: '',
        customerFeedback: '',
        customerRating: null,
        showFeedback: true,
        price: null,
        isPublished: true,
        ...data,
        ...normalizeImages(data),
      };
      state.customPortfolio = [item, ...state.customPortfolio];
      persist();
      return item;
    },
    async updateCustomPortfolio(id, data) {
      const numId = Number(id);
      const idx = state.customPortfolio.findIndex((c) => c.id === numId);
      if (idx === -1) return null;
      const merged = { ...state.customPortfolio[idx], ...data, id: numId };
      const normalized = { ...merged, ...normalizeImages(merged) };
      state.customPortfolio[idx] = normalized;
      persist();
      return normalized;
    },
    async deleteCustomPortfolio(id) {
      const numId = Number(id);
      const before = state.customPortfolio.length;
      state.customPortfolio = state.customPortfolio.filter((c) => c.id !== numId);
      if (state.customPortfolio.length === before) return false;
      state.orders = state.orders.map((o) =>
        Number(o.publishedPortfolioId) === numId ? { ...o, publishedPortfolioId: null } : o,
      );
      persist();
      return true;
    },

    async getOrders() { return state.orders.map(normalizeOrderObj); },
    async getOrderById(id) {
      const found = state.orders.find((o) => o.id === Number(id));
      return found ? normalizeOrderObj(found) : null;
    },
    async getOrdersByEmail(email) {
      const target = String(email || '').trim().toLowerCase();
      return state.orders
        .filter((o) => String(o.customerEmail || '').toLowerCase() === target)
        .map(normalizeOrderObj);
    },
    async createOrder(data) {
      const estimated = Number(data.estimatedPrice ?? data.total) || 0;
      const item = {
        id: Date.now(),
        orderCode: data.orderCode || generateOrderCode(),
        customerEmail: data.customerEmail || '',
        phone: '',
        estimatedPrice: estimated,
        finalPrice: data.finalPrice != null ? Number(data.finalPrice) : null,
        ownerNote: data.ownerNote || '',
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
        status: data.status || 'Menunggu Harga Owner',
        madeBefore: false,
        madeNote: '',
        finishedPhotos: Array.isArray(data.finishedPhotos) ? data.finishedPhotos : [],
        publishedPortfolioId: data.publishedPortfolioId ?? null,
        paymentRecords: Array.isArray(data.paymentRecords) ? data.paymentRecords : [],
        priceAgreedAt: null,
        priceAdjustment: null,
        priceHistory: [],
        createdAt: new Date().toISOString(),
        ...data,
        total: data.finalPrice != null ? Number(data.finalPrice) : estimated,
      };
      state.orders = [item, ...state.orders];
      persist();
      return normalizeOrderObj(item);
    },
    async updateOrder(id, patch) {
      const numId = Number(id);
      const idx = state.orders.findIndex((o) => o.id === numId);
      if (idx === -1) return null;
      const next = { ...state.orders[idx], ...patch, id: numId };
      if (patch.finalPrice !== undefined && patch.finalPrice !== null) {
        next.total = Number(patch.finalPrice);
      }
      state.orders[idx] = normalizeOrderObj(next);
      persist();
      return state.orders[idx];
    },
    async deleteOrder(id) {
      const before = state.orders.length;
      state.orders = state.orders.filter((o) => o.id !== Number(id));
      if (state.orders.length === before) return false;
      persist();
      return true;
    },

    async getSales() { return state.sales; },
    async createSale({ productId, quantity, date, note, markSold }) {
      const item = {
        id: Date.now(),
        productId: Number(productId),
        quantity: Number(quantity),
        date,
        note: note || '',
        createdAt: new Date().toISOString(),
      };
      state.sales = [item, ...state.sales];
      if (markSold) {
        const idx = state.products.findIndex((p) => p.id === Number(productId));
        if (idx !== -1) state.products[idx] = { ...state.products[idx], stockStatus: 'Terjual' };
      }
      persist();
      return item;
    },
    async deleteSale(id) {
      const before = state.sales.length;
      state.sales = state.sales.filter((s) => s.id !== Number(id));
      if (state.sales.length === before) return false;
      persist();
      return true;
    },

    async getFaqs() { return state.faqs; },
    async createFaq(data) {
      const item = { id: Date.now(), ...data };
      state.faqs = [item, ...state.faqs];
      persist();
      return item;
    },
    async updateFaq(id, data) {
      const numId = Number(id);
      const idx = state.faqs.findIndex((f) => f.id === numId);
      if (idx === -1) return null;
      state.faqs[idx] = { ...state.faqs[idx], ...data, id: numId };
      persist();
      return state.faqs[idx];
    },
    async deleteFaq(id) {
      const before = state.faqs.length;
      state.faqs = state.faqs.filter((f) => f.id !== Number(id));
      if (state.faqs.length === before) return false;
      persist();
      return true;
    },

    async getTestimonials() {
      return state.testimonials.map(normalizeTestimonial);
    },
    async getTestimonialByOrderId(orderId) {
      const found = state.testimonials.find((t) => Number(t.orderId) === Number(orderId));
      return found ? normalizeTestimonial(found) : null;
    },
    async createTestimonial(data) {
      const item = normalizeTestimonial({
        id: Date.now(),
        createdAt: new Date().toISOString(),
        ...data,
      });
      state.testimonials = [item, ...state.testimonials];
      persist();
      return item;
    },
    async updateTestimonial(id, data) {
      const numId = Number(id);
      const idx = state.testimonials.findIndex((t) => t.id === numId);
      if (idx === -1) return null;
      state.testimonials[idx] = normalizeTestimonial({ ...state.testimonials[idx], ...data, id: numId });
      persist();
      return state.testimonials[idx];
    },
    async deleteTestimonial(id) {
      const before = state.testimonials.length;
      state.testimonials = state.testimonials.filter((t) => t.id !== Number(id));
      if (state.testimonials.length === before) return false;
      persist();
      return true;
    },

    async getChatLogs() { return state.chatLogs; },
    async createChatLog(entry) {
      const item = {
        id: Date.now(),
        user: entry.user || 'Pengunjung',
        message: entry.message,
        reply: entry.reply || '',
        intent: entry.intent || 'lainnya',
        source: entry.source || 'fallback',
        time: new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }),
        createdAt: new Date().toISOString(),
      };
      state.chatLogs = [item, ...state.chatLogs].slice(0, 200);
      persist();
      return item;
    },
    async clearChatLogs() {
      state.chatLogs = [];
      persist();
    },

    async getWishlistByEmail(email) {
      const key = String(email || '').trim().toLowerCase();
      if (!key) return [];
      const list = state.wishlists[key];
      return Array.isArray(list) ? list.map(Number) : [];
    },
    async toggleWishlist(email, productId) {
      const key = String(email || '').trim().toLowerCase();
      const numId = Number(productId);
      const current = Array.isArray(state.wishlists[key]) ? state.wishlists[key].map(Number) : [];
      const exists = current.includes(numId);
      const next = exists ? current.filter((id) => id !== numId) : [numId, ...current];
      state.wishlists[key] = next;
      persist();
      return { active: !exists, productId: numId, wishlist: next };
    },

    async createActivity(entry) {
      const email = String(entry.userEmail || '').trim().toLowerCase();
      if (!email) return null;
      const item = {
        id: Date.now() * 1000 + Math.floor(Math.random() * 1000),
        userEmail: email,
        userName: entry.userName || '',
        action: entry.action || 'activity',
        targetType: entry.targetType || '',
        targetId: entry.targetId != null ? String(entry.targetId) : '',
        label: entry.label || '',
        metadata: entry.metadata && typeof entry.metadata === 'object' ? entry.metadata : {},
        createdAt: new Date().toISOString(),
      };
      state.activities = [item, ...state.activities].slice(0, 1000);
      persist();
      return item;
    },
    async getActivitiesByEmail(email, limit = 50) {
      const key = String(email || '').trim().toLowerCase();
      const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);
      return state.activities.filter((a) => a.userEmail === key).slice(0, safeLimit);
    },
    async getAllActivities({ email, action, limit = 100 } = {}) {
      const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 500);
      let list = state.activities;
      if (email) {
        const key = String(email).trim().toLowerCase();
        list = list.filter((a) => a.userEmail === key);
      }
      if (action) {
        const act = String(action).trim();
        list = list.filter((a) => a.action === act);
      }
      return list.slice(0, safeLimit);
    },

    async getMetrics() { return state.metrics; },
    async incrementVisits() {
      state.metrics.visits += 1;
      persist();
      return state.metrics;
    },
    async incrementProductView(productId) {
      const k = String(productId);
      state.metrics.views[k] = (state.metrics.views[k] || 0) + 1;
      persist();
      return state.metrics;
    },

    async resetAll() {
      const keptPaymentSettings = state.paymentSettings;
      state = initialSnapshot();
      state.paymentSettings = normalizePaymentSettings(keptPaymentSettings);
      persist();
      return state;
    },
  };
}

/* ================================================================== */
/* DRIVER 2: POSTGRESQL / NEON (otomatis aktif saat DATABASE_URL ada) */
/* ================================================================== */
function createPostgresDriver(connectionString) {
  const pool = new Pool({
    connectionString,
    ssl:
      connectionString.includes('localhost') || connectionString.includes('127.0.0.1')
        ? false
        : { rejectUnauthorized: false },
  });

  const mapProduct = (r) => ({
    id: Number(r.id),
    name: r.name,
    category: r.category,
    price: Number(r.price),
    image: r.image,
    images: r.images || [],
    description: r.description,
    material: r.material,
    productionTime: r.production_time,
    stockStatus: r.stock_status,
    featured: Boolean(r.featured),
  });

  const mapPortfolio = (r) => ({
    id: Number(r.id),
    name: r.name,
    typeKey: r.type_key,
    category: r.category,
    size: r.size,
    finish: r.finish,
    city: r.city,
    year: r.year,
    description: r.description,
    image: r.image,
    images: r.images || [],
    preset: r.preset || undefined,
    orderId: r.order_id === null || r.order_id === undefined ? null : Number(r.order_id),
    orderCode: r.order_code || '',
    customerName: r.customer_name || '',
    customerFeedback: r.customer_feedback || '',
    customerRating:
      r.customer_rating === null || r.customer_rating === undefined
        ? null
        : Number(r.customer_rating),
    showFeedback: r.show_feedback === undefined ? true : Boolean(r.show_feedback),
    price: r.price === null || r.price === undefined ? null : Number(r.price),
    isPublished: r.is_published === undefined ? true : Boolean(r.is_published),
  });

  const mapOrder = (r) => ({
    id: Number(r.id),
    orderCode: r.order_code || '',
    customerEmail: r.customer_email || '',
    name: r.name,
    phone: r.phone || '',
    address: r.address,
    product: r.product,
    productId: r.product_id === null ? null : Number(r.product_id),
    quantity: Number(r.quantity),
    payment: r.payment,
    total: Number(r.total),
    estimatedPrice: Number(r.estimated_price ?? r.total ?? 0),
    finalPrice:
      r.final_price === null || r.final_price === undefined ? null : Number(r.final_price),
    ownerNote: r.owner_note || '',
    latitude: r.latitude === null || r.latitude === undefined ? null : Number(r.latitude),
    longitude: r.longitude === null || r.longitude === undefined ? null : Number(r.longitude),
    status: r.status,
    custom: r.custom || undefined,
    madeBefore: Boolean(r.made_before),
    madeNote: r.made_note || '',
    finishedPhotos: Array.isArray(r.finished_photos) ? r.finished_photos : [],
    publishedPortfolioId:
      r.published_portfolio_id === null || r.published_portfolio_id === undefined
        ? null
        : Number(r.published_portfolio_id),
    paymentRecords: Array.isArray(r.payment_records) ? r.payment_records : [],
    priceAgreedAt: r.price_agreed_at || null,
    priceAdjustment: r.price_adjustment || null,
    priceHistory: Array.isArray(r.price_history) ? r.price_history : [],
    createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at,
  });

  const mapSale = (r) => ({
    id: Number(r.id),
    productId: Number(r.product_id),
    quantity: Number(r.quantity),
    date: r.date,
    note: r.note || '',
  });

  const mapChat = (r) => ({
    id: Number(r.id),
    user: r.user_label,
    message: r.message,
    reply: r.reply,
    intent: r.intent,
    source: r.source,
    time: r.time_label,
    createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at,
  });

  const mapActivity = (r) => ({
    id: Number(r.id),
    userEmail: r.user_email,
    userName: r.user_name || '',
    action: r.action,
    targetType: r.target_type || '',
    targetId: r.target_id || '',
    label: r.label || '',
    metadata: r.metadata || {},
    createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at,
  });

  async function seedIfEmpty() {
    const { rows } = await pool.query('SELECT COUNT(*)::int AS cnt FROM products');
    if (rows[0].cnt > 0) return;
    const snap = initialSnapshot();
    for (const p of snap.products) {
      await pool.query(
        `INSERT INTO products (id, name, category, price, image, images, description, material, production_time, stock_status, featured)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) ON CONFLICT (id) DO NOTHING`,
        [
          p.id,
          p.name,
          p.category,
          p.price,
          p.image,
          JSON.stringify(p.images),
          p.description,
          p.material,
          p.productionTime,
          p.stockStatus,
          p.featured,
        ],
      );
    }
    for (const c of snap.customPortfolio) {
      await pool.query(
        `INSERT INTO custom_portfolio (id, name, type_key, category, size, finish, city, year, description, image, images, preset)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) ON CONFLICT (id) DO NOTHING`,
        [
          c.id,
          c.name,
          c.typeKey || 'lainnya',
          c.category,
          c.size,
          c.finish,
          c.city,
          c.year,
          c.description,
          c.image,
          JSON.stringify(c.images),
          c.preset ? JSON.stringify(c.preset) : null,
        ],
      );
    }
    for (const f of snap.faqs) {
      await pool.query(
        `INSERT INTO faqs (id, title, question, answer) VALUES ($1,$2,$3,$4) ON CONFLICT (id) DO NOTHING`,
        [f.id, f.title, f.question, f.answer],
      );
    }
    for (const t of snap.testimonials) {
      await pool.query(
        `INSERT INTO testimonials (id, name, city, text) VALUES ($1,$2,$3,$4) ON CONFLICT (id) DO NOTHING`,
        [t.id, t.name, t.city, t.text],
      );
    }
    await pool.query(
      `INSERT INTO metrics (key, value) VALUES ('stats', $1::jsonb) ON CONFLICT (key) DO NOTHING`,
      [JSON.stringify({ visits: 0, views: {} })],
    );
  }

  return {
    mode: 'postgresql',
    async init() {
      const sql = fs.readFileSync(SCHEMA_FILE, 'utf-8');
      await pool.query(sql);
      await pool.query(USER_TRACKING_SQL);
      await seedIfEmpty();
    },

    async getPaymentSettings() {
      const { rows } = await pool.query(`SELECT value FROM store_settings WHERE key='payment'`);
      return normalizePaymentSettings(rows[0]?.value);
    },
    async updatePaymentSettings(data) {
      const normalized = normalizePaymentSettings(data);
      await pool.query(
        `INSERT INTO store_settings (key, value) VALUES ('payment', $1::jsonb)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
        [JSON.stringify(normalized)],
      );
      return normalized;
    },

    async getProducts() {
      const { rows } = await pool.query('SELECT * FROM products ORDER BY id DESC');
      return rows.map(mapProduct);
    },
    async getProductById(id) {
      const { rows } = await pool.query('SELECT * FROM products WHERE id = $1', [Number(id)]);
      return rows[0] ? mapProduct(rows[0]) : null;
    },
    async createProduct(data) {
      const id = Date.now();
      const norm = normalizeImages(data);
      const { rows } = await pool.query(
        `INSERT INTO products (id, name, category, price, image, images, description, material, production_time, stock_status, featured)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
        [
          id,
          data.name,
          data.category,
          data.price,
          norm.image,
          JSON.stringify(norm.images),
          data.description,
          data.material,
          data.productionTime,
          data.stockStatus || 'Tersedia',
          Boolean(data.featured),
        ],
      );
      return mapProduct(rows[0]);
    },
    async updateProduct(id, data) {
      const existing = await this.getProductById(id);
      if (!existing) return null;
      const m = { ...existing, ...data };
      const norm = normalizeImages(m);
      const { rows } = await pool.query(
        `UPDATE products SET name=$2, category=$3, price=$4, image=$5, images=$6, description=$7, material=$8, production_time=$9, stock_status=$10, featured=$11
         WHERE id=$1 RETURNING *`,
        [
          Number(id),
          m.name,
          m.category,
          m.price,
          norm.image,
          JSON.stringify(norm.images),
          m.description,
          m.material,
          m.productionTime,
          m.stockStatus || 'Tersedia',
          Boolean(m.featured),
        ],
      );
      return mapProduct(rows[0]);
    },
    async deleteProduct(id) {
      const res = await pool.query('DELETE FROM products WHERE id = $1', [Number(id)]);
      return res.rowCount > 0;
    },

    async getCustomPortfolio() {
      const { rows } = await pool.query('SELECT * FROM custom_portfolio ORDER BY id DESC');
      return rows.map(mapPortfolio);
    },
    async getCustomPortfolioById(id) {
      const { rows } = await pool.query('SELECT * FROM custom_portfolio WHERE id = $1', [Number(id)]);
      return rows[0] ? mapPortfolio(rows[0]) : null;
    },
    async getCustomPortfolioByOrderId(orderId) {
      const { rows } = await pool.query(
        'SELECT * FROM custom_portfolio WHERE order_id = $1 LIMIT 1',
        [Number(orderId)],
      );
      return rows[0] ? mapPortfolio(rows[0]) : null;
    },
    async createCustomPortfolio(data) {
      const id = Date.now();
      const norm = normalizeImages(data);
      const { rows } = await pool.query(
        `INSERT INTO custom_portfolio (
           id, name, type_key, category, size, finish, city, year, description, image, images, preset,
           order_id, order_code, customer_name, customer_feedback, customer_rating, show_feedback, price, is_published
         )
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20) RETURNING *`,
        [
          id,
          data.name,
          data.typeKey || 'lainnya',
          data.category,
          data.size || '',
          data.finish || 'Natural Jati (Doff)',
          data.city || 'Kota Jambi',
          data.year || String(new Date().getFullYear()),
          data.description || '',
          norm.image,
          JSON.stringify(norm.images),
          data.preset ? JSON.stringify(data.preset) : null,
          data.orderId ?? null,
          data.orderCode || '',
          data.customerName || '',
          data.customerFeedback || '',
          data.customerRating ?? null,
          data.showFeedback === undefined ? true : Boolean(data.showFeedback),
          data.price ?? null,
          data.isPublished === undefined ? true : Boolean(data.isPublished),
        ],
      );
      return mapPortfolio(rows[0]);
    },
    async updateCustomPortfolio(id, data) {
      const existing = await this.getCustomPortfolioById(id);
      if (!existing) return null;
      const m = { ...existing, ...data };
      const norm = normalizeImages(m);
      const { rows } = await pool.query(
        `UPDATE custom_portfolio
         SET name=$2, type_key=$3, category=$4, size=$5, finish=$6, city=$7, year=$8,
             description=$9, image=$10, images=$11, preset=$12,
             order_id=$13, order_code=$14, customer_name=$15, customer_feedback=$16,
             customer_rating=$17, show_feedback=$18, price=$19, is_published=$20
         WHERE id=$1 RETURNING *`,
        [
          Number(id),
          m.name,
          m.typeKey || 'lainnya',
          m.category,
          m.size || '',
          m.finish || '',
          m.city || '',
          m.year || '',
          m.description || '',
          norm.image,
          JSON.stringify(norm.images),
          m.preset ? JSON.stringify(m.preset) : null,
          m.orderId ?? null,
          m.orderCode || '',
          m.customerName || '',
          m.customerFeedback || '',
          m.customerRating ?? null,
          m.showFeedback === undefined ? true : Boolean(m.showFeedback),
          m.price ?? null,
          m.isPublished === undefined ? true : Boolean(m.isPublished),
        ],
      );
      return mapPortfolio(rows[0]);
    },
    async deleteCustomPortfolio(id) {
      const numId = Number(id);
      const res = await pool.query('DELETE FROM custom_portfolio WHERE id = $1', [numId]);
      if (res.rowCount > 0) {
        await pool.query(
          'UPDATE orders SET published_portfolio_id = NULL WHERE published_portfolio_id = $1',
          [numId],
        );
      }
      return res.rowCount > 0;
    },

    async getOrders() {
      const { rows } = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
      return rows.map(mapOrder);
    },
    async getOrderById(id) {
      const { rows } = await pool.query('SELECT * FROM orders WHERE id = $1', [Number(id)]);
      return rows[0] ? mapOrder(rows[0]) : null;
    },
    async getOrdersByEmail(email) {
      const { rows } = await pool.query(
        'SELECT * FROM orders WHERE LOWER(customer_email) = LOWER($1) ORDER BY created_at DESC',
        [String(email || '').trim()],
      );
      return rows.map(mapOrder);
    },
    async createOrder(data) {
      const id = Date.now();
      const orderCode = data.orderCode || generateOrderCode();
      const estimated = Number(data.estimatedPrice ?? data.total) || 0;
      const { rows } = await pool.query(
        `INSERT INTO orders (
           id, order_code, customer_email, name, phone, address, product, product_id,
           quantity, payment, total, estimated_price, final_price, owner_note,
           latitude, longitude, status, custom
         )
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
         RETURNING *`,
        [
          id,
          orderCode,
          data.customerEmail || null,
          data.name,
          data.phone || '',
          data.address,
          data.product,
          data.productId ?? null,
          Number(data.quantity) || 1,
          data.payment,
          estimated,
          estimated,
          null,
          '',
          data.latitude ?? null,
          data.longitude ?? null,
          'Menunggu Harga Owner',
          data.custom ? JSON.stringify(data.custom) : null,
        ],
      );
      return mapOrder(rows[0]);
    },
    async updateOrder(id, patch) {
      const { rows: cur } = await pool.query('SELECT * FROM orders WHERE id = $1', [Number(id)]);
      if (!cur[0]) return null;
      const o = mapOrder(cur[0]);
      const next = { ...o, ...patch };
      const nextTotal =
        patch.finalPrice !== undefined && patch.finalPrice !== null
          ? Number(patch.finalPrice)
          : next.total;
      const nextFinishedPhotos = Array.isArray(patch.finishedPhotos)
        ? patch.finishedPhotos
        : o.finishedPhotos || [];
      const nextPublishedPortfolioId =
        patch.publishedPortfolioId !== undefined
          ? patch.publishedPortfolioId
          : o.publishedPortfolioId ?? null;
      const nextPaymentRecords = Array.isArray(patch.paymentRecords)
        ? patch.paymentRecords
        : o.paymentRecords || [];
      const nextPriceAgreedAt =
        patch.priceAgreedAt !== undefined ? patch.priceAgreedAt : o.priceAgreedAt ?? null;
      const nextPriceAdjustment =
        patch.priceAdjustment !== undefined ? patch.priceAdjustment : o.priceAdjustment ?? null;
      const nextPriceHistory = Array.isArray(patch.priceHistory)
        ? patch.priceHistory
        : o.priceHistory || [];

      const { rows } = await pool.query(
        `UPDATE orders
         SET status=$2, made_before=$3, made_note=$4, final_price=$5, owner_note=$6, total=$7,
             finished_photos=$8, published_portfolio_id=$9, payment_records=$10,
             price_agreed_at=$11, price_adjustment=$12, price_history=$13
         WHERE id=$1 RETURNING *`,
        [
          Number(id),
          next.status,
          Boolean(next.madeBefore),
          next.madeNote || '',
          next.finalPrice ?? null,
          next.ownerNote || '',
          nextTotal,
          JSON.stringify(nextFinishedPhotos),
          nextPublishedPortfolioId,
          JSON.stringify(nextPaymentRecords),
          nextPriceAgreedAt,
          nextPriceAdjustment ? JSON.stringify(nextPriceAdjustment) : null,
          JSON.stringify(nextPriceHistory),
        ],
      );
      return mapOrder(rows[0]);
    },
    async deleteOrder(id) {
      const res = await pool.query('DELETE FROM orders WHERE id = $1', [Number(id)]);
      return res.rowCount > 0;
    },

    async getSales() {
      const { rows } = await pool.query('SELECT * FROM sales ORDER BY created_at DESC');
      return rows.map(mapSale);
    },
    async createSale({ productId, quantity, date, note, markSold }) {
      const id = Date.now();
      const { rows } = await pool.query(
        `INSERT INTO sales (id, product_id, quantity, date, note) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
        [id, Number(productId), Number(quantity), date, note || ''],
      );
      if (markSold) {
        await pool.query(`UPDATE products SET stock_status='Terjual' WHERE id=$1`, [Number(productId)]);
      }
      return mapSale(rows[0]);
    },
    async deleteSale(id) {
      const res = await pool.query('DELETE FROM sales WHERE id = $1', [Number(id)]);
      return res.rowCount > 0;
    },

    async getFaqs() {
      const { rows } = await pool.query('SELECT * FROM faqs ORDER BY id ASC');
      return rows.map((r) => ({ id: Number(r.id), title: r.title, question: r.question, answer: r.answer }));
    },
    async createFaq(data) {
      const id = Date.now();
      const { rows } = await pool.query(
        `INSERT INTO faqs (id, title, question, answer) VALUES ($1,$2,$3,$4) RETURNING *`,
        [id, data.title, data.question, data.answer],
      );
      return { id: Number(rows[0].id), title: rows[0].title, question: rows[0].question, answer: rows[0].answer };
    },
    async updateFaq(id, data) {
      const { rows } = await pool.query(
        `UPDATE faqs SET title=$2, question=$3, answer=$4 WHERE id=$1 RETURNING *`,
        [Number(id), data.title, data.question, data.answer],
      );
      return rows[0] ? { id: Number(rows[0].id), title: rows[0].title, question: rows[0].question, answer: rows[0].answer } : null;
    },
    async deleteFaq(id) {
      const res = await pool.query('DELETE FROM faqs WHERE id = $1', [Number(id)]);
      return res.rowCount > 0;
    },

    async getTestimonials() {
      const { rows } = await pool.query('SELECT * FROM testimonials ORDER BY id DESC');
      return rows.map(normalizeTestimonial);
    },
    async getTestimonialByOrderId(orderId) {
      const { rows } = await pool.query(
        'SELECT * FROM testimonials WHERE order_id = $1 LIMIT 1',
        [Number(orderId)],
      );
      return rows[0] ? normalizeTestimonial(rows[0]) : null;
    },
    async createTestimonial(data) {
      const id = Date.now();
      const item = normalizeTestimonial({ id, ...data });
      const { rows } = await pool.query(
        `INSERT INTO testimonials (
           id, name, city, text, rating, product_id, product_name,
           order_id, user_email, source, show_on_home
         )
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         RETURNING *`,
        [
          id,
          item.name,
          item.city,
          item.text,
          item.rating,
          item.productId,
          item.productName,
          item.orderId,
          item.userEmail,
          item.source,
          item.showOnHome,
        ],
      );
      return normalizeTestimonial(rows[0]);
    },
    async updateTestimonial(id, data) {
      const { rows: cur } = await pool.query('SELECT * FROM testimonials WHERE id = $1', [Number(id)]);
      if (!cur[0]) return null;
      const merged = normalizeTestimonial({ ...normalizeTestimonial(cur[0]), ...data, id: Number(id) });
      const { rows } = await pool.query(
        `UPDATE testimonials
         SET name=$2, city=$3, text=$4, rating=$5, product_id=$6, product_name=$7, show_on_home=$8
         WHERE id=$1 RETURNING *`,
        [
          Number(id),
          merged.name,
          merged.city,
          merged.text,
          merged.rating,
          merged.productId,
          merged.productName,
          merged.showOnHome,
        ],
      );
      return rows[0] ? normalizeTestimonial(rows[0]) : null;
    },
    async deleteTestimonial(id) {
      const res = await pool.query('DELETE FROM testimonials WHERE id = $1', [Number(id)]);
      return res.rowCount > 0;
    },

    async getChatLogs() {
      const { rows } = await pool.query('SELECT * FROM chat_logs ORDER BY created_at DESC LIMIT 200');
      return rows.map(mapChat);
    },
    async createChatLog(entry) {
      const id = Date.now();
      const timeLabel = new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
      const { rows } = await pool.query(
        `INSERT INTO chat_logs (id, user_label, message, reply, intent, source, time_label)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [
          id,
          entry.user || 'Pengunjung',
          entry.message,
          entry.reply || '',
          entry.intent || 'lainnya',
          entry.source || 'fallback',
          timeLabel,
        ],
      );
      return mapChat(rows[0]);
    },
    async clearChatLogs() {
      await pool.query('DELETE FROM chat_logs');
    },

    async getWishlistByEmail(email) {
      const cleanEmail = String(email || '').trim().toLowerCase();
      if (!cleanEmail) return [];
      const { rows } = await pool.query(
        'SELECT product_id FROM user_wishlists WHERE LOWER(user_email) = $1 ORDER BY created_at DESC',
        [cleanEmail],
      );
      return rows.map((r) => Number(r.product_id));
    },
    async toggleWishlist(email, productId) {
      const cleanEmail = String(email || '').trim().toLowerCase();
      const numId = Number(productId);
      const del = await pool.query(
        'DELETE FROM user_wishlists WHERE LOWER(user_email) = $1 AND product_id = $2',
        [cleanEmail, numId],
      );
      let active = false;
      if (del.rowCount === 0) {
        await pool.query(
          `INSERT INTO user_wishlists (user_email, product_id)
           VALUES ($1, $2)
           ON CONFLICT (user_email, product_id) DO NOTHING`,
          [cleanEmail, numId],
        );
        active = true;
      }
      const wishlist = await this.getWishlistByEmail(cleanEmail);
      return { active, productId: numId, wishlist };
    },

    async createActivity(entry) {
      const cleanEmail = String(entry.userEmail || '').trim().toLowerCase();
      if (!cleanEmail) return null;
      const { rows } = await pool.query(
        `INSERT INTO user_activities (user_email, user_name, action, target_type, target_id, label, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
         RETURNING *`,
        [
          cleanEmail,
          entry.userName || '',
          entry.action || 'activity',
          entry.targetType || '',
          entry.targetId != null ? String(entry.targetId) : '',
          entry.label || '',
          JSON.stringify(entry.metadata && typeof entry.metadata === 'object' ? entry.metadata : {}),
        ],
      );
      return mapActivity(rows[0]);
    },
    async getActivitiesByEmail(email, limit = 50) {
      const cleanEmail = String(email || '').trim().toLowerCase();
      const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);
      const { rows } = await pool.query(
        `SELECT * FROM user_activities
         WHERE LOWER(user_email) = $1
         ORDER BY created_at DESC
         LIMIT $2`,
        [cleanEmail, safeLimit],
      );
      return rows.map(mapActivity);
    },
    async getAllActivities({ email, action, limit = 100 } = {}) {
      const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 500);
      const conditions = [];
      const params = [];
      if (email) {
        params.push(String(email).trim().toLowerCase());
        conditions.push(`LOWER(user_email) = $${params.length}`);
      }
      if (action) {
        params.push(String(action).trim());
        conditions.push(`action = $${params.length}`);
      }
      params.push(safeLimit);
      const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      const { rows } = await pool.query(
        `SELECT * FROM user_activities ${where} ORDER BY created_at DESC LIMIT $${params.length}`,
        params,
      );
      return rows.map(mapActivity);
    },

    async getMetrics() {
      const { rows } = await pool.query(`SELECT value FROM metrics WHERE key='stats'`);
      return rows[0]?.value || { visits: 0, views: {} };
    },
    async incrementVisits() {
      const cur = await this.getMetrics();
      const next = { visits: (Number(cur.visits) || 0) + 1, views: cur.views || {} };
      await pool.query(
        `INSERT INTO metrics (key, value) VALUES ('stats', $1::jsonb)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
        [JSON.stringify(next)],
      );
      return next;
    },
    async incrementProductView(productId) {
      const cur = await this.getMetrics();
      const views = { ...(cur.views || {}) };
      const k = String(productId);
      views[k] = (views[k] || 0) + 1;
      const next = { visits: Number(cur.visits) || 0, views };
      await pool.query(
        `INSERT INTO metrics (key, value) VALUES ('stats', $1::jsonb)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
        [JSON.stringify(next)],
      );
      return next;
    },

    async resetAll() {
      await pool.query(
        'TRUNCATE products, custom_portfolio, orders, sales, faqs, testimonials, chat_logs, metrics, user_wishlists, user_activities RESTART IDENTITY',
      );
      await seedIfEmpty();
      return initialSnapshot();
    },
  };
}

export const db = env.databaseUrl
  ? createPostgresDriver(env.databaseUrl)
  : createJsonDriver();