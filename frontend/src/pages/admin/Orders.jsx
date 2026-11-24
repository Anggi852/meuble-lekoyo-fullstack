import { useState } from 'react';
import {
  ShoppingBag,
  MapPin,
  Wallet,
  History,
  Phone,
  MessageCircle,
  ShieldCheck,
  Tag,
  CheckCircle2,
  Mail,
} from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '../../context/AppContext';
import { PageHeader, RowActions, confirmDelete } from '../../components/admin/ui';
import { formatRupiah } from '../../utils/format';
import { customKey } from '../../utils/sales';
import { buildCustomerWhatsAppReplyLink } from '../../utils/phone';

const statuses = [
  'Menunggu Harga Owner',
  'Harga Ditetapkan',
  'Menunggu Konfirmasi WA',
  'Diproses',
  'Selesai',
  'Dibatalkan',
];

const normalizeStatus = (s) => (s === 'Baru' ? 'Menunggu Harga Owner' : s);

const tone = {
  'Menunggu Harga Owner': 'bg-amber-100 text-amber-800 border border-amber-300',
  'Harga Ditetapkan': 'bg-blue-100 text-blue-800 border border-blue-300',
  'Menunggu Konfirmasi WA': 'bg-gold/20 text-[#7a5e00] border border-gold/40',
  Diproses: 'bg-sand text-teak',
  Selesai: 'bg-green-100 text-green-800',
  Dibatalkan: 'bg-red-50 text-red-700',
};

