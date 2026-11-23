import axios from 'axios';
import { env } from '../config/env.js';
import { db } from '../db/index.js';

export async function buildAnalyticsSummary() {
  const [products, customPortfolio, orders, sales, chatLogs, metrics] = await Promise.all([
    db.getProducts(),
    db.getCustomPortfolio(),
    db.getOrders(),
    db.getSales(),
    db.getChatLogs(),
    db.getMetrics(),
  ]);

  const priceOf = (id) => products.find((p) => p.id === Number(id))?.price || 0;
  const doneOrders = orders.filter((o) => o.status === 'Selesai');

  const onlineUnits = doneOrders
    .filter((o) => o.productId !== null && o.productId !== undefined)
    .reduce((sum, o) => sum + (Number(o.quantity) || 0), 0);
  const customUnits = doneOrders
    .filter((o) => Boolean(o.custom))
    .reduce((sum, o) => sum + (Number(o.quantity) || 0), 0);
  const offlineUnits = sales.reduce((sum, s) => sum + (Number(s.quantity) || 0), 0);

  const revenue =
    doneOrders
      .filter((o) => o.productId !== null && o.productId !== undefined)
      .reduce((sum, o) => sum + (Number(o.total) || 0), 0) +
    sales.reduce((sum, s) => sum + (Number(s.quantity) || 0) * priceOf(s.productId), 0);

  // Distribusi intent chat Koyo
  const intentCounts = {};
  chatLogs.forEach((c) => {
    const k = c.intent || 'lainnya';
    intentCounts[k] = (intentCounts[k] || 0) + 1;
  });
  const topIntents = Object.entries(intentCounts)
    .map(([intent, count]) => ({ intent, count }))
    .sort((a, b) => b.count - a.count);

  // Preferensi pembayaran Tunai vs Tabung
  const paymentPreference = { Tunai: 0, Tabung: 0 };
  orders.forEach((o) => {
    if (/tabung/i.test(o.payment)) paymentPreference.Tabung += 1;
    else paymentPreference.Tunai += 1;
  });

  // Kategori paling sering dilihat & terjual
  const views = metrics.views || {};
  const categoryStats = {};
  products.forEach((p) => {
    const cat = p.category;
    categoryStats[cat] = categoryStats[cat] || { category: cat, views: 0, unitsSold: 0, products: 0 };
    categoryStats[cat].products += 1;
    categoryStats[cat].views += Number(views[String(p.id)]) || 0;
  });
  sales.forEach((s) => {
    const p = products.find((x) => x.id === Number(s.productId));
    if (p && categoryStats[p.category]) categoryStats[p.category].unitsSold += Number(s.quantity) || 0;
  });
  doneOrders.forEach((o) => {
    const p = products.find((x) => x.id === Number(o.productId));
    if (p && categoryStats[p.category]) categoryStats[p.category].unitsSold += Number(o.quantity) || 0;
  });

  // Status layanan Data Science eksternal (jika dikonfigurasi)
  let dsInsights = null;
  let dsStatus = {
    configured: Boolean(env.streamlitDashboardUrl || env.dsApiUrl),
    streamlitUrl: env.streamlitDashboardUrl || null,
    apiConnected: false,
    message: env.streamlitDashboardUrl
      ? 'Dasbor Streamlit terhubung dan siap ditampilkan.'
      : 'URL Streamlit belum diisi di .env — menampilkan ringkasan analitik live dari database.',
  };

  if (env.dsApiUrl) {
    try {
      const { data } = await axios.get(`${env.dsApiUrl}/insights`, { timeout: 6000 });
      dsInsights = data;
      dsStatus.apiConnected = true;
      dsStatus.message = 'Terhubung langsung ke API Data Science.';
    } catch (err) {
      dsStatus.apiConnected = false;
      dsStatus.message = `Layanan API Data Science sedang tidak dapat dijangkau (${err.code || 'offline'}). Menampilkan analitik langsung dari database toko.`;
    }
  }

  return {
    databaseMode: db.mode,
    kpi: {
      visits: Number(metrics.visits) || 0,
      totalViews: Object.values(views).reduce((a, b) => a + (Number(b) || 0), 0),
      totalProducts: products.length,
      totalCustomPortfolio: customPortfolio.length,
      totalOrders: orders.length,
      newOrders: orders.filter((o) => o.status === 'Menunggu Konfirmasi WA' || o.status === 'Baru').length,
      totalChats: chatLogs.length,
      unitsSold: onlineUnits + customUnits + offlineUnits,
      onlineUnits,
      customUnits,
      offlineUnits,
      estimatedRevenue: revenue,
    },
    paymentPreference,
    topIntents,
    categoryBreakdown: Object.values(categoryStats).sort((a, b) => b.views + b.unitsSold * 5 - (a.views + a.unitsSold * 5)),
    dsStatus,
    dsInsights,
  };
}
