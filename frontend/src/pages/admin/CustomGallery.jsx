import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { ChevronDown, ChevronRight, Images, MapPin, Plus, Ruler, Search, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CUSTOM_CATEGORIES, CUSTOM_TYPE_KEYS, TYPES } from '../../data/custom';
import { getProductImages } from '../../utils/image';
import FormModal from '../../components/FormModal';
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
  { name: 'description', label: 'Deskripsi singkat', type: 'textarea', required: true },
  {
    name: 'images',
    label: 'Foto hasil custom (maks. 4 foto)',
    type: 'photos',
    max: 4,
    required: true,
    hint: 'Upload langsung foto hasil jadi dari galeri HP/laptop (depan, samping, belakang, detail).',
  },
];

const blank = {
  name: '',
  category: 'Kitchen Set',
  size: '',
  finish: 'Natural Jati (Doff)',
  city: 'Kota Jambi',
  year: String(new Date().getFullYear()),
  description: '',
  images: [],
};

export default function CustomGallery({ embedded = false, addSignal = 0, onAddConsumed }) {
  const { customPortfolio, saveCustomPortfolio, removeCustomPortfolio } = useApp();
  const [modal, setModal] = useState(null);
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

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return customPortfolio.filter((item) => {
      if (filter !== 'Semua' && item.category !== filter) return false;
      if (q) {
        const hay = `${item.name} ${item.category} ${item.city || ''} ${item.finish || ''}`.toLowerCase();
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
    saveCustomPortfolio({ ...v, typeKey, images: imgs, image: imgs[0]?.url || '' });
    setModal(null);
    toast.success(v.id ? 'Karya custom diperbarui' : 'Karya custom ditambahkan ke galeri');
  };

  const renderCard = (item) => {
    const photos = getProductImages(item);
    return (
      <article key={item.id} className="luxury-panel flex flex-col gap-3 p-4 transition hover:border-gold/55">
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
            <span className="rounded-full bg-sand px-2.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wider text-teak">
              {item.category}
            </span>
            <h3 className="font-heading mt-1 truncate text-base font-bold text-espresso">{item.name}</h3>
            <p className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-teak">
              <Ruler size={11} /> {item.size}
            </p>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
              <MapPin size={11} /> {item.city} · {item.finish}
            </p>
          </div>
        </div>
        <p className="line-clamp-2 text-xs leading-relaxed text-muted">{item.description}</p>
        <div className="mt-auto flex justify-end border-t border-line/70 pt-2.5">
          <RowActions
            name={item.name}
            onEdit={() => setModal({ ...item, images: photos })}
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
          desc="Upload langsung foto hasil pesanan custom (Kitchen Set, Meja, Lemari, Pintu, Gazebo, dll.) — otomatis menyatu di halaman Katalog (tab Pernah Dicustom) dan terpisah rapi menurut jenisnya."
          action={<AddButton onClick={() => setModal(blank)}>Tambah karya custom</AddButton>}
        />
      )}

      {/* Pencarian Cepat */}
      <div className="relative mb-4 sm:max-w-sm">
        <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari nama karya, kota, atau finishing..."
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