function OwnerPricingBox({ order, onSave }) {
  const [priceInput, setPriceInput] = useState(
    order.finalPrice != null ? String(order.finalPrice) : String(order.estimatedPrice || order.total || ''),
  );
  const [noteInput, setNoteInput] = useState(order.ownerNote || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    const numericPrice = Number(String(priceInput).replace(/[^\d]/g, ''));
    if (!numericPrice || numericPrice <= 0) {
      toast.error('Masukkan nominal harga final yang valid.');
      return;
    }
    setSaving(true);
    try {
      await onSave(order.id, {
        finalPrice: numericPrice,
        ownerNote: noteInput.trim(),
      });
      toast.success(`Harga final ${order.orderCode || `#${order.id}`} disimpan.`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSave}
      className="mt-4 rounded-xl border border-gold/35 bg-sand/40 p-3.5 sm:p-4"
    >
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-sm font-bold text-espresso">
          <Tag size={15} className="text-gold-dark" /> Penetapan Harga Final Owner
        </p>
        {order.finalPrice != null && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
            <CheckCircle2 size={13} /> Ditetapkan: {formatRupiah(order.finalPrice)}
          </span>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">
            Harga Final (Rp)
          </label>
          <input
            type="number"
            min="0"
            step="50000"
            value={priceInput}
            onChange={(e) => setPriceInput(e.target.value)}
            placeholder="Contoh: 4500000"
            className="field !py-2 text-sm"
          />
          {order.estimatedPrice > 0 && (
            <p className="mt-1 text-[11px] text-muted">
              Estimasi awal: {formatRupiah(order.estimatedPrice)}
            </p>
          )}
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-muted">
            Catatan untuk Pelanggan (tampil di halaman Pesanan Saya)
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              placeholder="Contoh: Harga sudah termasuk ongkir Kota Jambi & finishing melamin"
              className="field flex-1 !py-2 text-sm"
            />
            <button
              type="submit"
              disabled={saving}
              className="btn-primary !min-h-[40px] shrink-0 !px-4 text-sm"
            >
              {saving ? 'Menyimpan...' : 'Simpan Harga'}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}

export default function Orders() {
  const { orders, updateOrderStatus, updateOrder, removeOrder } = useApp();
  const [filter, setFilter] = useState('Semua');
  const list =
    filter === 'Semua'
      ? orders
      : orders.filter((o) => normalizeStatus(o.status) === filter);

  return (
    <div>
      <PageHeader
        title="Pesanan masuk"
        desc="Setiap pengajuan masuk dengan kode unik dan menunggu penetapan harga dari owner. Omzet & laporan penjualan hanya menghitung pesanan berstatus Selesai."
      />

      <div className="mb-5 flex items-start gap-3 rounded-2xl border border-sage/30 bg-white/95 p-4 shadow-soft">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-sage/10 text-sage">
          <ShieldCheck size={18} />
        </span>
        <p className="text-sm leading-relaxed text-muted">
          <strong className="text-espresso">Anti-pesanan iseng aktif:</strong> formulir mewajibkan nomor WhatsApp valid, checkbox komitmen, dan pembatas maksimal 3 pengajuan / 15 menit. Bila pemesan tidak menindaklanjuti di WhatsApp, ubah status ke <strong>Dibatalkan</strong> atau hapus.
        </p>
      </div>

      <div className="no-scrollbar mb-5 flex gap-2 overflow-x-auto pb-1 sm:flex-wrap">
        {['Semua', ...statuses].map((s) => {
          const count =
            s === 'Semua'
              ? orders.length
              : orders.filter((o) => normalizeStatus(o.status) === s).length;
          return (
            <button
              key={s}
              onClick={() => setFilter(s)}
              aria-pressed={filter === s}
              className={`min-h-[40px] shrink-0 rounded-full px-4 text-sm font-medium transition ${
                filter === s
                  ? 'border border-gold/40 bg-espresso text-gold-light shadow-soft'
                  : 'border border-line bg-white text-muted hover:border-gold hover:text-espresso'
              }`}
            >
              {s} ({count})
            </button>
          );
        })}
      </div>

      {list.length === 0 ? (
        <div className="card px-6 py-14 text-center">
          <ShoppingBag size={40} className="mx-auto text-wood" />
          <p className="mt-4 text-lg font-semibold">
            {orders.length === 0 ? 'Belum ada pengajuan pesanan masuk' : 'Tidak ada pesanan dengan status ini'}
          </p>
          {orders.length === 0 && (
            <p className="mx-auto mt-1 max-w-md text-muted">
              Pengajuan pesanan akan muncul otomatis saat pelanggan mengirim form produk, Studio Custom, atau lewat chat Koyo.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {list.map((o) => {
            const displayStatus = normalizeStatus(o.status);
            const customerWaLink = buildCustomerWhatsAppReplyLink(o);
            const same = o.custom ? orders.filter((x) => x.id !== o.id && customKey(x) === customKey(o)) : [];
            const sameDone = same.filter((x) => x.status === 'Selesai' || x.madeBefore).length;
            const last = same[0];
            const noteFromPast = same.find((x) => x.madeNote)?.madeNote;

            return (
              <article key={o.id} className="luxury-panel p-4 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                      {o.orderCode && (
                        <span className="rounded-lg bg-espresso px-2.5 py-0.5 font-mono text-xs font-bold tracking-wider text-gold-light">
                          {o.orderCode}
                        </span>
                      )}
                      {o.custom && (
                        <span className="rounded-full bg-gold/20 px-2.5 py-0.5 text-xs font-bold text-teak-dark">
                          CUSTOM
                        </span>
                      )}
                    </div>
                    <h2 className="text-lg font-semibold">
                      {o.product} <span className="font-normal text-muted">x{o.quantity}</span>
                    </h2>
                    <p className="text-sm text-muted">
                      {new Date(o.createdAt).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })}
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${tone[displayStatus] || 'bg-sand text-teak'}`}>
                    {displayStatus}
                  </span>
                </div>

                {o.custom && (
                  <div className="mt-3 space-y-1 rounded-xl bg-cream p-3.5 text-sm text-bark">
                    <p>
                      <b>Finishing:</b> {o.custom.finish}
                      {o.custom.wood ? (
                        <>
                          {' '}· <b>Konstruksi:</b> {o.custom.wood}
                        </>
                      ) : null}
                    </p>
                    <p><b>Spesifikasi:</b> {o.custom.options}</p>
                    {o.custom.needBy && <p><b>Dibutuhkan sebelum:</b> {o.custom.needBy}</p>}
                    {o.custom.note && <p><b>Catatan:</b> {o.custom.note}</p>}
                    {o.custom.hasPhoto && (
                      <p className="text-muted">
                        Pelanggan menyiapkan {o.custom.photoCount || 1} foto/sketsa referensi untuk dikirim lewat WhatsApp.
                      </p>
                    )}
                  </div>
                )}

                {o.custom && (
                  <div className="mt-3 rounded-xl border border-wood/30 bg-white p-3.5 text-sm">
                    {same.length > 0 && (
                      <p className="mb-3 flex items-start gap-2 rounded-lg bg-sand p-3 text-bark">
                        <History size={17} className="mt-0.5 shrink-0 text-teak" />
                        <span>
                          Rancangan yang sama sudah pernah dipesan <b>{same.length}×</b>
                          {sameDone > 0 && <> dan <b>{sameDone}×</b> sudah dibuat</>}. Terakhir finishing {last.custom.finish},{' '}
                          {new Date(last.createdAt).toLocaleDateString('id-ID', { dateStyle: 'long' })}.
                          {noteFromPast && <> Catatan sebelumnya: <i>{noteFromPast}</i></>}
                        </span>
                      </p>
                    )}
                    <label className="flex cursor-pointer items-center gap-2.5 font-medium text-bark">
                      <input
                        type="checkbox"
                        checked={!!o.madeBefore}
                        onChange={(e) => updateOrder(o.id, { madeBefore: e.target.checked })}
                        className="h-5 w-5 accent-teak"
                      />
                      Pernah dibuat sebelumnya
                    </label>
                    {o.madeBefore && (
                      <textarea
                        value={o.madeNote || ''}
                        onChange={(e) => updateOrder(o.id, { madeNote: e.target.value })}
                        rows={2}
                        className="field mt-2.5 !py-2 text-sm"
                        placeholder="Catatan untuk pesanan serupa: harga yang disepakati, lama pengerjaan, bahan, hal yang perlu diperhatikan"
                      />
                    )}
                  </div>
                )}

                <dl className="mt-4 grid gap-3 text-[15px] sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <dt className="text-sm text-muted">Pemesan</dt>
                    <dd className="font-medium">{o.name}</dd>
                    {o.customerEmail && (
                      <dd className="mt-0.5 flex items-center gap-1 text-xs text-muted">
                        <Mail size={12} /> {o.customerEmail}
                      </dd>
                    )}
                  </div>
                  <div>
                    <dt className="flex items-center gap-1 text-sm text-muted"><Phone size={14} /> WhatsApp</dt>
                    <dd className="font-medium">{o.phone || <span className="text-muted">Belum tercatat</span>}</dd>
                  </div>
                  <div>
                    <dt className="flex items-center gap-1 text-sm text-muted"><MapPin size={14} /> Alamat</dt>
                    <dd className="font-medium">{o.address}</dd>
                    {o.latitude != null && o.longitude != null && (
                      <dd className="mt-1">
                        <a
                          href={`https://www.google.com/maps?q=${o.latitude},${o.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-teak underline"
                        >
                          <MapPin size={12} /> Buka Titik Maps
                        </a>
                      </dd>
                    )}
                  </div>
                  <div>
                    <dt className="flex items-center gap-1 text-sm text-muted"><Wallet size={14} /> Pembayaran</dt>
                    <dd className="font-medium">
                      {o.payment}
                      {o.finalPrice != null
                        ? ` · Final ${formatRupiah(o.finalPrice)}`
                        : o.total > 0
                          ? ` · Est. ${formatRupiah(o.total)}`
                          : ' · harga via Owner'}
                    </dd>
                  </div>
                </dl>

                {/* Kotak Penetapan Harga Final Owner */}
                <OwnerPricingBox order={o} onSave={updateOrder} />

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <label className="flex items-center gap-2 text-sm font-medium">
                      Status:
                      <select
                        value={displayStatus}
                        onChange={(e) => {
                          updateOrderStatus(o.id, e.target.value);
                          toast.success('Status diperbarui');
                        }}
                        className="field !w-auto !py-2 text-sm"
                      >
                        {statuses.map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>
                    </label>
                    {customerWaLink && (
                      <a
                        href={customerWaLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-sage px-3.5 py-2 text-sm font-semibold text-white shadow-soft transition hover:opacity-95"
                      >
                        <MessageCircle size={15} /> Hubungi Pemesan via WA
                      </a>
                    )}
                  </div>
                  <RowActions
                    name={`pesanan ${o.name}`}
                    onDelete={() => confirmDelete(`pesanan ${o.name}`, () => removeOrder(o.id))}
                  />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}