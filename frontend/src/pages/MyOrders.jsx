import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { toast } from 'sonner';
import {
  ClipboardList,
  RefreshCw,
  MapPin,
  MessageCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { extractApiError } from '../services/api';
import { WA_BASE } from '../services/whatsapp';

const formatRp = (n) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);

const STATUS_STYLE = {
  'Menunggu Harga Owner': 'bg-amber-100 text-amber-800 border-amber-300',
  'Harga Ditetapkan': 'bg-blue-100 text-blue-800 border-blue-300',
  'Menunggu Konfirmasi WA': 'bg-amber-100 text-amber-800 border-amber-300',
  Diproses: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  Selesai: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  Dibatalkan: 'bg-red-100 text-red-700 border-red-300',
};

export default function MyOrders() {
  const { user, myOrders, loadMyOrders, loginWithGoogle } = useApp();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      loadMyOrders();
    }
  }, [user, loadMyOrders]);

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

  const buildWaLink = (order) => {
    const est = Number(order.estimatedPrice ?? order.total) || 0;
    const hargaText =
      order.finalPrice != null
        ? `Harga Final Owner: ${formatRp(order.finalPrice)}`
        : est > 0
          ? `Estimasi Awal: ${formatRp(est)}`
          : 'Harga: Menunggu konfirmasi Owner';
    const text = [
      `Halo Pak Nanang, saya ingin konfirmasi pesanan saya:`,
      `• Kode Pesanan: ${order.orderCode || `#${order.id}`}`,
      `• Produk: ${order.product} (${order.quantity} unit)`,
      `• ${hargaText}`,
      `• Status: ${order.status}`,
    ].join('\n');
    const sep = WA_BASE.includes('?') ? '&' : '?';
    return `${WA_BASE}${sep}text=${encodeURIComponent(text)}`;
  };

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
            Masuk dengan akun Google Anda untuk melihat riwayat pesanan, kode pesanan unik, dan harga final yang ditetapkan oleh Pak Nanang.
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
    <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold-dark">
            Riwayat Pelanggan
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
            Pesanan yang Anda ajukan saat sudah login Google akan otomatis muncul di sini lengkap dengan kode pesanan dan update harga dari owner.
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
        <div className="space-y-4">
          {myOrders.map((order) => {
            const badgeClass =
              STATUS_STYLE[order.status] || 'bg-sand text-espresso border-line';
            const hasFinalPrice = order.finalPrice !== null && order.finalPrice !== undefined;
            const estPrice = Number(order.estimatedPrice ?? order.total) || 0;
            const isDone = order.status === 'Selesai';
            const isCancelled = order.status === 'Dibatalkan';

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
                    </div>
                    <h2 className="font-heading mt-2 text-lg font-bold text-espresso">
                      {order.product}
                    </h2>
                    <p className="text-xs text-muted">
                      Jumlah: {order.quantity} unit • Pembayaran: {order.payment}
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
                          {formatRp(order.finalPrice)}
                        </p>
                        {estPrice > 0 && estPrice !== order.finalPrice && (
                          <p className="text-xs text-muted line-through">
                            Estimasi awal: {formatRp(estPrice)}
                          </p>
                        )}
                      </>
                    ) : isDone ? (
                      <>
                        <p className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                          <CheckCircle2 size={14} /> Pesanan Selesai
                        </p>
                        <p className="font-heading text-base font-bold text-espresso">
                          {estPrice > 0 ? formatRp(estPrice) : 'Disepakati via WA'}
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
                          {estPrice > 0 ? `Est. ${formatRp(estPrice)}` : 'Harga via Owner'}
                        </p>
                      </>
                    )}
                  </div>
                </div>

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

                <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-line pt-4">
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
    </section>
  );
}