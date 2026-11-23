import { Link } from 'react-router-dom';
import {
  Users,
  ShoppingBag,
  MessageSquare,
  Eye,
  ArrowRight,
  Info,
  Package,
  Wallet,
  Sparkles,
  Plus,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StatCard } from '../../components/admin/ui';
import { formatRupiah } from '../../utils/format';

const fmt = (iso) => new Date(iso).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });

export default function Overview() {
  const { products, orders, chatLogs, views, visits, salesTotals, backendOnline } = useApp();
  const newOrders = orders.filter((o) => o.status === 'Menunggu Konfirmasi WA' || o.status === 'Baru').length;
  const popular = products
    .map((p) => ({ ...p, count: views[p.id] || 0 }))
    .filter((p) => p.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  const max = popular[0]?.count || 1;

  const stats = [
    { icon: Wallet, value: formatRupiah(salesTotals.revenue), label: 'Perkiraan omzet tercatat', small: true, accent: true },
    { icon: ShoppingBag, value: newOrders, label: 'Menunggu konfirmasi WA' },
    { icon: Package, value: salesTotals.units, label: 'Total unit terjual' },
    { icon: Users, value: visits, label: 'Kunjungan galeri' },
    { icon: MessageSquare, value: chatLogs.length, label: 'Percakapan Koyo' },
    { icon: Eye, value: Object.values(views).reduce((a, b) => a + b, 0), label: 'Produk dilihat' },
  ];

  return (
    <div className="space-y-6">
      {/* Banner Sambutan Eksekutif */}
      <section className="luxury-dark relative overflow-hidden rounded-[1.75rem] border border-gold/35 p-6 text-cream shadow-lift sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-12 h-56 w-56 rounded-full bg-gold/15 blur-3xl" aria-hidden="true" />
        <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/35 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-gold-light">
              <Sparkles size={12} /> Ringkasan Galeri
            </span>
            <h1 className="font-heading mt-3 text-3xl font-bold text-cream sm:text-4xl">
              Selamat datang, <span className="italic text-gold-light">Pak Nanang</span>
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-cream/75 sm:text-[15px]">
              Pantau pesanan masuk, koleksi kayu jati terpopuler, penjualan toko, serta topik pertanyaan pelanggan dari Koyo dalam satu tampilan rapi.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Link to="/admin/orders" className="btn-gold !min-h-[44px] !px-4 text-sm">
              <ShoppingBag size={16} /> Cek Pesanan ({newOrders})
            </Link>
            <Link to="/admin/products" className="btn !min-h-[44px] border border-gold/35 bg-white/10 !px-4 text-sm text-cream hover:bg-white/20">
              <Plus size={16} className="text-gold-light" /> Kelola Produk
            </Link>
          </div>
        </div>
      </section>

      {/* Info Demo */}
      <div className="flex items-start gap-3 rounded-2xl border border-gold/30 bg-white/90 p-4 shadow-soft">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-sand text-teak">
          <Info size={18} />
        </span>
        <p className="text-sm leading-relaxed text-muted">
          Pesanan, pertanyaan Koyo, dan jumlah kunjungan terisi otomatis dari aktivitas pelanggan di website. {backendOnline ? 'Seluruh data tersinkronisasi dan tersimpan persisten di server Backend Express + Database.' : 'Server Backend belum aktif — jalankan folder backend (npm run dev) agar perubahan tersimpan persisten ke database.'}
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {stats.map((st) => (
          <StatCard key={st.label} {...st} />
        ))}
      </div>

      {/* Detail Aktivitas */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="luxury-panel p-6">
          <span className="kicker">Minat Pengunjung</span>
          <h2 className="font-heading mt-1 text-xl font-bold text-espresso">Produk paling sering dilihat</h2>
          {popular.length === 0 ? (
            <p className="mt-4 rounded-xl bg-cream p-4 text-sm text-muted">
              Belum ada data. Akan muncul otomatis saat pelanggan membuka detail produk.
            </p>
          ) : (
            <ul className="mt-5 space-y-4">
              {popular.map((p) => (
                <li key={p.id}>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-semibold text-espresso">{p.name}</span>
                    <span className="font-bold text-teak">{p.count}×</span>
                  </div>
                  <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-sand">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-teak to-gold"
                      style={{ width: `${(p.count / max) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="luxury-panel p-6">
          <div className="flex items-end justify-between gap-2">
            <div>
              <span className="kicker">Antrean Transaksi</span>
              <h2 className="font-heading mt-1 text-xl font-bold text-espresso">Pesanan terbaru</h2>
            </div>
            <Link to="/admin/orders" className="inline-flex items-center gap-1 text-sm font-semibold text-teak hover:text-espresso">
              Semua <ArrowRight size={15} className="text-gold-dark" />
            </Link>
          </div>
          {orders.length === 0 ? (
            <p className="mt-4 rounded-xl bg-cream p-4 text-sm text-muted">Belum ada pesanan masuk.</p>
          ) : (
            <ul className="mt-4 divide-y divide-line">
              {orders.slice(0, 4).map((o) => (
                <li key={o.id} className="py-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-semibold text-espresso">
                      {o.product} <span className="font-normal text-muted">×{o.quantity}</span>
                    </p>
                    <span className="shrink-0 rounded-full border border-gold/35 bg-sand px-2.5 py-0.5 text-xs font-bold text-teak">
                      {o.status}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted">
                    {o.name} · {o.total > 0 ? formatRupiah(o.total) : 'Custom (via WA)'} · {fmt(o.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="luxury-panel p-6 lg:col-span-2">
          <div className="flex items-end justify-between gap-2">
            <div>
              <span className="kicker">Wawasan Pelanggan</span>
              <h2 className="font-heading mt-1 text-xl font-bold text-espresso">Pertanyaan terbaru ke Koyo</h2>
            </div>
            <Link to="/admin/chats" className="inline-flex items-center gap-1 text-sm font-semibold text-teak hover:text-espresso">
              Lihat semua <ArrowRight size={15} className="text-gold-dark" />
            </Link>
          </div>
          {chatLogs.length === 0 ? (
            <p className="mt-4 rounded-xl bg-cream p-4 text-sm text-muted">Belum ada pertanyaan masuk.</p>
          ) : (
            <ul className="mt-4 divide-y divide-line">
              {chatLogs.slice(0, 4).map((c) => (
                <li key={c.id} className="flex flex-col justify-between gap-1 py-3.5 text-sm sm:flex-row sm:items-center">
                  <span className="font-medium text-bark">{c.message}</span>
                  <span className="text-xs text-muted">{c.time}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
