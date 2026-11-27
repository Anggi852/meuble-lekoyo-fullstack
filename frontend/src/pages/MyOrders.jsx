import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  ClipboardList,
  Crown,
  RefreshCw,
  MapPin,
  MessageCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowRight,
  Star,
  Camera,
  ZoomIn,
  X,
  Wallet,
  Receipt,
  Upload,
  Copy,
  Check,
  Building2,
  QrCode,
  AlertCircle,
} from 'lucide-react';
import Modal from '../components/Modal';
import PaymentReceiptModal from '../components/PaymentReceiptModal';
import { useApp } from '../context/AppContext';
import { extractApiError } from '../services/api';
import { WA_BASE } from '../services/whatsapp';
import { formatRupiah } from '../utils/format';
import { compressImageFile } from '../utils/image';
import { getPaymentSummary } from '../utils/payment';

const STATUS_STYLE = {
  'Menunggu Harga Owner': 'bg-amber-100 text-amber-800 border-amber-300',
  'Harga Ditetapkan': 'bg-blue-100 text-blue-800 border-blue-300',
  'Menunggu Konfirmasi WA': 'bg-amber-100 text-amber-800 border-amber-300',
  Diproses: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  Selesai: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  Dibatalkan: 'bg-red-100 text-red-700 border-red-300',
};

const PAYMENT_BADGE = {
  Terverifikasi: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  'Menunggu Verifikasi': 'bg-amber-100 text-amber-800 border-amber-300',
  Ditolak: 'bg-red-100 text-red-700 border-red-300',
};

