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
  'Menunggu Harga Owner': 'bg-amber-50 text-amber-800 border-amber-200',
  'Harga Ditetapkan': 'bg-sand text-teak border-gold/40',
  'Menunggu Konfirmasi WA': 'bg-amber-50 text-amber-800 border-amber-200',
  Diproses: 'bg-espresso/10 text-espresso border-espresso/20',
  Selesai: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  Dibatalkan: 'bg-red-50 text-red-700 border-red-200',
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

  const [receiptOrder, setReceiptOrder] = useState(null);

  useEffect(() => {
    if (!user || isOwner) return undefined;
    loadMyOrders();
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadMyOrders();
      }
    }, 15000);
    return () => clearInterval(timer);
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
    setPayAmount(summary.isTabung ? '' : summary.remaining > 0 ? String(summary.remaining) : '');
    setPayMethod(accounts.length > 0 ? 'Transfer Bank' : paymentSettings?.qrisImage ? 'QRIS' : 'Transfer Bank');
    setPayAccountLabel(defaultAcc);
    setPayDate(new Date().toISOString().slice(0, 10));
    setPayNote(
      summary.isTabung
        ? `Setoran Tabungan ke-${summary.verifiedRecords.length + 1}`
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

  const payOrderSummary = payOrder ? getPaymentSummary(payOrder) : null;
  const numericPayAmount = Number(String(payAmount).replace(/[^\d]/g, '')) || 0;
  const isOverRemaining =
    Boolean(payOrderSummary) && numericPayAmount > payOrderSummary.remaining;

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    if (!payOrder || !payOrderSummary) return;
    if (!numericPayAmount || numericPayAmount < 1000) {
      toast.error('Masukkan nominal pembayaran minimal Rp 1.000.');
      return;
    }
    if (numericPayAmount > payOrderSummary.remaining) {
      toast.error(
        `Nominal tidak boleh melebihi sisa tagihan (${formatRupiah(payOrderSummary.remaining)}).`,
      );
      return;
    }
    if (payMethod !== 'Tunai di Toko' && !payProof) {
      toast.error('Unggah foto bukti transfer / QRIS terlebih dahulu.');
      return;
    }
    setSubmittingPay(true);
    try {
      await submitOrderPayment(payOrder.id, {
        amount: numericPayAmount,
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
      // Error sudah ditangani di AppContext
    } finally {
      setSendingReview(false);
    }
  };

  const buildWaLink = (order) => {
    const summary = getPaymentSummary(order);
    const est = Number(order.estimatedPrice ?? order.total) || 0;
    const hargaText =
      order.finalPrice != null
        ? `Harga Final: ${formatRupiah(order.finalPrice)} (Terbayar: ${formatRupiah(summary.paidAmount)}, Sisa: ${formatRupiah(summary.remaining)})`
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
            Anda sedang login sebagai Owner. Buka Dashboard Owner untuk mengelola pesanan &amp; verifikasi pembayaran.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/admin/orders" className="btn-primary text-sm">
              <Crown size={16} className="text-gold-light" /> Buka Pesanan Masuk
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
            Masuk dengan akun Google Anda untuk melihat status pesanan, buku tabungan &amp; sisa tagihan, serta mengunduh bukti pelunasan.
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

  return (
    <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold-dark">
            Riwayat &amp; Buku Tabungan
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
          className="btn-soft !min-h-[40px] text-xs sm:text-sm"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Memuat...' : 'Segarkan'}
        </button>
      </div>

      {myOrders.length === 0 ? (
        <div className="rounded-3xl border border-line bg-sand/50 p-10 text-center">
          <Sparkles size={32} className="mx-auto text-gold-dark" />
          <h2 className="font-heading mt-3 text-xl font-bold text-espresso">
            Belum ada pesanan tercatat
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Pesanan yang Anda ajukan saat sudah login Google akan otomatis muncul di sini.
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
            const badgeClass = STATUS_STYLE[order.status] || 'bg-sand text-espresso border-line';
            const hasFinalPrice =
              order.finalPrice !== null && order.finalPrice !== undefined && Number(order.finalPrice) > 0;
            const estPrice = Number(order.estimatedPrice ?? order.total) || 0;
            const isDone = order.status === 'Selesai';
            const isCancelled = order.status === 'Dibatalkan';
            const existingReview = testimonials.find((t) => Number(t.orderId) === Number(order.id));
            const paySummary = getPaymentSummary(order);

            return (
              <article
                key={order.id}
                className="overflow-hidden rounded-2xl border border-line bg-white shadow-soft"
              >
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line/80 bg-cream/55 p-5">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-espresso px-2.5 py-0.5 font-mono text-xs font-bold tracking-wider text-gold-light">
                        {order.orderCode || `#${order.id}`}
                      </span>
                      <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${badgeClass}`}>
                        {order.status}
                      </span>
                    </div>
                    <h2 className="font-heading mt-2 text-lg font-bold text-espresso">
                      {order.product}
                    </h2>
                    <p className="text-xs text-muted">
                      {order.quantity} unit • Sistem <strong className="text-bark">{order.payment}</strong>
                      {order.createdAt && (
                        <> • {new Date(order.createdAt).toLocaleDateString('id-ID', { dateStyle: 'medium' })}</>
                      )}
                    </p>
                  </div>

                  <div className="text-left sm:text-right">
                    {hasFinalPrice ? (
                      <>
                        <p className="text-xs font-semibold text-emerald-700">Harga Final Owner</p>
                        <p className="font-heading text-xl font-bold text-espresso">
                          {formatRupiah(order.finalPrice)}
                        </p>
                      </>
                    ) : isCancelled ? (
                      <p className="inline-flex items-center gap-1 text-xs font-semibold text-red-600">
                        <XCircle size={14} /> Dibatalkan
                      </p>
                    ) : (
                      <>
                        <p className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700">
                          <Clock size={13} /> Menunggu Harga Owner
                        </p>
                        <p className="font-heading text-lg font-bold text-espresso">
                          {estPrice > 0 ? `Est. ${formatRupiah(estPrice)}` : 'Harga via Owner'}
                        </p>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-4 p-5">
                  {hasFinalPrice && !isCancelled && (
                    <div className="rounded-2xl border border-gold/30 bg-cream/55 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-teak">
                          <Wallet size={14} className="text-gold-dark" />
                          {paySummary.isTabung ? 'Kartu Sistem Tabung' : 'Pembayaran Tunai'}
                        </p>

                        <div className="flex flex-wrap gap-2">
                          {!paySummary.isPaidOff && (
                            <button
                              type="button"
                              onClick={() => openPayModal(order)}
                              className="btn-primary !min-h-[36px] !px-3.5 text-xs"
                            >
                              <Upload size={13} className="text-gold-light" />
                              {paySummary.isTabung ? 'Setor Tabungan' : 'Bayar Sekarang'}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setReceiptOrder(order)}
                            className="btn-soft !min-h-[36px] !px-3.5 text-xs"
                          >
                            <Receipt size={13} className="text-gold-dark" />
                            {paySummary.isPaidOff ? 'Bukti Pelunasan' : 'Kwitansi'}
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl border border-line/70 bg-white p-3">
                        <div>
                          <p className="text-[11px] text-muted">Harga Barang</p>
                          <p className="text-sm font-bold text-espresso sm:text-base">
                            {formatRupiah(paySummary.bill)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] text-muted">Sudah Masuk</p>
                          <p className="text-sm font-bold text-emerald-700 sm:text-base">
                            {formatRupiah(paySummary.paidAmount)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] text-muted">Sisa Tagihan</p>
                          <p className={`text-sm font-extrabold sm:text-base ${paySummary.isPaidOff ? 'text-emerald-700' : 'text-teak'}`}>
                            {paySummary.isPaidOff ? 'Rp 0 (LUNAS)' : formatRupiah(paySummary.remaining)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3">
                        <div className="mb-1 flex justify-between text-xs font-semibold">
                          <span className="text-muted">Progres Pelunasan</span>
                          <span className={paySummary.isPaidOff ? 'text-emerald-700' : 'text-espresso'}>
                            {paySummary.percent}%
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-sand">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              paySummary.isPaidOff ? 'bg-emerald-600' : 'bg-espresso'
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

                      {paySummary.ledger.length > 0 && (
                        <div className="mt-3.5 overflow-hidden rounded-xl border border-line bg-white">
                          <div className="hidden grid-cols-12 bg-sand/60 px-3 py-1.5 text-[10.5px] font-bold uppercase tracking-wider text-muted sm:grid">
                            <span className="col-span-5">Setoran &amp; Status</span>
                            <span className="col-span-3 text-right">Dibayar</span>
                            <span className="col-span-3 text-right">Sisa Tagihan</span>
                            <span className="col-span-1 text-right">Foto</span>
                          </div>
                          <div className="divide-y divide-line/70">
                            {paySummary.ledger.map((rec, idx) => (
                              <div key={rec.id || idx} className="grid items-center gap-1.5 px-3 py-2.5 text-xs sm:grid-cols-12">
                                <div className="sm:col-span-5">
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="font-bold text-espresso">
                                      {rec.stepNumber ? `Setoran #${rec.stepNumber}` : 'Pengajuan Bayar'}
                                    </span>
                                    <span
                                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                        rec.status === 'Terverifikasi'
                                          ? 'bg-emerald-50 text-emerald-700'
                                          : rec.status === 'Ditolak'
                                            ? 'bg-red-50 text-red-700'
                                            : 'bg-amber-100 text-amber-800'
                                      }`}
                                    >
                                      {rec.status}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-muted">
                                    {rec.date || (rec.createdAt || '').slice(0, 10)} · {rec.method}
                                    {rec.note ? ` · ${rec.note}` : ''}
                                  </p>
                                  {rec.status === 'Ditolak' && rec.rejectReason && (
                                    <p className="mt-0.5 text-[11px] font-medium text-red-600">
                                      Alasan: {rec.rejectReason}
                                    </p>
                                  )}
                                </div>

                                <div className="flex justify-between sm:col-span-3 sm:block sm:text-right">
                                  <span className="text-muted sm:hidden">Dibayar:</span>
                                  <span className="font-bold text-emerald-700">{formatRupiah(rec.amount)}</span>
                                </div>

                                <div className="flex justify-between sm:col-span-3 sm:block sm:text-right">
                                  <span className="text-muted sm:hidden">Sisa Tagihan:</span>
                                  {rec.status === 'Terverifikasi' ? (
                                    <span className={`font-bold ${rec.balanceAfter === 0 ? 'text-emerald-700' : 'text-espresso'}`}>
                                      {rec.balanceAfter === 0 ? 'LUNAS' : `Tinggal ${formatRupiah(rec.balanceAfter)}`}
                                    </span>
                                  ) : (
                                    <span className="text-muted">—</span>
                                  )}
                                </div>

                                <div className="flex justify-end sm:col-span-1">
                                  {rec.proofImage && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setZoomPhoto({
                                          src: rec.proofImage,
                                          label: `Bukti Bayar ${formatRupiah(rec.amount)}`,
                                        })
                                      }
                                      className="rounded-lg border border-line bg-cream p-1.5 text-teak hover:border-gold"
                                      title="Lihat bukti"
                                    >
                                      <ZoomIn size={13} />
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
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
                          <MapPin size={12} /> Lihat Titik Maps
                        </a>
                      )}
                    </div>

                    {order.ownerNote && (
                      <div className="rounded-xl border border-gold/30 bg-sand/50 p-3">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-gold-dark">
                          Catatan dari Pak Nanang
                        </p>
                        <p className="mt-1 text-sm text-espresso">{order.ownerNote}</p>
                      </div>
                    )}
                  </div>

                  {Array.isArray(order.finishedPhotos) && order.finishedPhotos.length > 0 && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3.5">
                      <p className="mb-2 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-800">
                        <Camera size={14} /> Foto Produk Hasil Jadi ({order.finishedPhotos.length})
                      </p>
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
                            <span className="absolute bottom-1 left-1 rounded-full bg-espresso/80 px-2 py-0.5 text-[10px] font-semibold text-cream">
                              {ph.label || `Foto ${idx + 1}`}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {existingReview && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3.5 text-sm">
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

                  <div className="flex flex-wrap justify-end gap-2 border-t border-line/80 pt-3.5">
                    {isDone && !existingReview && (
                      <button
                        type="button"
                        onClick={() => openReviewModal(order)}
                        className="btn-soft !min-h-[38px] !px-4 text-xs sm:text-sm"
                      >
                        <Star size={14} className="text-gold-dark" /> Beri Ulasan
                      </button>
                    )}
                    <a
                      href={buildWaLink(order)}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-primary !min-h-[38px] !px-4 text-xs sm:text-sm"
                    >
                      <MessageCircle size={14} className="text-gold-light" /> Konfirmasi via WhatsApp
                    </a>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* MODAL SETOR TABUNGAN / BAYAR TUNAI */}
      <AnimatePresence>
        {payOrder && payOrderSummary && (
          <Modal
            title={payOrderSummary.isTabung ? 'Setor Sistem Tabung' : 'Pembayaran & Upload Bukti'}
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
                  <strong className="text-teak">{formatRupiah(payOrderSummary.remaining)}</strong>
                </p>
              </div>

              {paymentSettings?.accounts?.length > 0 || paymentSettings?.qrisImage ? (
                <div className="space-y-2.5 rounded-xl border border-gold/35 bg-sand/45 p-3.5 text-xs">
                  <p className="font-bold uppercase tracking-wider text-espresso">
                    Rekening Resmi Meuble Le&apos;Koyo
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
                    Nomor rekening belum ditambahkan di dashboard. Konfirmasi rekening tujuan ke Pak Nanang di WhatsApp lalu unggah bukti transfernya di sini.
                  </span>
                </div>
              )}

              <form onSubmit={handleSubmitPayment} className="space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-bark">
                      Nominal Setoran (Rp)
                    </label>
                    <input
                      type="number"
                      min="1000"
                      max={payOrderSummary.remaining}
                      step="1000"
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      placeholder={`Maks. ${payOrderSummary.remaining}`}
                      className={`field !py-2 text-sm font-bold ${
                        isOverRemaining ? '!border-red-500 !bg-red-50/40 !text-red-700' : ''
                      }`}
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-bark">Tanggal</label>
                    <input
                      type="date"
                      value={payDate}
                      onChange={(e) => setPayDate(e.target.value)}
                      className="field !py-2 text-sm"
                      required
                    />
                  </div>
                </div>

                {/* Peringatan keras jika nominal melewati sisa tagihan */}
                {isOverRemaining ? (
                  <p className="flex items-start gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                    <AlertCircle size={14} className="mt-0.5 shrink-0" />
                    <span>
                      Nominal melebihi sisa tagihan! Maksimal yang dapat dibayar adalah{' '}
                      <strong>{formatRupiah(payOrderSummary.remaining)}</strong>.
                    </span>
                  </p>
                ) : numericPayAmount > 0 ? (
                  <p className="rounded-lg bg-sand/70 px-3 py-2 text-xs text-bark">
                    Jika setoran <strong>{formatRupiah(numericPayAmount)}</strong> ini diverifikasi, sisa tagihan Anda tinggal{' '}
                    <strong className="text-teak">
                      {payOrderSummary.remaining - numericPayAmount === 0
                        ? 'Rp 0 (LUNAS)'
                        : formatRupiah(payOrderSummary.remaining - numericPayAmount)}
                    </strong>
                    .
                  </p>
                ) : null}

                {payOrderSummary.remaining > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPayAmount(String(payOrderSummary.remaining))}
                      className="rounded-full border border-gold/40 bg-sand px-3 py-1 text-xs font-semibold text-teak hover:bg-gold/25"
                    >
                      Lunasi ({formatRupiah(payOrderSummary.remaining)})
                    </button>
                    {payOrderSummary.isTabung && (
                      <>
                        {payOrderSummary.remaining >= 500000 && (
                          <button
                            type="button"
                            onClick={() => setPayAmount('500000')}
                            className="rounded-full border border-line bg-white px-3 py-1 text-xs font-semibold text-bark hover:border-gold"
                          >
                            Rp 500.000
                          </button>
                        )}
                        {payOrderSummary.remaining >= 1000000 && (
                          <button
                            type="button"
                            onClick={() => setPayAmount('1000000')}
                            className="rounded-full border border-line bg-white px-3 py-1 text-xs font-semibold text-bark hover:border-gold"
                          >
                            Rp 1.000.000
                          </button>
                        )}
                      </>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-bark">Metode</label>
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
                      <label className="mb-1 block text-xs font-semibold text-bark">Bank Tujuan</label>
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
                  <label className="mb-1 block text-xs font-semibold text-bark">Catatan (opsional)</label>
                  <input
                    type="text"
                    value={payNote}
                    onChange={(e) => setPayNote(e.target.value)}
                    placeholder="Contoh: Setoran tabungan ke-1"
                    className="field !py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-bark">
                    Foto Bukti Transfer {payMethod === 'Tunai di Toko' ? '(opsional)' : '(wajib)'}
                  </label>
                  {payProof ? (
                    <div className="relative overflow-hidden rounded-xl border border-gold/40 bg-sand p-2">
                      <img src={payProof} alt="Bukti bayar" className="mx-auto max-h-44 rounded-lg object-contain" />
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
                      <Upload size={19} className="text-teak" />
                      <span className="text-xs font-bold text-espresso">
                        {uploadingProof ? 'Memproses gambar...' : 'Pilih Foto Bukti Pembayaran'}
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
                  disabled={submittingPay || uploadingProof || isOverRemaining || numericPayAmount < 1000}
                  className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submittingPay ? 'Mengirim...' : 'Kirim Bukti Pembayaran'}
                </button>
              </form>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* MODAL ULASAN */}
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
                  placeholder="Contoh: Kota Jambi"
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
                  placeholder="Contoh: Kayu jatinya tebal, ukiran rapi..."
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

      {/* MODAL KWITANSI / BUKTI PELUNASAN */}
      <AnimatePresence>
        {receiptOrder && (
          <PaymentReceiptModal order={receiptOrder} onClose={() => setReceiptOrder(null)} />
        )}
      </AnimatePresence>

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