import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Camera,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  EyeOff,
  Globe,
  Images,
  MapPin,
  Plus,
  Ruler,
  Search,
  Star,
  UserCheck,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CUSTOM_CATEGORIES, CUSTOM_TYPE_KEYS, TYPES } from '../../data/custom';
import { formatRupiah } from '../../utils/format';
import { getProductImages } from '../../utils/image';
import FormModal from '../../components/FormModal';
import Modal from '../../components/Modal';
import PhotoUploader from '../../components/admin/PhotoUploader';
import ResponsiveImage from '../../components/ResponsiveImage';
import { AddButton, PageHeader, RowActions, confirmDelete } from '../../components/admin/ui';

const CATEGORY_OPTIONS = CUSTOM_CATEGORIES.filter((c) => c !== 'Semua');

const fields = [
  { name: 'name', label: 'Nama karya custom', required: true, placeholder: 'Contoh: Kitchen Set Jati Huruf L + Minibar' },
  { name: 'category', label: 'Jenis furnitur', type: 'select', options: CATEGORY_OPTIONS },
  { name: 'size', label: 'Ukuran / Dimensi', required: true, placeholder: 'Contoh: P 320 × T 235 × D 62 cm' },
  { name: 'finish', label: 'Warna finishing', required: true, placeholder: 'Contoh: Natural Jati (Doff)' },
  { name: 'city', label: 'Kota pemesan', required: true, placeholder: 'Contoh: Telanaipura, Kota Jambi' },
  { name: 'year', label: 'Tahun pembuatan', placeholder: '2026' },
  { name: 'price', label: 'Referensi harga (Rp, opsional)', type: 'number', placeholder: '4500000' },
  { name: 'description', label: 'Deskripsi singkat', type: 'textarea', required: true },
  {
    name: 'images',
    label: 'Foto hasil jadi (maks. 4 foto)',
    type: 'photos',
    max: 4,
    required: true,
    hint: 'Upload langsung foto hasil jadi dari galeri HP/laptop (depan, samping, belakang, detail).',
  },
  { name: 'customerName', label: 'Nama pemesan (opsional)', placeholder: 'Contoh: Ibu Rina' },
  { name: 'customerFeedback', label: 'Feedback pemesan (opsional)', type: 'textarea', placeholder: 'Ulasan singkat dari pemesan...' },
  { name: 'showFeedback', label: 'Tampilkan nama & feedback pemesan ke publik', type: 'checkbox' },
  { name: 'isPublished', label: 'Setujui & tampilkan di Katalog Publik', type: 'checkbox' },
];

const blank = {
  name: '',
  category: 'Kitchen Set',
  size: '',
  finish: 'Natural Jati (Doff)',
  city: 'Kota Jambi',
  year: String(new Date().getFullYear()),
  price: '',
  description: '',
  images: [],
  customerName: '',
  customerFeedback: '',
  showFeedback: true,
  isPublished: true,
};

function guessCategory(order) {
  const fromType = order?.custom?.design?.type && TYPES[order.custom.design.type]?.label;
  if (fromType && CATEGORY_OPTIONS.includes(fromType)) return fromType;
  if (order?.custom?.categoryLabel && CATEGORY_OPTIONS.includes(order.custom.categoryLabel)) {
    return order.custom.categoryLabel;
  }
  return 'Bebas Request';
}

function guessCity(address = '') {
  const parts = String(address).split(',').map((s) => s.trim()).filter(Boolean);
  return parts[parts.length - 1] || 'Kota Jambi';
}