export default function MyOrders() {
  const {
    user,
    isOwner,
    myOrders,
    loadMyOrders,
    loginWithGoogle,
    testimonials,
    submitOrderReview,
    submitOrderPayment,
    paymentSettings,
  } = useApp();

  const [refreshing, setRefreshing] = useState(false);
  const [reviewOrder, setReviewOrder] = useState(null);
  const [rating, setRating] = useState(5);
  const [city, setCity] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [sendingReview, setSendingReview] = useState(false);
  const [zoomPhoto, setZoomPhoto] = useState(null);

  // State Modal Pembayaran / Setoran Tabungan
  const [payOrder, setPayOrder] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('Transfer Bank');
  const [payAccountLabel, setPayAccountLabel] = useState('');
  const [payDate, setPayDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [payNote, setPayNote] = useState('');
  const [payProof, setPayProof] = useState('');
  const [uploadingProof, setUploadingProof] = useState(false);
  const [submittingPay, setSubmittingPay] = useState(false);
  const [copiedAcc, setCopiedAcc] = useState('');

  // State Modal Kwitansi / Bukti Pelunasan
  const [receiptOrder, setReceiptOrder] = useState(null);

  useEffect(() => {
    if (user && !isOwner) {
      loadMyOrders();
    }
  }, [user, isOwner, loadMyOrders]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadMyOrders();
    setRefreshing(false);
    toast.success('Daftar pesanan diperbarui.');
  };

  const handleGoogleSuccess = async (res) => {
    try {
      await loginWithGoogle(res.credential);
      toast.success('Berhasil masuk dengan Google.');
    } catch (err) {
      toast.error(extractApiError(err, 'Gagal masuk dengan Google.'));
    }
  };

  const openPayModal = (order) => {
    const summary = getPaymentSummary(order);
    const accounts = paymentSettings?.accounts || [];
    const defaultAcc = accounts[0]
      ? `${accounts[0].bankName} - ${accounts[0].accountNumber}`
      : '';
    setPayOrder(order);
    setPayAmount(summary.remaining > 0 ? String(summary.remaining) : '');
    setPayMethod(accounts.length > 0 ? 'Transfer Bank' : paymentSettings?.qrisImage ? 'QRIS' : 'Transfer Bank');
    setPayAccountLabel(defaultAcc);
    setPayDate(new Date().toISOString().slice(0, 10));
    setPayNote(
      summary.isTabung
        ? `Setoran Tabungan ke-${summary.records.filter((r) => r.status !== 'Ditolak').length + 1}`
        : 'Pembayaran Tunai',
    );
    setPayProof('');
  };

  const handleProofFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('File bukti pembayaran harus berupa gambar.');
      return;
    }
    setUploadingProof(true);
    try {
      const dataUrl = await compressImageFile(file);
      setPayProof(dataUrl);
      toast.success('Foto bukti pembayaran siap dikirim.');
    } catch (err) {
      toast.error(err.message || 'Gagal memproses gambar bukti pembayaran.');
    } finally {
      setUploadingProof(false);
    }
  };

  const handleCopyAccount = (accNumber) => {
    navigator.clipboard?.writeText(accNumber);
    setCopiedAcc(accNumber);
    toast.success(`Nomor rekening ${accNumber} disalin.`);
    setTimeout(() => setCopiedAcc(''), 2000);
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    if (!payOrder) return;
    const numericAmount = Number(String(payAmount).replace(/[^\d]/g, ''));
    if (!numericAmount || numericAmount < 1000) {
      toast.error('Masukkan nominal pembayaran minimal Rp 1.000.');
      return;
    }
    if (payMethod !== 'Tunai di Toko' && !payProof) {
      toast.error('Unggah foto bukti transfer / pembayaran QRIS terlebih dahulu.');
      return;
    }
    setSubmittingPay(true);
    try {
      await submitOrderPayment(payOrder.id, {
        amount: numericAmount,
        date: payDate,
        method: payMethod,
        accountLabel: payMethod === 'Transfer Bank' ? payAccountLabel : '',
        note: payNote.trim(),
        proofImage: payProof,
      });
      toast.success('Bukti pembayaran terkirim! Menunggu verifikasi Pak Nanang.');
      setPayOrder(null);
    } catch {
      // Error sudah ditangani di AppContext
    } finally {
      setSubmittingPay(false);
    }
  };

  const openReviewModal = (order) => {
    const guessedCity = String(order.address || '').split(',').pop().trim().slice(0, 50);
    setReviewOrder(order);
    setRating(5);
    setCity(guessedCity || 'Jambi');
    setReviewText('');
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (reviewText.trim().length < 5) {
      toast.error('Tuliskan ulasan minimal 5 karakter.');
      return;
    }
    setSendingReview(true);
    try {
      await submitOrderReview({
        orderId: reviewOrder.id,
        rating,
        city: city.trim(),
        text: reviewText.trim(),
      });
      toast.success('Terima kasih! Ulasan Anda sudah tampil.');
      setReviewOrder(null);
    } catch {
      // Pesan error sudah ditampilkan lewat toast di AppContext
    } finally {
      setSendingReview(false);
    }
  };

  const buildWaLink = (order) => {
    const summary = getPaymentSummary(order);
    const est = Number(order.estimatedPrice ?? order.total) || 0;
    const hargaText =
      order.finalPrice != null
        ? `Harga Final Owner: ${formatRupiah(order.finalPrice)} (Terbayar: ${formatRupiah(summary.paidAmount)}, Sisa: ${formatRupiah(summary.remaining)})`
        : est > 0
          ? `Estimasi Awal: ${formatRupiah(est)}`
          : 'Harga: Menunggu konfirmasi Owner';
    const text = [
      `Halo Pak Nanang, saya ingin konfirmasi pesanan saya:`,
      `• Kode Pesanan: ${order.orderCode || `#${order.id}`}`,
      `• Produk: ${order.product} (${order.quantity} unit)`,
      `• Sistem Bayar: ${order.payment}`,
      `• ${hargaText}`,
      `• Status: ${order.status}`,
    ].join('\n');
    const sep = WA_BASE.includes('?') ? '&' : '?';
    return `${WA_BASE}${sep}text=${encodeURIComponent(text)}`;
  };

  if (isOwner) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
        <div className="rounded-3xl border border-gold/35 bg-sand/60 p-8 shadow-soft">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-espresso text-gold-light">
            <Crown size={28} className="text-gold" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-espresso sm:text-3xl">
            Halaman Khusus Pelanggan
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Anda sedang login sebagai Owner. Untuk memantau, menetapkan harga final, memverifikasi setoran tabungan, dan mengelola pesanan masuk, silakan buka Dashboard Owner.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/admin" className="btn-primary text-sm">
              <Crown size={16} className="text-gold-light" /> Buka Dashboard Owner
            </Link>
            <Link to="/" className="btn-soft text-sm">
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
        <div className="rounded-3xl border border-gold/30 bg-sand/60 p-8 shadow-soft">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-espresso text-gold-light">
            <ClipboardList size={28} />
          </div>
          <h1 className="font-heading text-2xl font-bold text-espresso sm:text-3xl">
            Pesanan Saya
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Masuk dengan akun Google Anda untuk melihat riwayat pesanan, sisa tagihan Sistem Tabung, unggah bukti pembayaran, dan unduh bukti pelunasan.
          </p>
          <div className="mt-6 flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => toast.error('Login Google dibatalkan atau gagal.')}
              shape="pill"
              text="signin_with"
              locale="id"
            />
          </div>
        </div>
      </section>
    );
  }

  const payOrderSummary = payOrder ? getPaymentSummary(payOrder) : null;

  return (
    <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold-dark">
            Riwayat &amp; Pelacak Pembayaran
          </p>
          <h1 className="font-heading mt-1 text-2xl font-bold text-espresso sm:text-3xl">
            Pesanan Saya
          </h1>
          <p className="mt-1 text-sm text-muted">
            Akun aktif: <span className="font-semibold text-espresso">{user.email || user.name}</span>
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          className="btn-soft !min-h-[42px] text-sm"
        >
          <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Memuat...' : 'Segarkan Status'}
        </button>
      </div>

      {myOrders.length === 0 ? (
        <div className="rounded-3xl border border-line bg-sand/50 p-10 text-center">
          <Sparkles size={32} className="mx-auto text-gold-dark" />
          <h2 className="font-heading mt-3 text-xl font-bold text-espresso">
            Belum ada pesanan tercatat
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Pesanan yang Anda ajukan saat sudah login Google akan otomatis muncul di sini lengkap dengan rincian tagihan, setoran Sistem Tabung, dan bukti pelunasan.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/catalog" className="btn-primary text-sm">
              Jelajahi Katalog <ArrowRight size={16} />
            </Link>
            <Link to="/custom" className="btn-soft text-sm">
              Rancang Custom
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {myOrders.map((order) => {
            const badgeClass =
              STATUS_STYLE[order.status] || 'bg-sand text-espresso border-line';
            const hasFinalPrice = order.finalPrice !== null && order.finalPrice !== undefined && Number(order.finalPrice) > 0;
            const estPrice = Number(order.estimatedPrice ?? order.total) || 0;
            const isDone = order.status === 'Selesai';
            const isCancelled = order.status === 'Dibatalkan';
            const existingReview = testimonials.find((t) => Number(t.orderId) === Number(order.id));
            const paySummary = getPaymentSummary(order);

            return (
              <article
                key={order.id}
                className="rounded-2xl border border-gold/25 bg-cream p-5 shadow-soft transition hover:border-gold/50 sm:p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-lg bg-espresso px-2.5 py-1 font-mono text-xs font-bold tracking-wider text-gold-light">
                        {order.orderCode || `#${order.id}`}
                      </span>
                      <span className={`rounded-full border px-3 py-0.5 text-xs font-semibold ${badgeClass}`}>
                        {order.status}
                      </span>
                      {hasFinalPrice && (
                        <span
                          className={`rounded-full px-3 py-0.5 text-xs font-bold ${
                            paySummary.isPaidOff
                              ? 'bg-emerald-600 text-white'
                              : paySummary.paidAmount > 0
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-white text-muted border border-line'
                          }`}
                        >
                          {paySummary.isPaidOff
                            ? 'LUNAS'
                            : paySummary.isTabung
                              ? `Tabungan ${paySummary.percent}%`
                              : paySummary.statusLabel}
                        </span>
                      )}
                    </div>
                    <h2 className="font-heading mt-2 text-lg font-bold text-espresso">
                      {order.product}
                    </h2>
                    <p className="text-xs text-muted">
                      Jumlah: {order.quantity} unit • Sistem: <strong className="text-bark">{order.payment}</strong>
                      {order.createdAt && (
                        <> • {new Date(order.createdAt).toLocaleDateString('id-ID', { dateStyle: 'medium' })}</>
                      )}
                    </p>
                  </div>

                  <div className="text-left sm:text-right">
                    {hasFinalPrice ? (
                      <>
                        <p className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                          <CheckCircle2 size={14} /> Harga Final Owner
                        </p>
                        <p className="font-heading text-xl font-bold text-espresso">
                          {formatRupiah(order.finalPrice)}
                        </p>
                        {estPrice > 0 && estPrice !== order.finalPrice && (
                          <p className="text-xs text-muted line-through">
                            Estimasi awal: {formatRupiah(estPrice)}
                          </p>
                        )}
                      </>
                    ) : isDone ? (
                      <>
                        <p className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                          <CheckCircle2 size={14} /> Pesanan Selesai
                        </p>
                        <p className="font-heading text-base font-bold text-espresso">
                          {estPrice > 0 ? formatRupiah(estPrice) : 'Disepakati via WA'}
                        </p>
                      </>
                    ) : isCancelled ? (
                      <p className="inline-flex items-center gap-1 text-xs font-semibold text-red-600">
                        <XCircle size={14} /> Pesanan Dibatalkan
                      </p>
                    ) : (
                      <>
                        <p className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700">
                          <Clock size={14} /> Menunggu Harga Owner
                        </p>
                        <p className="font-heading text-lg font-bold text-espresso">
                          {estPrice > 0 ? `Est. ${formatRupiah(estPrice)}` : 'Harga via Owner'}
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* ==================== PELACAK PEMBAYARAN & SISTEM TABUNG ==================== */}
                {hasFinalPrice && !isCancelled && (
                  <div className="mt-4 rounded-2xl border border-gold/35 bg-white p-4 shadow-soft">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-teak">
                          <Wallet size={14} className="text-gold-dark" />
                          {paySummary.isTabung
                            ? 'Rincian Sistem Tabung & Sisa Tagihan'
                            : 'Status Pembayaran Tunai'}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {!paySummary.isPaidOff && (
                          <button
                            type="button"
                            onClick={() => openPayModal(order)}
                            className="btn-primary !min-h-[36px] !px-3.5 text-xs"
                          >
                            <Upload size={13} className="text-gold-light" />
                            {paySummary.isTabung ? 'Setor Tabungan / Upload Bukti' : 'Bayar & Upload Bukti'}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setReceiptOrder(order)}
                          className="btn-soft !min-h-[36px] !px-3.5 text-xs"
                        >
                          <Receipt size={13} className="text-gold-dark" />
                          {paySummary.isPaidOff ? 'Bukti Pelunasan' : 'Kwitansi Pembayaran'}
                        </button>
                      </div>
                    </div>

                    {/* Ringkasan Angka: Total | Terbayar | Sisa */}
                    <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-sand/55 p-3 text-center sm:text-left">
                      <div>
                        <p className="text-[11px] font-medium text-muted">Total Tagihan</p>
                        <p className="text-sm font-bold text-espresso sm:text-base">
                          {formatRupiah(paySummary.bill)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] font-medium text-muted">Sudah Dibayar</p>
                        <p className="text-sm font-bold text-emerald-700 sm:text-base">
                          {formatRupiah(paySummary.paidAmount)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] font-medium text-muted">Sisa Tagihan</p>
                        <p
                          className={`text-sm font-extrabold sm:text-base ${
                            paySummary.isPaidOff ? 'text-emerald-700' : 'text-teak'
                          }`}
                        >
                          {paySummary.isPaidOff ? 'Rp 0 (LUNAS)' : formatRupiah(paySummary.remaining)}
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-3">
                      <div className="mb-1 flex justify-between text-xs font-semibold">
                        <span className="text-muted">Progres Pembayaran</span>
                        <span className={paySummary.isPaidOff ? 'text-emerald-700' : 'text-espresso'}>
                          {paySummary.percent}%
                        </span>
                      </div>
                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-sand">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            paySummary.isPaidOff ? 'bg-emerald-600' : 'bg-gold-dark'
                          }`}
                          style={{ width: `${paySummary.percent}%` }}
                        />
                      </div>
                      {paySummary.pendingAmount > 0 && (
                        <p className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-amber-700">
                          <Clock size={12} /> Menunggu verifikasi Owner sebesar{' '}
                          <strong>{formatRupiah(paySummary.pendingAmount)}</strong>
                        </p>
                      )}
                    </div>

                    {/* Riwayat Setoran / Pembayaran */}
                    {paySummary.records.length > 0 && (
                      <div className="mt-3.5 border-t border-line/70 pt-3">
                        <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted">
                          Riwayat Pembayaran / Setoran ({paySummary.records.length})
                        </p>
                        <div className="space-y-2">
                          {paySummary.records.map((rec, idx) => (
                            <div
                              key={rec.id || idx}
                              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line/80 bg-cream/70 px-3 py-2 text-xs"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className="font-bold text-espresso">
                                    {formatRupiah(rec.amount)}
                                  </span>
                                  <span className="text-muted">· {rec.method}</span>
                                  <span
                                    className={`rounded-full border px-2 py-0.5 text-[10.5px] font-bold ${
                                      PAYMENT_BADGE[rec.status] || 'bg-sand text-bark'
                                    }`}
                                  >
                                    {rec.status}
                                  </span>
                                </div>
                                <p className="mt-0.5 text-muted">
                                  {rec.date || (rec.createdAt || '').slice(0, 10)}
                                  {rec.note ? ` · ${rec.note}` : ''}
                                </p>
                                {rec.status === 'Ditolak' && rec.rejectReason && (
                                  <p className="mt-0.5 font-medium text-red-600">
                                    Alasan ditolak: {rec.rejectReason}
                                  </p>
                                )}
                              </div>

                              {rec.proofImage && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setZoomPhoto({
                                      src: rec.proofImage,
                                      label: `Bukti Bayar ${formatRupiah(rec.amount)} (${rec.date})`,
                                    })
                                  }
                                  className="inline-flex items-center gap-1 rounded-lg border border-line bg-white px-2.5 py-1 font-semibold text-teak hover:border-gold"
                                >
                                  <ZoomIn size={12} /> Bukti
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                      Alamat Pengiriman
                    </p>
                    <p className="mt-0.5 text-espresso">{order.address}</p>
                    {order.latitude != null && order.longitude != null && (
                      <a
                        href={`https://www.google.com/maps?q=${order.latitude},${order.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-teak underline"
                      >
                        <MapPin size={13} /> Lihat Titik Maps
                      </a>
                    )}
                  </div>

                  {order.ownerNote && (
                    <div className="rounded-xl border border-gold/30 bg-sand/60 p-3">
                      <p className="text-xs font-bold uppercase tracking-wider text-gold-dark">
                        Catatan dari Pak Nanang
                      </p>
                      <p className="mt-1 text-sm text-espresso">{order.ownerNote}</p>
                    </div>
                  )}
                </div>

                {Array.isArray(order.finishedPhotos) && order.finishedPhotos.length > 0 && (
                  <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/50 p-3.5">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-800">
                        <Camera size={14} /> Foto Produk yang Sudah Jadi ({order.finishedPhotos.length})
                      </p>
                      {order.publishedPortfolioId && (
                        <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-semibold text-teak shadow-soft">
                          Tampil di Galeri Karya Custom
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {order.finishedPhotos.map((ph, idx) => (
                        <button
                          key={`${ph.url?.slice(0, 24)}-${idx}`}
                          type="button"
                          onClick={() => setZoomPhoto({ src: ph.url, label: ph.label || `Hasil Jadi ${idx + 1}` })}
                          className="group relative overflow-hidden rounded-xl border border-white bg-sand shadow-soft"
                        >
                          <img
                            src={ph.url}
                            alt={ph.label || `Foto hasil jadi ${idx + 1}`}
                            className="aspect-[4/3] w-full object-cover transition duration-300 group-hover:scale-105"
                          />
                          <span className="absolute inset-0 grid place-items-center bg-espresso/0 text-white opacity-0 transition group-hover:bg-espresso/40 group-hover:opacity-100">
                            <ZoomIn size={18} />
                          </span>
                          <span className="absolute bottom-1 left-1 rounded-full bg-espresso/80 px-2 py-0.5 text-[10px] font-semibold text-cream">
                            {ph.label || `Foto ${idx + 1}`}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {existingReview && (
                  <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800">
                        <CheckCircle2 size={14} /> Ulasan Anda Terkirim
                      </span>
                      <span className="flex gap-0.5 text-gold">
                        {[...Array(5)].map((_, k) => (
                          <Star
                            key={k}
                            size={13}
                            fill={k < existingReview.rating ? 'currentColor' : 'none'}
                            className={k < existingReview.rating ? 'text-gold' : 'text-line'}
                          />
                        ))}
                      </span>
                    </div>
                    <p className="mt-1 italic text-bark">"{existingReview.text}"</p>
                  </div>
                )}

                <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-line pt-4">
                  {isDone && !existingReview && (
                    <button
                      type="button"
                      onClick={() => openReviewModal(order)}
                      className="btn-soft !min-h-[40px] !px-4 text-xs sm:text-sm"
                    >
                      <Star size={15} className="text-gold-dark" /> Beri Ulasan
                    </button>
                  )}
                  <a
                    href={buildWaLink(order)}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-primary !min-h-[40px] !px-4 text-xs sm:text-sm"
                  >
                    <MessageCircle size={15} className="text-gold-light" /> Konfirmasi via WhatsApp
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* ==================== MODAL SETOR TABUNGAN / BAYAR TUNAI ==================== */}
      <AnimatePresence>
        {payOrder && payOrderSummary && (
          <Modal
            title={
              payOrderSummary.isTabung
                ? 'Setor Sistem Tabung & Upload Bukti'
                : 'Pembayaran & Upload Bukti Transfer'
            }
            onClose={() => setPayOrder(null)}
          >
            <div className="space-y-4">
              <div className="rounded-xl bg-cream p-3.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-teak">{payOrder.orderCode}</span>
                  <span className="font-bold text-espresso">{payOrder.payment}</span>
                </div>
                <p className="mt-1 font-semibold text-espresso">{payOrder.product}</p>
                <p className="mt-1 text-muted">
                  Sisa tagihan saat ini:{' '}
                  <strong className="text-teak">{formatRupiah(payOrderSummary.remaining)}</strong>{' '}
                  (dari total {formatRupiah(payOrderSummary.bill)})
                </p>
              </div>

              {/* Info Rekening / QRIS yang Diatur Owner dari Dashboard */}
              {(paymentSettings?.accounts?.length > 0 || paymentSettings?.qrisImage) ? (
                <div className="space-y-2.5 rounded-xl border border-gold/35 bg-sand/45 p-3.5 text-xs">
                  <p className="font-bold uppercase tracking-wider text-espresso">
                    Tujuan Pembayaran Resmi Meuble Le&apos;Koyo
                  </p>
                  {paymentSettings.accounts?.map((acc) => (
                    <div
                      key={acc.id || acc.accountNumber}
                      className="flex items-center justify-between gap-2 rounded-lg border border-line bg-white px-3 py-2"
                    >
                      <div>
                        <p className="flex items-center gap-1 font-bold text-espresso">
                          <Building2 size={13} className="text-teak" /> {acc.bankName}
                        </p>
                        <p className="font-mono text-sm font-bold text-teak">{acc.accountNumber}</p>
                        <p className="text-muted">a.n. {acc.accountHolder}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyAccount(acc.accountNumber)}
                        className="inline-flex items-center gap-1 rounded-lg border border-gold/40 bg-cream px-2.5 py-1.5 font-semibold text-espresso hover:bg-gold/20"
                      >
                        {copiedAcc === acc.accountNumber ? (
                          <>
                            <Check size={13} className="text-emerald-700" /> Tersalin
                          </>
                        ) : (
                          <>
                            <Copy size={13} /> Salin
                          </>
                        )}
                      </button>
                    </div>
                  ))}

                  {paymentSettings.qrisImage && (
                    <div className="rounded-lg border border-line bg-white p-2.5 text-center">
                      <p className="mb-1.5 inline-flex items-center gap-1 font-bold text-espresso">
                        <QrCode size={13} className="text-teak" /> Scan QRIS Toko
                      </p>
                      <img
                        src={paymentSettings.qrisImage}
                        alt="QRIS Meuble Le'Koyo"
                        onClick={() =>
                          setZoomPhoto({ src: paymentSettings.qrisImage, label: "QRIS Meuble Le'Koyo" })
                        }
                        className="mx-auto max-h-44 cursor-zoom-in rounded-lg object-contain"
                      />
                    </div>
                  )}

                  <p className="text-muted">
                    {payOrderSummary.isTabung ? paymentSettings.tabungNote : paymentSettings.cashNote}
                  </p>
                </div>
              ) : (
                <div className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
                  <AlertCircle size={15} className="mt-0.5 shrink-0" />
                  <span>
                    Nomor rekening belum ditambahkan di pengaturan toko. Silakan konfirmasi nomor rekening tujuan dengan Pak Nanang di WhatsApp lalu unggah bukti transfernya di sini.
                  </span>
                </div>
              )}

              <form onSubmit={handleSubmitPayment} className="space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-bark">
                      Nominal Dibayar (Rp)
                    </label>
                    <input
                      type="number"
                      min="1000"
                      step="1000"
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      placeholder="Contoh: 1500000"
                      className="field !py-2 text-sm font-bold"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-bark">
                      Tanggal Bayar
                    </label>
                    <input
                      type="date"
                      value={payDate}
                      onChange={(e) => setPayDate(e.target.value)}
                      className="field !py-2 text-sm"
                      required
                    />
                  </div>
                </div>

                {payOrderSummary.remaining > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPayAmount(String(payOrderSummary.remaining))}
                      className="rounded-full border border-gold/40 bg-sand px-3 py-1 text-xs font-semibold text-teak hover:bg-gold/25"
                    >
                      Lunasi Sisa ({formatRupiah(payOrderSummary.remaining)})
                    </button>
                    {payOrderSummary.isTabung && payOrderSummary.remaining >= 1000000 && (
                      <button
                        type="button"
                        onClick={() =>
                          setPayAmount(String(Math.round(payOrderSummary.remaining / 2)))
                        }
                        className="rounded-full border border-line bg-white px-3 py-1 text-xs font-semibold text-bark hover:border-gold"
                      >
                        50% Sisa ({formatRupiah(Math.round(payOrderSummary.remaining / 2))})
                      </button>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-bark">
                      Metode Pembayaran
                    </label>
                    <select
                      value={payMethod}
                      onChange={(e) => setPayMethod(e.target.value)}
                      className="field !py-2 text-sm"
                    >
                      <option value="Transfer Bank">Transfer Bank</option>
                      <option value="QRIS">QRIS</option>
                      <option value="Tunai di Toko">Tunai di Toko</option>
                    </select>
                  </div>

                  {payMethod === 'Transfer Bank' && paymentSettings?.accounts?.length > 0 && (
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-bark">
                        Bank Tujuan
                      </label>
                      <select
                        value={payAccountLabel}
                        onChange={(e) => setPayAccountLabel(e.target.value)}
                        className="field !py-2 text-sm"
                      >
                        {paymentSettings.accounts.map((acc) => {
                          const label = `${acc.bankName} - ${acc.accountNumber}`;
                          return (
                            <option key={acc.id || acc.accountNumber} value={label}>
                              {label}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-bark">
                    Catatan (opsional)
                  </label>
                  <input
                    type="text"
                    value={payNote}
                    onChange={(e) => setPayNote(e.target.value)}
                    placeholder="Contoh: Setoran tabungan ke-1 / Pelunasan"
                    className="field !py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-bark">
                    Foto Bukti Pembayaran {payMethod === 'Tunai di Toko' ? '(opsional)' : '(wajib)'}
                  </label>
                  {payProof ? (
                    <div className="relative overflow-hidden rounded-xl border border-gold/40 bg-sand p-2">
                      <img
                        src={payProof}
                        alt="Pratinjau bukti pembayaran"
                        className="mx-auto max-h-44 rounded-lg object-contain"
                      />
                      <button
                        type="button"
                        onClick={() => setPayProof('')}
                        className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full bg-espresso text-white hover:bg-red-600"
                        aria-label="Hapus bukti"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <label className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-gold/45 bg-cream/70 px-4 py-4 text-center transition hover:border-teak">
                      <Upload size={20} className="text-teak" />
                      <span className="text-xs font-bold text-espresso">
                        {uploadingProof ? 'Memproses gambar...' : 'Pilih Foto Bukti Transfer / Struk'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleProofFile}
                        disabled={uploadingProof}
                        className="sr-only"
                      />
                    </label>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={submittingPay || uploadingProof}
                  className="btn-primary w-full disabled:opacity-55"
                >
                  {submittingPay ? 'Mengirim bukti...' : 'Kirim Bukti Pembayaran'}
                </button>
              </form>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* ==================== MODAL ULASAN ==================== */}
      <AnimatePresence>
        {reviewOrder && (
          <Modal title="Beri Ulasan Pesanan" onClose={() => setReviewOrder(null)}>
            <div className="rounded-xl bg-cream p-3.5 text-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-gold-dark">
                {reviewOrder.orderCode || `#${reviewOrder.id}`}
              </p>
              <p className="mt-0.5 font-semibold text-espresso">{reviewOrder.product}</p>
            </div>

            <form onSubmit={handleSubmitReview} className="mt-4 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-bark">
                  Seberapa puas Anda dengan hasilnya?
                </label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setRating(n)}
                      className="rounded-lg p-1.5 transition hover:bg-sand"
                      aria-label={`${n} bintang`}
                    >
                      <Star
                        size={26}
                        fill={n <= rating ? '#C9A227' : 'none'}
                        className={n <= rating ? 'text-gold' : 'text-line'}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-sm font-bold text-teak">{rating} / 5</span>
                </div>
              </div>

              <div>
                <label htmlFor="rev-city" className="mb-1.5 block text-sm font-medium text-bark">
                  Kota Anda
                </label>
                <input
                  id="rev-city"
                  className="field"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Contoh: Kota Jambi / Palembang"
                  required
                />
              </div>

              <div>
                <label htmlFor="rev-text" className="mb-1.5 block text-sm font-medium text-bark">
                  Ceritakan pengalaman Anda
                </label>
                <textarea
                  id="rev-text"
                  rows={3}
                  className="field"
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Contoh: Kayu jatinya tebal, ukiran rapi, pengiriman ke Palembang aman tanpa lecet..."
                  required
                />
              </div>

              <button type="submit" disabled={sendingReview} className="btn-primary w-full">
                {sendingReview ? 'Mengirim ulasan...' : 'Kirim Ulasan'}
              </button>
            </form>
          </Modal>
        )}
      </AnimatePresence>

      {/* ==================== MODAL KWITANSI / BUKTI PELUNASAN ==================== */}
      <AnimatePresence>
        {receiptOrder && (
          <PaymentReceiptModal order={receiptOrder} onClose={() => setReceiptOrder(null)} />
        )}
      </AnimatePresence>

      {/* Lightbox Perbesar Foto */}
      {zoomPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-espresso/85 p-4 backdrop-blur-sm"
          onClick={() => setZoomPhoto(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-3xl overflow-hidden rounded-2xl border border-gold/40 bg-cream p-3 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 flex items-center justify-between gap-4 px-1">
              <p className="text-sm font-bold text-espresso">{zoomPhoto.label}</p>
              <button
                type="button"
                onClick={() => setZoomPhoto(null)}
                className="grid h-8 w-8 place-items-center rounded-full bg-sand text-espresso hover:bg-espresso hover:text-gold-light"
                aria-label="Tutup foto"
              >
                <X size={16} />
              </button>
            </div>
            <img
              src={zoomPhoto.src}
              alt={zoomPhoto.label}
              className="max-h-[78vh] w-auto rounded-xl object-contain"
            />
          </div>
        </div>
      )}
    </section>
  );
}