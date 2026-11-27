export const DEFAULT_PAYMENT_SETTINGS = {
  accounts: [],
  qrisImage: '',
  cashNote:
    "Pembayaran tunai dapat dibayarkan langsung di showroom Meuble Le'Koyo (Telanaipura, Kota Jambi) atau transfer penuh sesuai nominal tagihan.",
  tabungNote:
    'Sistem Tabung fleksibel: Anda dapat menyetor bertahap sesuai kemampuan. Setiap setoran yang terverifikasi otomatis mengurangi sisa tagihan hingga LUNAS.',
};

export function getPaymentSummary(order) {
  const bill =
    order?.finalPrice !== null && order?.finalPrice !== undefined && Number(order.finalPrice) > 0
      ? Number(order.finalPrice)
      : 0;
  const rawRecords = Array.isArray(order?.paymentRecords) ? order.paymentRecords : [];

  // Urutkan kronologis dari setoran paling awal agar perhitungan sisa berjalan akurat
  const records = [...rawRecords].sort((a, b) => {
    const ta = new Date(a?.createdAt || a?.date || 0).getTime() || Number(a?.id) || 0;
    const tb = new Date(b?.createdAt || b?.date || 0).getTime() || Number(b?.id) || 0;
    return ta - tb;
  });

  let runningPaid = 0;
  let verifiedStep = 0;

  const ledger = records.map((r) => {
    const amt = Number(r?.amount) || 0;
    if (r?.status === 'Terverifikasi') {
      verifiedStep += 1;
      runningPaid += amt;
      const balanceAfter = Math.max(0, bill - runningPaid);
      return {
        ...r,
        amount: amt,
        stepNumber: verifiedStep,
        runningPaid,
        balanceAfter,
      };
    }
    return {
      ...r,
      amount: amt,
      stepNumber: null,
      runningPaid,
      balanceAfter: null,
    };
  });

  const verifiedRecords = ledger.filter((r) => r.status === 'Terverifikasi');
  const pendingRecords = ledger.filter((r) => r.status === 'Menunggu Verifikasi');
  const rejectedRecords = ledger.filter((r) => r.status === 'Ditolak');

  const paidAmount = runningPaid;
  const pendingAmount = pendingRecords.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  const remaining = Math.max(0, bill - paidAmount);
  const percent = bill > 0 ? Math.min(100, Math.round((paidAmount / bill) * 100)) : 0;
  const isPaidOff = bill > 0 && remaining === 0;
  const isTabung = String(order?.payment || '').toLowerCase().includes('tabung');

  let statusLabel = 'Belum Bayar';
  if (bill <= 0) statusLabel = 'Menunggu Harga Final';
  else if (isPaidOff) statusLabel = 'Lunas';
  else if (paidAmount > 0) statusLabel = isTabung ? 'Menabung' : 'Terbayar Sebagian';
  else if (pendingAmount > 0) statusLabel = 'Menunggu Verifikasi';

  return {
    bill,
    records,
    ledger,
    verifiedRecords,
    pendingRecords,
    rejectedRecords,
    paidAmount,
    pendingAmount,
    remaining,
    percent,
    isPaidOff,
    isTabung,
    statusLabel,
  };
}