export default function CustomGallery({ embedded = false, addSignal = 0, onAddConsumed }) {
  const {
    customPortfolio,
    orders,
    testimonials,
    saveCustomPortfolio,
    removeCustomPortfolio,
    publishCustomOrder,
    togglePortfolioPublish,
  } = useApp();

  const [modal, setModal] = useState(null);
  const [approveOrder, setApproveOrder] = useState(null);
  const [approvePhotos, setApprovePhotos] = useState([]);
  const [approveShowFeedback, setApproveShowFeedback] = useState(true);
  const [approving, setApproving] = useState(false);

  const [filter, setFilter] = useState('Semua');
  const [query, setQuery] = useState('');
  const [collapsed, setCollapsed] = useState({});

  useEffect(() => {
    if (addSignal > 0) {
      const validCat = CATEGORY_OPTIONS.includes(filter) ? filter : 'Kitchen Set';
      setModal({ ...blank, category: validCat });
      onAddConsumed?.();
    }
  }, [addSignal, filter, onAddConsumed]);

  // Pesanan custom yang sudah berstatus Selesai namun belum disetujui masuk ke Karya Pernah Dicustom
  const pendingCompletedOrders = useMemo(() => {
    return orders.filter((o) => {
      if (!o.custom || o.status !== 'Selesai') return false;
      const alreadyLinked = customPortfolio.some(
        (c) => Number(c.orderId) === Number(o.id) || Number(c.id) === Number(o.publishedPortfolioId),
      );
      return !alreadyLinked;
    });
  }, [orders, customPortfolio]);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return customPortfolio.filter((item) => {
      if (filter !== 'Semua' && item.category !== filter) return false;
      if (q) {
        const hay = `${item.name} ${item.category} ${item.city || ''} ${item.finish || ''} ${item.customerName || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [customPortfolio, filter, query]);

  const grouped = useMemo(() => {
    const map = new Map();
    for (const item of list) {
      const key = item.category || 'Lainnya';
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(item);
    }
    return [...map.entries()].sort((a, b) => {
      const ia = CATEGORY_OPTIONS.indexOf(a[0]);
      const ib = CATEGORY_OPTIONS.indexOf(b[0]);
      return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    });
  }, [list]);

  const submit = (v) => {
    const typeKey = CUSTOM_TYPE_KEYS.find((k) => TYPES[k].label === v.category) || 'lainnya';
    const imgs = getProductImages(v);
    const numPrice = v.price !== '' && v.price != null ? Number(v.price) : null;
    saveCustomPortfolio({
      ...v,
      typeKey,
      price: Number.isFinite(numPrice) && numPrice > 0 ? numPrice : null,
      images: imgs,
      image: imgs[0]?.url || '',
    });
    setModal(null);
    toast.success(v.id ? 'Karya custom diperbarui' : 'Karya custom ditambahkan ke galeri');
  };

  const openApproveModal = (order) => {
    setApproveOrder(order);
    setApprovePhotos(Array.isArray(order.finishedPhotos) ? order.finishedPhotos : []);
    setApproveShowFeedback(true);
  };

  const confirmApproveOrder = async () => {
    if (!approveOrder) return;
    if (approvePhotos.length === 0) {
      toast.error('Upload minimal 1 foto barang yang sudah jadi terlebih dahulu.');
      return;
    }
    setApproving(true);
    try {
      const review = testimonials.find((t) => Number(t.orderId) === Number(approveOrder.id));
      const category = guessCategory(approveOrder);
      const typeKey =
        approveOrder.custom?.design?.type ||
        CUSTOM_TYPE_KEYS.find((k) => TYPES[k].label === category) ||
        'lainnya';
      const preset = approveOrder.custom?.design
        ? {
            dims: approveOrder.custom.design.dims,
            opts: approveOrder.custom.design.opts,
            finish: approveOrder.custom.design.finish,
          }
        : undefined;

      await publishCustomOrder(approveOrder, {
        name: approveOrder.custom?.title || approveOrder.product,
        typeKey,
        category,
        size: approveOrder.custom?.size || 'Sesuai pesanan',
        finish: approveOrder.custom?.finish || 'Natural Jati (Doff)',
        city: review?.city || guessCity(approveOrder.address),
        year: String(new Date().getFullYear()),
        description:
          approveOrder.custom?.options ||
          `Hasil pesanan custom ${approveOrder.custom?.title || approveOrder.product} kayu jati solid.`,
        images: approvePhotos,
        image: approvePhotos[0]?.url || '',
        preset,
        customerName: approveOrder.name,
        customerFeedback: review?.text || '',
        customerRating: review?.rating || null,
        showFeedback: approveShowFeedback,
        price: approveOrder.finalPrice ?? approveOrder.total ?? null,
        isPublished: true,
      });
      toast.success('Disetujui! Foto hasil jadi & karya custom kini tayang di Katalog Publik.');
      setApproveOrder(null);
    } finally {
      setApproving(false);
    }
  };

  const renderCard = (item) => {
    const photos = getProductImages(item);
    const isPublished = item.isPublished !== false;
    const matchedReview = item.orderId
      ? testimonials.find((t) => Number(t.orderId) === Number(item.orderId))
      : null;
    const feedbackText = item.customerFeedback || matchedReview?.text || '';
    const feedbackRating = item.customerRating || matchedReview?.rating || null;

    return (
      <article
        key={item.id}
        className={`luxury-panel flex flex-col gap-3 p-4 transition hover:border-gold/55 ${
          !isPublished ? 'border-amber-300 bg-amber-50/35' : ''
        }`}
      >
        <div className="flex gap-3.5">
          <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-xl bg-sand">
            <ResponsiveImage
              src={photos[0]?.url || item.image}
              alt={item.name}
              widths={[200, 360]}
              sizes="96px"
              defaultWidth={240}
              className="h-full w-full object-cover"
            />
            <span className="absolute bottom-1 right-1 inline-flex items-center gap-0.5 rounded-full bg-espresso/85 px-1.5 py-0.5 text-[10px] font-bold text-gold-light">
              <Images size={9} /> {photos.length}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  isPublished
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {isPublished ? <><Globe size={10} /> Tayang Publik</> : <><EyeOff size={10} /> Disembunyikan</>}
              </span>
              {(item.orderId || item.customerName) && (
                <span className="inline-flex items-center gap-1 rounded-full bg-sand px-2 py-0.5 text-[10px] font-bold text-teak">
                  <UserCheck size={10} /> {item.customerName || 'Pesanan Pelanggan'}
                </span>
              )}
            </div>
            <h3 className="font-heading mt-1 truncate text-base font-bold text-espresso">{item.name}</h3>
            <p className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-teak">
              <Ruler size={11} /> {item.size}
              {item.price > 0 && <span className="text-muted"> · Ref. {formatRupiah(item.price)}</span>}
            </p>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
              <MapPin size={11} /> {item.city} · {item.finish}
            </p>
          </div>
        </div>

        <p className="line-clamp-2 text-xs leading-relaxed text-muted">{item.description}</p>

        {feedbackText && (
          <div className="rounded-xl border border-gold/25 bg-cream/85 px-3 py-2 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-espresso">
                Feedback {item.customerName || matchedReview?.name || 'Pemesan'}
              </span>
              {feedbackRating && (
                <span className="flex gap-0.5 text-gold">
                  {[...Array(5)].map((_, k) => (
                    <Star
                      key={k}
                      size={11}
                      fill={k < feedbackRating ? 'currentColor' : 'none'}
                      className={k < feedbackRating ? 'text-gold' : 'text-line'}
                    />
                  ))}
                </span>
              )}
            </div>
            <p className="mt-0.5 line-clamp-2 italic text-bark">"{feedbackText}"</p>
          </div>
        )}

        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-line/70 pt-2.5">
          <button
            type="button"
            onClick={async () => {
              await togglePortfolioPublish(item, !isPublished);
              toast.success(
                !isPublished
                  ? 'Disetujui! Karya kini tayang di Katalog Publik.'
                  : 'Karya disembunyikan dari Katalog Publik.',
              );
            }}
            className={`inline-flex min-h-[34px] items-center gap-1 rounded-xl border px-3 py-1 text-xs font-semibold transition ${
              isPublished
                ? 'border-line bg-white text-muted hover:border-amber-400 hover:text-amber-800'
                : 'border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700'
            }`}
          >
            {isPublished ? (
              <>
                <EyeOff size={12} /> Sembunyikan
              </>
            ) : (
              <>
                <Globe size={12} /> Setujui &amp; Tayangkan
              </>
            )}
          </button>

          <RowActions
            name={item.name}
            onEdit={() =>
              setModal({
                ...item,
                price: item.price ?? '',
                images: photos,
                showFeedback: item.showFeedback !== false,
                isPublished: item.isPublished !== false,
              })
            }
            onDelete={() => confirmDelete(item.name, () => removeCustomPortfolio(item.id))}
          />
        </div>
      </article>
    );
  };

  return (
    <div>
      {!embedded && (
        <PageHeader
          title="Karya Pernah Dicustom"
          desc="Kelola foto hasil jadi pesanan custom, tinjau feedback pemesan, dan setujui karya mana yang boleh tayang di Katalog Publik."
          action={<AddButton onClick={() => setModal(blank)}>Tambah karya custom</AddButton>}
        />
      )}

      {/* Panel Pesanan Custom Selesai yang Menunggu Persetujuan Publikasi */}
      {pendingCompletedOrders.length > 0 && (
        <section className="mb-6 rounded-2xl border-2 border-gold/50 bg-gradient-to-br from-amber-50/80 via-cream to-sand/50 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gold-dark">
                <CheckCircle2 size={14} /> Menunggu Persetujuan Owner ({pendingCompletedOrders.length})
              </p>
              <h2 className="font-heading mt-0.5 text-lg font-bold text-espresso">
                Pesanan Custom Sudah Selesai — Siap Dipublikasikan
              </h2>
              <p className="text-xs text-muted">
                Unggah foto produk yang sudah jadi, cek feedback pemesan, lalu setujui agar pelanggan lain bisa langsung memesan model serupa.
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {pendingCompletedOrders.map((o) => {
              const rev = testimonials.find((t) => Number(t.orderId) === Number(o.id));
              const finished = Array.isArray(o.finishedPhotos) ? o.finishedPhotos : [];
              return (
                <article
                  key={o.id}
                  className="flex flex-col gap-2.5 rounded-xl border border-gold/35 bg-white p-3.5 shadow-soft"
                >
                  <div className="flex gap-3">
                    {finished[0]?.url ? (
                      <img
                        src={finished[0].url}
                        alt={o.product}
                        className="h-16 w-16 shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="grid h-16 w-16 shrink-0 place-items-center rounded-lg border border-dashed border-gold/50 bg-cream text-muted">
                        <Camera size={20} />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <span className="rounded bg-espresso px-2 py-0.5 font-mono text-[10px] font-bold text-gold-light">
                        {o.orderCode || `#${o.id}`}
                      </span>
                      <h3 className="mt-1 truncate text-sm font-bold text-espresso">
                        {o.custom?.title || o.product}
                      </h3>
                      <p className="text-xs text-muted">
                        Pemesan: <strong className="text-bark">{o.name}</strong> · {guessCity(o.address)}
                      </p>
                      {o.custom?.size && (
                        <p className="text-[11px] font-semibold text-teak">{o.custom.size}</p>
                      )}
                    </div>
                  </div>

                  {rev ? (
                    <div className="rounded-lg bg-emerald-50/70 px-2.5 py-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-emerald-800">Feedback Pemesan</span>
                        <span className="flex gap-0.5 text-gold">
                          {[...Array(5)].map((_, k) => (
                            <Star
                              key={k}
                              size={11}
                              fill={k < (Number(rev.rating) || 5) ? 'currentColor' : 'none'}
                              className={k < (Number(rev.rating) || 5) ? 'text-gold' : 'text-line'}
                            />
                          ))}
                        </span>
                      </div>
                      <p className="mt-0.5 line-clamp-2 italic text-bark">"{rev.text}"</p>
                    </div>
                  ) : (
                    <p className="text-[11px] text-muted">Pemesan belum mengirim feedback.</p>
                  )}

                  <div className="mt-auto flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => openApproveModal(o)}
                      className="btn-primary !min-h-[36px] !px-3.5 text-xs"
                    >
                      <Globe size={13} className="text-gold-light" />
                      {finished.length > 0 ? 'Tinjau & Setujui Publikasi' : 'Upload Foto Jadi & Publikasikan'}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* Pencarian Cepat */}
      <div className="relative mb-4 sm:max-w-sm">
        <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari nama karya, pemesan, atau kota..."
          className="field !min-h-[42px] !py-2 !pl-10 !pr-9 text-sm"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label="Hapus pencarian"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted hover:bg-sand hover:text-espresso"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Filter Pill Jenis Furnitur */}
      <div className="no-scrollbar mb-6 flex gap-2 overflow-x-auto pb-1 sm:flex-wrap">
        {CUSTOM_CATEGORIES.map((cat) => {
          const count = cat === 'Semua' ? customPortfolio.length : customPortfolio.filter((x) => x.category === cat).length;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setFilter(cat)}
              aria-pressed={filter === cat}
              className={`min-h-[38px] shrink-0 rounded-full px-4 text-sm font-medium transition ${
                filter === cat
                  ? 'border border-gold/40 bg-espresso text-gold-light shadow-soft'
                  : 'border border-line bg-white text-muted hover:border-gold hover:text-espresso'
              }`}
            >
              {cat} ({count})
            </button>
          );
        })}
      </div>

      {list.length === 0 ? (
        <p className="luxury-panel p-10 text-center text-muted">Belum ada karya custom yang sesuai filter.</p>
      ) : filter !== 'Semua' ? (
        <div className="grid gap-4 sm:grid-cols-2">{list.map(renderCard)}</div>
      ) : (
        <div className="space-y-6">
          {grouped.map(([cat, items]) => {
            const isCollapsed = Boolean(collapsed[cat]);
            return (
              <section key={cat} className="rounded-2xl border border-gold/25 bg-sand/35 p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setCollapsed((prev) => ({ ...prev, [cat]: !prev[cat] }))}
                    className="flex items-center gap-2 text-left"
                  >
                    <span className="grid h-7 w-7 place-items-center rounded-lg bg-espresso text-gold-light">
                      {isCollapsed ? <ChevronRight size={15} /> : <ChevronDown size={15} />}
                    </span>
                    <h2 className="font-heading text-lg font-bold text-espresso">{cat}</h2>
                    <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-bold text-teak shadow-soft">
                      {items.length} karya
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setModal({ ...blank, category: CATEGORY_OPTIONS.includes(cat) ? cat : 'Kitchen Set' })}
                    className="inline-flex items-center gap-1 rounded-full border border-gold/40 bg-white px-3 py-1 text-xs font-semibold text-teak transition hover:bg-espresso hover:text-gold-light"
                  >
                    <Plus size={13} /> Tambah {cat}
                  </button>
                </div>

                {!isCollapsed && (
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">{items.map(renderCard)}</div>
                )}
              </section>
            );
          })}
        </div>
      )}

      {/* Modal Persetujuan Publikasi Pesanan Selesai */}
      <AnimatePresence>
        {approveOrder && (
          <Modal title="Setujui & Publikasikan Karya Custom" onClose={() => setApproveOrder(null)}>
            <div className="rounded-xl bg-cream p-3.5 text-sm">
              <p className="font-bold text-espresso">{approveOrder.custom?.title || approveOrder.product}</p>
              <p className="mt-0.5 text-xs text-muted">
                Pemesan: {approveOrder.name} · {approveOrder.custom?.size || 'Sesuai pesanan'} · {approveOrder.custom?.finish}
              </p>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <p className="mb-2 text-sm font-semibold text-bark">Foto Produk yang Sudah Jadi (wajib min. 1)</p>
                <PhotoUploader value={approvePhotos} onChange={setApprovePhotos} max={4} />
              </div>

              <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-line bg-cream/70 p-3 text-sm text-bark">
                <input
                  type="checkbox"
                  checked={approveShowFeedback}
                  onChange={(e) => setApproveShowFeedback(e.target.checked)}
                  className="h-4 w-4 accent-teak"
                />
                Tampilkan nama pemesan &amp; feedback pelanggan di galeri publik
              </label>

              <button
                type="button"
                onClick={confirmApproveOrder}
                disabled={approving || approvePhotos.length === 0}
                className="btn-primary w-full disabled:opacity-55"
              >
                <Globe size={16} className="text-gold-light" />
                {approving ? 'Mempublikasikan...' : 'Setujui & Tampilkan di Karya Pernah Dicustom'}
              </button>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {modal && (
          <FormModal
            title={modal.id ? 'Ubah karya custom' : 'Tambah karya custom'}
            fields={fields}
            initial={modal}
            onClose={() => setModal(null)}
            onSubmit={submit}
          />
        )}
      </AnimatePresence>
    </div>
  );
}