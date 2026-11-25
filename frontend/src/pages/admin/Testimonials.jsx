import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Eye, EyeOff, Package, Star } from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '../../context/AppContext';
import Modal from '../../components/Modal';
import { AddButton, PageHeader, RowActions, confirmDelete } from '../../components/admin/ui';

const EMPTY = {
  name: '',
  city: '',
  text: '',
  rating: 5,
  productId: '',
  productName: '',
  showOnHome: true,
};

export default function Testimonials() {
  const { products, testimonials, saveTestimonial, removeTestimonial } = useApp();
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);

  const openNew = () => setModal({ ...EMPTY });
  const openEdit = (t) =>
    setModal({
      id: t.id,
      name: t.name || '',
      city: t.city || '',
      text: t.text || '',
      rating: t.rating || 5,
      productId: t.productId ?? '',
      productName: t.productName || '',
      showOnHome: t.showOnHome !== false,
    });

  const handleProductSelect = (val) => {
    if (!val) {
      setModal((prev) => ({ ...prev, productId: '', productName: '' }));
      return;
    }
    const found = products.find((p) => String(p.id) === String(val));
    setModal((prev) => ({
      ...prev,
      productId: found ? found.id : '',
      productName: found ? found.name : prev.productName,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!modal.name.trim() || !modal.city.trim() || !modal.text.trim()) {
      toast.error('Nama, kota asal, dan isi testimoni wajib diisi.');
      return;
    }
    setSaving(true);
    try {
      await saveTestimonial({
        ...modal,
        name: modal.name.trim(),
        city: modal.city.trim(),
        text: modal.text.trim(),
        rating: Number(modal.rating) || 5,
        productId: modal.productId === '' ? null : Number(modal.productId),
        productName: modal.productName.trim(),
        showOnHome: Boolean(modal.showOnHome),
      });
      toast.success(modal.id ? 'Perubahan testimoni disimpan' : 'Testimoni ditambahkan');
      setModal(null);
    } finally {
      setSaving(false);
    }
  };

  const toggleHomeVisibility = async (t) => {
    const next = t.showOnHome === false;
    await saveTestimonial({ ...t, showOnHome: next });
    toast.success(next ? 'Ditampilkan di Beranda' : 'Disembunyikan dari Beranda (tetap tampil di produk)');
  };

  const homeCount = testimonials.filter((t) => t.showOnHome !== false).length;

  return (
    <div>
      <PageHeader
        title="Testimoni & Ulasan"
        desc="Kelola testimoni toko untuk Beranda sekaligus ulasan pembeli terverifikasi per produk."
        action={<AddButton onClick={openNew}>Tambah testimoni</AddButton>}
      />

      {homeCount < 5 && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-gold/50 bg-white p-4">
          <AlertTriangle size={20} className="mt-0.5 shrink-0 text-gold" />
          <p className="text-[15px]">
            Saat ini baru {homeCount} testimoni yang tampil di Beranda. Disarankan minimal 5 agar makin meyakinkan pembeli luar daerah.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {testimonials.map((t) => {
          const stars = Math.min(5, Math.max(1, Number(t.rating) || 5));
          const isCustomer = t.source === 'customer';
          const shownHome = t.showOnHome !== false;

          return (
            <div
              key={t.id}
              className="luxury-panel flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-espresso">
                    {t.name} <span className="font-normal text-muted">· {t.city}</span>
                  </p>
                  <span className="inline-flex items-center gap-0.5 text-gold">
                    {[...Array(5)].map((_, k) => (
                      <Star
                        key={k}
                        size={13}
                        fill={k < stars ? 'currentColor' : 'none'}
                        className={k < stars ? 'text-gold' : 'text-line'}
                      />
                    ))}
                  </span>
                  {isCustomer ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
                      <CheckCircle2 size={11} /> Ulasan Pembeli
                    </span>
                  ) : (
                    <span className="rounded-full bg-sand px-2.5 py-0.5 text-[11px] font-semibold text-teak">
                      Input Owner
                    </span>
                  )}
                </div>

                {t.productName && (
                  <p className="mt-1.5 inline-flex items-center gap-1 rounded-lg border border-gold/30 bg-cream px-2.5 py-0.5 text-xs font-semibold text-teak">
                    <Package size={12} /> {t.productName}
                  </p>
                )}

                <p className="mt-2 text-[15px] text-muted">"{t.text}"</p>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                <button
                  type="button"
                  onClick={() => toggleHomeVisibility(t)}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                    shownHome
                      ? 'border-sage/35 bg-sage/10 text-sage hover:bg-sage/20'
                      : 'border-line bg-white text-muted hover:border-teak hover:text-espresso'
                  }`}
                  title="Atur apakah testimoni ini tampil di halaman Beranda"
                >
                  {shownHome ? <Eye size={14} /> : <EyeOff size={14} />}
                  {shownHome ? 'Tampil di Beranda' : 'Hanya di Produk'}
                </button>
                <RowActions
                  name={t.name}
                  onEdit={() => openEdit(t)}
                  onDelete={() => confirmDelete(t.name, () => removeTestimonial(t.id))}
                />
              </div>
            </div>
          );
        })}
      </div>

      <AnimatePresence>
        {modal && (
          <Modal title={modal.id ? 'Ubah testimoni' : 'Tambah testimoni'} onClose={() => setModal(null)}>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-bark">Nama pelanggan</label>
                  <input
                    className="field"
                    value={modal.name}
                    onChange={(e) => setModal((p) => ({ ...p, name: e.target.value }))}
                    placeholder="Contoh: Ibu Maya"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-bark">Kota asal</label>
                  <input
                    className="field"
                    value={modal.city}
                    onChange={(e) => setModal((p) => ({ ...p, city: e.target.value }))}
                    placeholder="Contoh: Palembang"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-bark">Rating bintang</label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setModal((p) => ({ ...p, rating: n }))}
                      className="rounded-lg p-1.5 transition hover:bg-sand"
                      aria-label={`${n} bintang`}
                    >
                      <Star
                        size={22}
                        fill={n <= modal.rating ? '#C9A227' : 'none'}
                        className={n <= modal.rating ? 'text-gold' : 'text-line'}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-sm font-semibold text-teak">{modal.rating} / 5</span>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-bark">
                  Pilih produk katalog (opsional — agar muncul juga di halaman produk)
                </label>
                <select
                  className="field"
                  value={modal.productId}
                  onChange={(e) => handleProductSelect(e.target.value)}
                >
                  <option value="">— Testimoni Umum / Pesanan Custom —</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-bark">
                  Label produk yang dibeli (opsional)
                </label>
                <input
                  className="field"
                  value={modal.productName}
                  onChange={(e) => setModal((p) => ({ ...p, productName: e.target.value }))}
                  placeholder="Contoh: Custom Lemari 3 Pintu Jati / Kitchen Set"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-bark">Isi testimoni</label>
                <textarea
                  rows={3}
                  className="field"
                  value={modal.text}
                  onChange={(e) => setModal((p) => ({ ...p, text: e.target.value }))}
                  placeholder="Tulis pengalaman pelanggan..."
                  required
                />
              </div>

              <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-line bg-cream/70 px-3.5 py-2.5 text-sm font-medium text-bark">
                <input
                  type="checkbox"
                  checked={modal.showOnHome}
                  onChange={(e) => setModal((p) => ({ ...p, showOnHome: e.target.checked }))}
                  className="h-4 w-4 accent-[#6E3F22]"
                />
                Tampilkan testimoni ini di halaman Beranda
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setModal(null)} className="btn-outline !min-h-[42px] text-sm">
                  Batal
                </button>
                <button type="submit" disabled={saving} className="btn-primary !min-h-[42px] text-sm">
                  {saving ? 'Menyimpan...' : modal.id ? 'Simpan Perubahan' : 'Tambah Testimoni'}
                </button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}