import { STORE } from '../data/store';

export const WA_BASE = `https://wa.me/${STORE.phoneRaw}`;

export function buildWhatsAppLink(order) {
  const text = [
    'Halo Pak Nanang, saya ingin mengonfirmasi pengajuan pesanan:',
    '',
    `*Nama:* ${order.name}`,
    order.phone ? `*No. WhatsApp:* ${order.phone}` : null,
    `*Alamat:* ${order.address}`,
    `*Produk:* ${order.product}`,
    `*Jumlah:* ${order.quantity}`,
    `*Pembayaran:* ${order.payment}`,
    '',
    'Mohon konfirmasi ketersediaan, total harga, serta DP/jadwal pembuatan (±2 bulan). Terima kasih.',
  ]
    .filter((l) => l !== null)
    .join('\n');
  return `${WA_BASE}?text=${encodeURIComponent(text)}`;
}

export function buildCustomSummaryText({ spec, order }) {
  const lines = [
    'Halo Pak Nanang, saya ingin mengonfirmasi pengajuan *FURNITUR CUSTOM KAYU JATI*:',
    '',
    `*Jenis / Model:* ${spec.title}`,
    `*Dimensi:* ${spec.size}`,
    spec.wood ? `*Konstruksi Kayu:* ${spec.wood}` : null,
    `*Finishing:* ${spec.finish}`,
    `*Detail Spesifikasi:*`,
    ...(spec.detailsList && spec.detailsList.length > 0
      ? spec.detailsList.map((d) => `  • ${d}`)
      : [`  • ${spec.options}`]),
    order?.note ? `*Catatan Tambahan:* ${order.note}` : null,
    order?.quantity ? `*Jumlah:* ${order.quantity} unit` : null,
    order?.needBy ? `*Dibutuhkan sebelum:* ${order.needBy}` : '*Target selesai:* Fleksibel (±2 bulan)',
    '',
    order?.name ? `*Nama Pemesan:* ${order.name}` : null,
    order?.phone ? `*No. WhatsApp:* ${order.phone}` : null,
    order?.city ? `*Kota/Provinsi:* ${order.city}` : null,
    order?.address ? `*Alamat Pengiriman:* ${order.address}` : null,
    order?.payment ? `*Rencana Pembayaran:* ${order.payment}` : null,
    order?.photoCount > 0
      ? `\n_(Saya juga menyiapkan ${order.photoCount} foto/sketsa referensi yang akan saya kirim langsung di chat ini)_`
      : order?.hasPhoto
      ? '\n_(Foto/sketsa referensi saya kirim langsung di chat ini)_'
      : null,
    '',
    'Mohon konfirmasi apakah rancangan ini bisa dibuat, estimasi harga akhir, DP/sistem tabung, dan jadwal pembuatannya (±2 bulan). Terima kasih.',
  ].filter((l) => l !== null);
  return lines.join('\n');
}

export function buildCustomWhatsAppLink({ spec, order }) {
  return `${WA_BASE}?text=${encodeURIComponent(buildCustomSummaryText({ spec, order }))}`;
}
