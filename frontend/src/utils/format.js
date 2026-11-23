export const formatRupiah = (value) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);

// Status buka/tutup toko berdasarkan jam WIB (Senin-Sabtu 08.00-17.00)
export function getShopStatus(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jakarta', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(now);
  const get = (t) => parts.find((p) => p.type === t)?.value;
  const day = get('weekday');
  const minutes = parseInt(get('hour'), 10) * 60 + parseInt(get('minute'), 10);
  const open = day !== 'Sun' && minutes >= 8 * 60 && minutes < 17 * 60;
  return open
    ? { open: true, label: 'Buka sekarang, tutup 17.00 WIB' }
    : { open: false, label: day === 'Sun' ? 'Tutup hari ini, buka Senin 08.00 WIB' : 'Sedang tutup, buka 08.00 WIB' };
}

export const safeGet = (key, storage = 'local') => {
  try { return (storage === 'local' ? localStorage : sessionStorage).getItem(key); } catch { return null; }
};
export const safeSet = (key, value, storage = 'local') => {
  try { (storage === 'local' ? localStorage : sessionStorage).setItem(key, value); } catch { /* abaikan */ }
};
