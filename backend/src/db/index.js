import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { env } from '../config/env.js';
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

function normalizeImages(item) {
  const raw = Array.isArray(item.images) && item.images.length > 0
    ? item.images
    : item.image
    ? [{ url: item.image, label: 'Tampak Depan' }]
    : [];
  const clean = raw
    .map((x, i) => (typeof x === 'string' ? { url: x, label: `Foto ${i + 1}` } : { url: x?.url || '', label: x?.label || `Foto ${i + 1}` }))
    .filter((x) => Boolean(x.url));
  return {
    images: clean,
    image: clean[0]?.url || item.image || '',
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
      ...c,
      ...normalizeImages(c),
    })),
    orders: [],
    sales: [],
    faqs: [...seedFaqs],
    testimonials: [...seedTestimonials],
    chatLogs: [],
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

  return {
    mode: 'json-file',
    async init() {
      load();
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

    async getCustomPortfolio() { return state.customPortfolio; },
    async getCustomPortfolioById(id) { return state.customPortfolio.find((c) => c.id === Number(id)) || null; },
    async createCustomPortfolio(data) {
      const item = { id: Date.now(), ...data, ...normalizeImages(data) };
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
      const before = state.customPortfolio.length;
      state.customPortfolio = state.customPortfolio.filter((c) => c.id !== Number(id));
      if (state.customPortfolio.length === before) return false;
      persist();
      return true;
    },

    async getOrders() { return state.orders; },
    async createOrder(data) {
      const item = {
        id: Date.now(),
        phone: '',
        status: 'Menunggu Konfirmasi WA',
        madeBefore: false,
        madeNote: '',
        createdAt: new Date().toISOString(),
        ...data,
      };
      state.orders = [item, ...state.orders];
      persist();
      return item;
    },
    async updateOrder(id, patch) {
      const numId = Number(id);
      const idx = state.orders.findIndex((o) => o.id === numId);
      if (idx === -1) return null;
      state.orders[idx] = { ...state.orders[idx], ...patch, id: numId };
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

    async getTestimonials() { return state.testimonials; },
    async createTestimonial(data) {
      const item = { id: Date.now(), ...data };
      state.testimonials = [item, ...state.testimonials];
      persist();
      return item;
    },
    async updateTestimonial(id, data) {
      const numId = Number(id);
      const idx = state.testimonials.findIndex((t) => t.id === numId);
      if (idx === -1) return null;
      state.testimonials[idx] = { ...state.testimonials[idx], ...data, id: numId };
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
      state = initialSnapshot();
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
    ssl: connectionString.includes('localhost') || connectionString.includes('127.0.0.1')
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
  });

  const mapOrder = (r) => ({
    id: Number(r.id),
    name: r.name,
    phone: r.phone || '',
    address: r.address,
    product: r.product,
    productId: r.product_id === null ? null : Number(r.product_id),
    quantity: Number(r.quantity),
    payment: r.payment,
    total: Number(r.total),
    status: r.status,
    custom: r.custom || undefined,
    madeBefore: Boolean(r.made_before),
    madeNote: r.made_note || '',
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

  async function seedIfEmpty() {
    const { rows } = await pool.query('SELECT COUNT(*)::int AS cnt FROM products');
    if (rows[0].cnt > 0) return;
    const snap = initialSnapshot();
    for (const p of snap.products) {
      await pool.query(
        `INSERT INTO products (id, name, category, price, image, images, description, material, production_time, stock_status, featured)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) ON CONFLICT (id) DO NOTHING`,
        [p.id, p.name, p.category, p.price, p.image, JSON.stringify(p.images), p.description, p.material, p.productionTime, p.stockStatus, p.featured],
      );
    }
    for (const c of snap.customPortfolio) {
      await pool.query(
        `INSERT INTO custom_portfolio (id, name, type_key, category, size, finish, city, year, description, image, images, preset)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) ON CONFLICT (id) DO NOTHING`,
        [c.id, c.name, c.typeKey || 'lainnya', c.category, c.size, c.finish, c.city, c.year, c.description, c.image, JSON.stringify(c.images), c.preset ? JSON.stringify(c.preset) : null],
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
      await seedIfEmpty();
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
        [id, data.name, data.category, data.price, norm.image, JSON.stringify(norm.images), data.description, data.material, data.productionTime, data.stockStatus || 'Tersedia', Boolean(data.featured)],
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
        [Number(id), m.name, m.category, m.price, norm.image, JSON.stringify(norm.images), m.description, m.material, m.productionTime, m.stockStatus || 'Tersedia', Boolean(m.featured)],
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
    async createCustomPortfolio(data) {
      const id = Date.now();
      const norm = normalizeImages(data);
      const { rows } = await pool.query(
        `INSERT INTO custom_portfolio (id, name, type_key, category, size, finish, city, year, description, image, images, preset)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
        [id, data.name, data.typeKey || 'lainnya', data.category, data.size || '', data.finish || 'Natural Jati (Doff)', data.city || 'Kota Jambi', data.year || '2026', data.description || '', norm.image, JSON.stringify(norm.images), data.preset ? JSON.stringify(data.preset) : null],
      );
      return mapPortfolio(rows[0]);
    },
    async updateCustomPortfolio(id, data) {
      const existing = await this.getCustomPortfolioById(id);
      if (!existing) return null;
      const m = { ...existing, ...data };
      const norm = normalizeImages(m);
      const { rows } = await pool.query(
        `UPDATE custom_portfolio SET name=$2, type_key=$3, category=$4, size=$5, finish=$6, city=$7, year=$8, description=$9, image=$10, images=$11, preset=$12
         WHERE id=$1 RETURNING *`,
        [Number(id), m.name, m.typeKey || 'lainnya', m.category, m.size || '', m.finish || '', m.city || '', m.year || '', m.description || '', norm.image, JSON.stringify(norm.images), m.preset ? JSON.stringify(m.preset) : null],
      );
      return mapPortfolio(rows[0]);
    },
    async deleteCustomPortfolio(id) {
      const res = await pool.query('DELETE FROM custom_portfolio WHERE id = $1', [Number(id)]);
      return res.rowCount > 0;
    },

    async getOrders() {
      const { rows } = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
      return rows.map(mapOrder);
    },
    async createOrder(data) {
      const id = Date.now();
      const { rows } = await pool.query(
        `INSERT INTO orders (id, name, phone, address, product, product_id, quantity, payment, total, status, custom)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'Menunggu Konfirmasi WA',$10) RETURNING *`,
        [id, data.name, data.phone || '', data.address, data.product, data.productId ?? null, Number(data.quantity) || 1, data.payment, Number(data.total) || 0, data.custom ? JSON.stringify(data.custom) : null],
      );
      return mapOrder(rows[0]);
    },
    async updateOrder(id, patch) {
      const { rows: cur } = await pool.query('SELECT * FROM orders WHERE id = $1', [Number(id)]);
      if (!cur[0]) return null;
      const o = mapOrder(cur[0]);
      const next = { ...o, ...patch };
      const { rows } = await pool.query(
        `UPDATE orders SET status=$2, made_before=$3, made_note=$4 WHERE id=$1 RETURNING *`,
        [Number(id), next.status, Boolean(next.madeBefore), next.madeNote || ''],
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
      return rows.map((r) => ({ id: Number(r.id), name: r.name, city: r.city, text: r.text }));
    },
    async createTestimonial(data) {
      const id = Date.now();
      const { rows } = await pool.query(
        `INSERT INTO testimonials (id, name, city, text) VALUES ($1,$2,$3,$4) RETURNING *`,
        [id, data.name, data.city, data.text],
      );
      return { id: Number(rows[0].id), name: rows[0].name, city: rows[0].city, text: rows[0].text };
    },
    async updateTestimonial(id, data) {
      const { rows } = await pool.query(
        `UPDATE testimonials SET name=$2, city=$3, text=$4 WHERE id=$1 RETURNING *`,
        [Number(id), data.name, data.city, data.text],
      );
      return rows[0] ? { id: Number(rows[0].id), name: rows[0].name, city: rows[0].city, text: rows[0].text } : null;
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
        [id, entry.user || 'Pengunjung', entry.message, entry.reply || '', entry.intent || 'lainnya', entry.source || 'fallback', timeLabel],
      );
      return mapChat(rows[0]);
    },
    async clearChatLogs() {
      await pool.query('DELETE FROM chat_logs');
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
      await pool.query('TRUNCATE products, custom_portfolio, orders, sales, faqs, testimonials, chat_logs, metrics');
      await seedIfEmpty();
      return initialSnapshot();
    },
  };
}

export const db = env.databaseUrl
  ? createPostgresDriver(env.databaseUrl)
  : createJsonDriver();
