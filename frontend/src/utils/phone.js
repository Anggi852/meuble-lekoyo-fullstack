export const ID_PHONE_REGEX = /^(?:\+?62|0)8[1-9][0-9\s-]{7,15}$/;

export function normalizePhone(raw = '') {
  return String(raw || '').trim().replace(/[\s-]+/g, '');
}

export function isValidIndonesianPhone(raw = '') {
  return ID_PHONE_REGEX.test(String(raw || '').trim());
}

export function toWhatsAppNumber(raw = '') {
  const clean = normalizePhone(raw).replace(/^\+/, '');
  if (!clean) return '';
  if (clean.startsWith('0')) return `62${clean.slice(1)}`;
  if (clean.startsWith('62')) return clean;
  return clean;
}

export function buildCustomerWhatsAppReplyLink(order) {
  const waNum = toWhatsAppNumber(order.phone);
  if (!waNum) return '';
  const text = [
    `Halo ${order.name}, saya Pak Nanang dari *Meuble Le'Koyo* Jambi.`,
    `Terkait pengajuan pesanan Anda untuk *${order.product}* (${order.quantity} unit, pembayaran ${order.payment}), apakah pesanan ini jadi diproses?`,
    'Silakan konfirmasi detail ukuran, alamat, serta kesepakatan harga/DP di chat ini ya. Terima kasih.',
  ].join('\n\n');
  return `https://wa.me/${waNum}?text=${encodeURIComponent(text)}`;
}
