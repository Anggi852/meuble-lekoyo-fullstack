import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Package, Wallet, Store, Hammer, Trash2, Info } from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '../../context/AppContext';
import { PageHeader, StatCard } from '../../components/admin/ui';
import { formatRupiah } from '../../utils/format';

function Bars({ rows, suffix = '', empty }) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  if (!rows.length) return <p className="mt-4 text-muted">{empty}</p>;
  return (
    <ul className="mt-4 space-y-4">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="flex items-center justify-between gap-3 text-[15px]"><span className="font-medium">{r.label}</span><span className="text-muted">{r.text ?? `${r.value}${suffix}`}</span></div>
          <div className="mt-1.5 h-2.5 rounded-full bg-sand"><div className="h-full rounded-full bg-gradient-to-r from-teak to-gold" style={{ width: `${(r.value / max) * 100}%` }} /></div>
        </li>
      ))}
    </ul>
  );
}

export default function Sales() {
  const { products, orders, sales, removeSale, soldOf, salesTotals: t } = useApp();

  const data = useMemo(() => {
    const done = orders.filter((o) => o.status === 'Selesai');
    const byProduct = products.map((p) => ({ ...p, ...soldOf(p.id) })).filter((p) => p.total > 0).sort((a, b) => b.total - a.total).slice(0, 6);

    const cat = {};
    products.forEach((p) => {
      const s = soldOf(p.id);
      if (!s.total) return;
      const online = done.filter((o) => o.productId === p.id).reduce((a, o) => a + (Number(o.total) || 0), 0);
      cat[p.category] = cat[p.category] || { units: 0, revenue: 0 };
      cat[p.category].units += s.total;
      cat[p.category].revenue += online + s.offline * p.price;
    });
    const byCategory = Object.entries(cat).map(([label, v]) => ({ label, value: v.revenue, text: `${formatRupiah(v.revenue)} · ${v.units} unit` })).sort((a, b) => b.value - a.value);

    const pay = { Tunai: 0, Tabung: 0 };
    orders.forEach((o) => { if (pay[o.payment] !== undefined) pay[o.payment] += 1; });
    const payRows = orders.length ? Object.entries(pay).map(([label, value]) => ({ label, value, text: `${value} pesanan` })) : [];

    const custom = {};
    orders.filter((o) => o.custom).forEach((o) => {
      const k = o.custom.title;
      custom[k] = custom[k] || { total: 0, made: 0 };
      custom[k].total += 1;
      if (o.status === 'Selesai' || o.madeBefore) custom[k].made += 1;
    });
    const customRows = Object.entries(custom).map(([label, v]) => ({ label, value: v.total, text: `${v.total} pesanan · ${v.made} pernah dibuat` })).sort((a, b) => b.value - a.value);

    return { byProduct, byCategory, payRows, customRows };
  }, [products, orders, soldOf]);

  const stats = [
    { icon: Package, value: t.units, label: 'Total unit terjual' },
    { icon: Wallet, value: formatRupiah(t.revenue), label: 'Perkiraan omzet', small: true },
    { icon: Store, value: t.offlineUnits, label: 'Terjual di toko / WA' },
    { icon: Hammer, value: t.customUnits, label: 'Custom selesai dibuat' },
  ];

  return (
    <div>
      <PageHeader title="Penjualan" desc="Ringkasan penjualan untuk owner. Terisi dari pesanan berstatus Selesai dan catatan penjualan yang Anda input di halaman Produk." />

      <div className="mb-6 flex items-start gap-3 rounded-xl border border-wood/30 bg-white p-4">
        <Info size={20} className="mt-0.5 shrink-0 text-teak" />
        <p className="text-[15px] text-muted">Ini penghitung penjualan sederhana, bukan pembukuan lengkap. Omzet dihitung dari harga katalog; pesanan custom belum dihitung karena harganya disepakati lewat WhatsApp. Untuk mencatat penjualan di toko, buka <Link to="/admin/products" className="font-semibold text-teak hover:underline">Produk</Link> lalu klik "Catat terjual".</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((st, idx) => (
          <StatCard key={st.label} {...st} accent={idx === 1} />
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="luxury-panel p-6">
          <h2 className="font-heading text-xl font-bold">Produk terlaris</h2>
          <Bars rows={data.byProduct.map((p) => ({ label: p.name, value: p.total, text: `${p.total}× (${p.online} online, ${p.offline} toko)` }))} empty="Belum ada penjualan tercatat." />
        </section>
        <section className="luxury-panel p-6">
          <h2 className="font-heading text-xl font-bold">Kategori dengan omzet terbesar</h2>
          <Bars rows={data.byCategory} empty="Belum ada penjualan tercatat." />
        </section>
        <section className="luxury-panel p-6">
          <h2 className="font-heading text-xl font-bold">Cara bayar yang dipilih pelanggan</h2>
          <Bars rows={data.payRows} empty="Belum ada pesanan masuk." />
        </section>
        <section className="luxury-panel p-6">
          <h2 className="font-heading text-xl font-bold">Pesanan custom per jenis</h2>
          <Bars rows={data.customRows} empty="Belum ada pesanan custom." />
        </section>

        <section className="luxury-panel p-6 lg:col-span-2">
          <h2 className="font-heading text-xl font-bold">Riwayat penjualan di toko</h2>
          {sales.length === 0 ? <p className="mt-4 text-muted">Belum ada catatan. Klik "Catat terjual" di halaman Produk saat ada barang yang laku di toko atau lewat WhatsApp.</p> : (
            <ul className="mt-4 divide-y divide-line">
              {sales.slice(0, 10).map((x) => {
                const p = products.find((q) => q.id === x.productId);
                return (
                  <li key={x.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="font-medium">{p?.name ?? 'Produk dihapus'} <span className="font-normal text-muted">× {x.quantity}</span></p>
                      <p className="text-sm text-muted">{new Date(x.date).toLocaleDateString('id-ID', { dateStyle: 'long' })}{x.note ? ` · ${x.note}` : ''}</p>
                    </div>
                    <button onClick={() => { if (window.confirm('Hapus catatan penjualan ini? Jumlah terjual akan berkurang.')) { removeSale(x.id); toast.success('Catatan dihapus'); } }} className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-red-700 hover:bg-red-50" aria-label="Hapus catatan penjualan"><Trash2 size={17} /></button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
