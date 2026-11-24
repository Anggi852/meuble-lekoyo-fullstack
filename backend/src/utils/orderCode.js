import crypto from 'crypto';

/**
 * Menghasilkan ID pemesanan unik, contoh: MLK-261124-A4F2
 */
export function generateOrderCode() {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const rand = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `MLK-${yy}${mm}${dd}-${rand}`;
}