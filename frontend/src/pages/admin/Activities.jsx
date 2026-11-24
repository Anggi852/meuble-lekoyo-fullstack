import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  RefreshCw,
  Download,
  Search,
  Heart,
  Eye,
  ShoppingBag,
  Hammer,
  MessageCircle,
  LogIn,
  Users,
  ExternalLink,
  Filter,
} from 'lucide-react';
import { toast } from 'sonner';
import { api, extractApiError } from '../../services/api';

const formatRp = (n) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);

const ACTION_CONFIG = {
  login: {
    label: 'Login Akun',
    icon: LogIn,
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  wishlist_add: {
    label: 'Tambah Favorit',
    icon: Heart,
    badge: 'bg-rose-100 text-rose-700 border-rose-200',
  },
  wishlist_remove: {
    label: 'Hapus Favorit',
    icon: Heart,
    badge: 'bg-stone-100 text-stone-700 border-stone-200',
  },
  view_product: {
    label: 'Lihat Produk',
    icon: Eye,
    badge: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  order_create: {
    label: 'Pesanan Katalog',
    icon: ShoppingBag,
    badge: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  custom_order_create: {
    label: 'Pesanan Custom',
    icon: Hammer,
    badge: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  },
  chat_koyo: {
    label: 'Konsultasi Koyo',
    icon: MessageCircle,
    badge: 'bg-purple-100 text-purple-800 border-purple-200',
  },
};

const FILTER_OPTIONS = [
  { value: 'all', label: 'Semua Aktivitas' },
  { value: 'wishlist_add', label: 'Tambah Favorit' },
  { value: 'wishlist_remove', label: 'Hapus Favorit' },
  { value: 'view_product', label: 'Lihat Produk' },
  { value: 'order_create', label: 'Pesanan Katalog' },
  { value: 'custom_order_create', label: 'Pesanan Custom' },
  { value: 'chat_koyo', label: 'Konsultasi Koyo' },
  { value: 'login', label: 'Login Akun' },
];

export default function Activities() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  const fetchActivities = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    try {
      const list = await api.getAllActivities({ limit: 300 });
      setActivities(Array.isArray(list) ? list : []);
      if (isManual) toast.success('Log aktivitas pelanggan diperbarui.');
    } catch (err) {
      toast.error(extractApiError(err, 'Gagal memuat log aktivitas pelanggan.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchActivities(false);
  }, [fetchActivities]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return activities.filter((item) => {
      if (actionFilter !== 'all' && item.action !== actionFilter) return false;
      if (!q) return true;
      return (
        String(item.userEmail || '').toLowerCase().includes(q) ||
        String(item.userName || '').toLowerCase().includes(q) ||
        String(item.label || '').toLowerCase().includes(q) ||
        String(item.metadata?.productName || '').toLowerCase().includes(q) ||
        String(item.metadata?.category || '').toLowerCase().includes(q) ||
        String(item.metadata?.orderCode || '').toLowerCase().includes(q)
      );
    });
  }, [activities, search, actionFilter]);

  const stats = useMemo(() => {
    const uniqueUsers = new Set(activities.map((a) => a.userEmail).filter(Boolean)).size;
    const wishlistAdds = activities.filter((a) => a.action === 'wishlist_add').length;
    const productViews = activities.filter((a) => a.action === 'view_product').length;
    const orderEvents = activities.filter(
      (a) => a.action === 'order_create' || a.action === 'custom_order_create',
    ).length;
    return {
      total: activities.length,
      uniqueUsers,
      wishlistAdds,
      productViews,
      orderEvents,
    };
  }, [activities]);

  const handleExportCsv = () => {
    if (filtered.length === 0) {
      toast.info('Belum ada data aktivitas untuk diekspor.');
      return;
    }
    const headers = [
      'id',
      'created_at',
      'user_email',
      'user_name',
      'action',
      'target_type',
      'target_id',
      'label',
      'metadata_json',
    ];
    const escapeCsv = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;
    const rows = filtered.map((a) =>
      [
        a.id,
        a.createdAt,
        a.userEmail,
        a.userName,
        a.action,
        a.targetType,
        a.targetId,
        a.label,
        JSON.stringify(a.metadata || {}),
      ]
        .map(escapeCsv)
        .join(','),
    );
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meuble-lekoyo-activities-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Berhasil mengekspor ${filtered.length} baris aktivitas ke CSV.`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold-dark">
            Pemantauan &amp; Dataset AI/DS
          </p>
          <h1 className="font-heading mt-1 text-2xl font-bold text-espresso sm:text-3xl">
            Aktivitas Pelanggan
          </h1>
          <p className="mt-1 text-sm text-muted">
            Rekaman interaksi akun pelanggan secara real-time (login, favorit, produk dilihat, chat Koyo, dan pesanan).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportCsv}
            className="btn-soft !min-h-[42px] text-xs sm:text-sm"
          >
            <Download size={15} /> Ekspor CSV
          </button>
          <button
            type="button"
            onClick={() => fetchActivities(true)}
            disabled={refreshing}
            className="btn-primary !min-h-[42px] text-xs sm:text-sm"
          >
            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Memuat...' : 'Segarkan'}
          </button>
        </div>
      </div>

      {/* Ringkasan Statistik */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <div className="rounded-2xl border border-gold/25 bg-white p-4 shadow-soft">
          <div className="flex items-center justify-between text-xs font-semibold text-muted">
            <span>Total Aktivitas</span>
            <Activity size={16} className="text-gold-dark" />
          </div>
          <p className="font-heading mt-2 text-2xl font-bold text-espresso">{stats.total}</p>
        </div>
        <div className="rounded-2xl border border-gold/25 bg-white p-4 shadow-soft">
          <div className="flex items-center justify-between text-xs font-semibold text-muted">
            <span>Akun Aktif</span>
            <Users size={16} className="text-teak" />
          </div>
          <p className="font-heading mt-2 text-2xl font-bold text-espresso">{stats.uniqueUsers}</p>
        </div>
        <div className="rounded-2xl border border-gold/25 bg-white p-4 shadow-soft">
          <div className="flex items-center justify-between text-xs font-semibold text-muted">
            <span>Tambah Favorit</span>
            <Heart size={16} className="text-rose-600" />
          </div>
          <p className="font-heading mt-2 text-2xl font-bold text-espresso">{stats.wishlistAdds}</p>
        </div>
        <div className="rounded-2xl border border-gold/25 bg-white p-4 shadow-soft">
          <div className="flex items-center justify-between text-xs font-semibold text-muted">
            <span>Lihat / Pesan</span>
            <ShoppingBag size={16} className="text-indigo-600" />
          </div>
          <p className="font-heading mt-2 text-2xl font-bold text-espresso">
            {stats.productViews} <span className="text-sm font-normal text-muted">/ {stats.orderEvents}</span>
          </p>
        </div>
      </div>

      {/* Pencarian & Filter */}
      <div className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-4 shadow-soft sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, email, produk, kategori, atau kode pesanan..."
            className="field !pl-10"
          />
        </div>

        <div className="relative sm:w-56">
          <Filter size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="field !pl-9"
            aria-label="Filter jenis aktivitas"
          >
            {FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Daftar Log Aktivitas */}
      {loading ? (
        <div className="rounded-2xl border border-line bg-white p-10 text-center text-sm text-muted">
          Memuat riwayat aktivitas dari database...
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-line bg-white p-10 text-center">
          <Activity size={30} className="mx-auto text-gold-dark" />
          <p className="font-heading mt-3 text-lg font-bold text-espresso">
            Belum ada aktivitas yang cocok
          </p>
          <p className="mt-1 text-sm text-muted">
            Coba ubah kata kunci pencarian atau tunggu interaksi pelanggan yang sedang login.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const cfg = ACTION_CONFIG[item.action] || {
              label: item.action,
              icon: Activity,
              badge: 'bg-sand text-espresso border-line',
            };
            const IconComp = cfg.icon;
            const productUrl =
              item.targetType === 'product' && item.targetId ? `/product/${item.targetId}` : null;

            return (
              <article
                key={item.id}
                className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-line bg-white p-4 shadow-sm transition hover:border-gold/45"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <div className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sand text-espresso">
                    <IconComp size={17} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${cfg.badge}`}
                      >
                        {cfg.label}
                      </span>
                      <span className="text-xs font-bold text-espresso">
                        {item.userName || 'Pelanggan'}
                      </span>
                      <span className="truncate text-xs text-muted">({item.userEmail})</span>
                    </div>

                    <p className="mt-1 text-sm font-medium text-espresso">
                      {item.label || cfg.label}
                    </p>

                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                      <span>
                        {item.createdAt
                          ? new Date(item.createdAt).toLocaleString('id-ID', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })
                          : '-'}
                      </span>
                      {item.metadata?.category && <span>• Kategori: {item.metadata.category}</span>}
                      {item.metadata?.price > 0 && <span>• {formatRp(item.metadata.price)}</span>}
                      {item.metadata?.orderCode && (
                        <span className="font-mono font-semibold text-teak">
                          • {item.metadata.orderCode}
                        </span>
                      )}
                      {item.metadata?.intent && <span>• Intent: {item.metadata.intent}</span>}
                    </div>
                  </div>
                </div>

                {productUrl && (
                  <Link
                    to={productUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-gold/30 bg-sand/60 px-3 py-1.5 text-xs font-semibold text-espresso transition hover:bg-sand"
                  >
                    Produk <ExternalLink size={12} />
                  </Link>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}