import axios from 'axios';
import { env } from '../config/env.js';
import { db } from '../db/index.js';
import { generateFallbackKoyoReply } from './koyoFallbackEngine.js';

/**
 * Mengakses layanan Gen AI (FastAPI / Flask tim Gen AI) melalui Backend.
 * - Tidak pernah dipanggil langsung dari Frontend.
 * - Menangani timeout, kuota API (429), atau layanan sedang tidak aktif secara jelas & aman.
 * - Menyimpan setiap riwayat percakapan (pertanyaan, jawaban, intent, sumber) ke database persisten.
 */
export async function processKoyoChat({ message, activeProductId = null, sessionId = 'web-guest' }) {
  const [products, faqs] = await Promise.all([db.getProducts(), db.getFaqs()]);
  const activeProduct = activeProductId
    ? products.find((p) => p.id === Number(activeProductId)) || null
    : null;

  let reply = null;
  let source = 'backend-engine';
  let warning = null;

  if (env.genaiApiUrl) {
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (env.genaiApiKey) headers['x-api-key'] = env.genaiApiKey;

      const { data } = await axios.post(
        `${env.genaiApiUrl}/chat`,
        {
          message,
          session_id: sessionId,
          active_product: activeProduct
            ? { id: activeProduct.id, name: activeProduct.name, category: activeProduct.category, price: activeProduct.price }
            : null,
        },
        { timeout: env.genaiTimeoutMs, headers },
      );

      // Dukungan fleksibel untuk variasi format response FastAPI/Flask tim Gen AI
      const aiText = data?.reply || data?.answer || data?.text || data?.response;
      if (aiText && typeof aiText === 'string') {
        const recommendedIds = Array.isArray(data.product_ids) ? data.product_ids.map(Number) : [];
        const matchedProducts = recommendedIds.length > 0
          ? products.filter((p) => recommendedIds.includes(p.id)).slice(0, 3)
          : undefined;

        reply = {
          intent: data.intent || 'info_produk',
          text: aiText,
          products: matchedProducts?.length ? matchedProducts : data.products,
          actions: data.actions,
          quickReplies: data.quickReplies || data.quick_replies || ['Lihat produk unggulan', 'Cara sistem tabung', 'Pesan custom'],
          wa: Boolean(data.wa || data.intent === 'keluhan' || data.intent === 'out_of_scope'),
          startOrder: Boolean(data.startOrder || data.start_order),
        };
        source = 'genai-api';
      }
    } catch (err) {
      const status = err.response?.status;
      if (err.code === 'ECONNABORTED') {
        warning = 'Layanan AI sedang lambat merespons; dialihkan otomatis ke asisten cadangan toko.';
      } else if (status === 429) {
        warning = 'Kuota layanan AI generatif sedang penuh; dialihkan otomatis ke asisten cadangan toko.';
      } else {
        warning = 'Layanan AI eksternal sedang tidak aktif; menggunakan asisten cadangan toko.';
      }
      console.warn(`[GenAI Proxy Fallback] ${err.message}`);
    }
  }

  if (!reply) {
    reply = generateFallbackKoyoReply(message, { products, faqs, activeProduct });
  }

  // Simpan riwayat percakapan & hasil layanan AI ke database persisten
  const savedLog = await db.createChatLog({
    user: 'Pengunjung',
    message,
    reply: reply.text,
    intent: reply.intent || 'lainnya',
    source,
  });

  return {
    ...reply,
    source,
    warning,
    log: savedLog,
  };
}
