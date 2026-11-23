import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Images, MapPin, Ruler } from 'lucide-react';
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

export default function CustomGallery() {
  const { customPortfolio, saveCustomPortfolio, removeCustomPortfolio } = useApp();
  const [modal, setModal] = useState(null);
  const [filter, setFilter] = useState('Semua');

  const list =
    filter === 'Semua'
      ? customPortfolio
      : customPortfolio.filter((c) => c.category === filter);

  const submit = (v) => {
    const typeKey = CUSTOM_TYPE_KEYS.find((k) => TYPES[k].label === v.category) || 'lainnya';
    const imgs = getProductImages(v);
    saveCustomPortfolio({ ...v, typeKey, images: imgs, image: imgs[0]?.url || '' });
    setModal(null);
    toast.success(v.id ? 'Karya custom diperbarui' : 'Karya custom ditambahkan ke galeri');
  };

  return (
    <div>
      <PageHeader
        title="Karya Pernah Dicustom"
        desc="Upload langsung foto hasil pesanan custom (Kitchen Set, Meja, Lemari, Pintu, Gazebo, dll.) — otomatis menyatu di halaman Katalog (tab Pernah Dicustom) dan terpisah rapi menurut jenisnya."
        action={<AddButton onClick={() => setModal(blank)}>Tambah karya custom</AddButton>}
      />

      <div className="no-scrollbar mb-5 flex gap-2 overflow-x-auto pb-1 sm:flex-wrap">
        {CUSTOM_CATEGORIES.map((cat) => {
          const count = cat === 'Semua' ? customPortfolio.length : customPortfolio.filter((x) => x.category === cat).length;
          return (
            <button
              key={cat}
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
        <p className="luxury-panel p-10 text-center text-muted">Belum ada karya custom untuk jenis ini.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {list.map((item) => {
            const photos = getProductImages(item);
            return (
              <article key={item.id} className="luxury-panel flex flex-col gap-3 p-4">
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
                    <h2 className="font-heading mt-1 truncate text-base font-bold text-espresso">{item.name}</h2>
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
