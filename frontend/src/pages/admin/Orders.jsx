import { useState } from 'react';
import { ShoppingBag, MapPin, Wallet, History, Phone, MessageCircle, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '../../context/AppContext';
import { PageHeader, RowActions, confirmDelete } from '../../components/admin/ui';
import { formatRupiah } from '../../utils/format';
import { customKey } from '../../utils/sales';
import { buildCustomerWhatsAppReplyLink } from '../../utils/phone';

const statuses = ['Menunggu Konfirmasi WA', 'Diproses', 'Selesai', 'Dibatalkan'];
const normalizeStatus = (s) => (s === 'Baru' ? 'Menunggu Konfirmasi WA' : s);
const tone = {
  'Menunggu Konfirmasi WA': 'bg-gold/20 text-[#7a5e00] border border-gold/40',
  Diproses: 'bg-sand text-teak',
  Selesai: 'bg-green-100 text-green-800',
  Dibatalkan: 'bg-red-50 text-red-700',
};

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
        desc="Setiap pengajuan formulir masuk dengan status Menunggu Konfirmasi WA. Omzet & laporan penjualan hanya menghitung pesanan berstatus Selesai."
      />

      <div className="mb-5 flex items-start gap-3 rounded-2xl border border-sage/30 bg-white/95 p-4 shadow-soft">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-sage/10 text-sage">
          <ShieldCheck size={18} />
        </span>
        <p className="text-sm leading-relaxed text-muted">
          <strong className="text-espresso">Anti-pesanan iseng aktif:</strong> formulir kini mewajibkan nomor WhatsApp valid, checkbox komitmen, dan pembatas maksimal 3 pengajuan / 15 menit. Bila pemesan tidak menindaklanjuti di WhatsApp, cukup ubah status ke <strong>Dibatalkan</strong> atau hapus.
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
                    <h2 className="text-lg font-semibold">
                      {o.custom && (
                        <span className="mr-2 rounded-full bg-gold/20 px-2.5 py-0.5 align-middle text-xs font-bold text-teak-dark">
                          CUSTOM
                        </span>
                      )}
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
                  </div>
                  <div>
                    <dt className="flex items-center gap-1 text-sm text-muted"><Phone size={14} /> WhatsApp</dt>
                    <dd className="font-medium">{o.phone || <span className="text-muted">Belum tercatat</span>}</dd>
                  </div>
                  <div>
                    <dt className="flex items-center gap-1 text-sm text-muted"><MapPin size={14} /> Alamat</dt>
                    <dd className="font-medium">{o.address}</dd>
                  </div>
                  <div>
                    <dt className="flex items-center gap-1 text-sm text-muted"><Wallet size={14} /> Pembayaran</dt>
                    <dd className="font-medium">
                      {o.payment}
                      {o.total > 0 ? ` · ${formatRupiah(o.total)}` : ' · harga via WhatsApp'}
                    </dd>
                  </div>
                </dl>

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
