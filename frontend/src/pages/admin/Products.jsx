import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Images,
  Layers,
  Package,
  Plus,
  RotateCcw,
  Search,
  ShoppingBag,
  Star,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { categories } from '../../data/products';
import { formatRupiah } from '../../utils/format';
import { getProductImages } from '../../utils/image';
import FormModal from '../../components/FormModal';
import ResponsiveImage from '../../components/ResponsiveImage';
import { AddButton, PageHeader, RowActions, confirmDelete } from '../../components/admin/ui';
import { todayISO } from '../../utils/sales';
import CustomGallery from './CustomGallery';

const fields = [
  { name: 'name', label: 'Nama produk', required: true, placeholder: 'Contoh: Meja Makan Jati Minimalis' },
  { name: 'category', label: 'Kategori', type: 'select', options: categories.filter((c) => c !== 'Semua') },
  { name: 'price', label: 'Harga (Rp)', type: 'number', required: true, placeholder: '4500000' },
  { name: 'description', label: 'Deskripsi', type: 'textarea', required: true },
  { name: 'material', label: 'Bahan', required: true, placeholder: 'Kayu Jati Solid' },
  { name: 'productionTime', label: 'Estimasi pembuatan', required: true, placeholder: '2 bulan' },
  {
    name: 'images',
    label: 'Foto produk (maks. 4 foto)',
    type: 'photos',
    max: 4,
    required: true,
    hint: 'Pilih langsung foto dari galeri HP atau laptop. Anda dapat mengatur sudut (Tampak Depan, Samping, Belakang, Detail) dan memilih foto utama.',
  },
  {
    name: 'stockStatus',
    label: 'Status stok',
    type: 'select',
    options: ['Tersedia', 'Terjual'],
    hint: 'Pilih "Terjual" jika unit ini sudah laku. Pelanggan tetap bisa memesan ulang.',
  },
  { name: 'featured', label: 'Tampilkan di Produk Unggulan (beranda)', type: 'checkbox' },
];

const saleFields = [
  { name: 'quantity', label: 'Jumlah terjual', type: 'number', required: true },
  { name: 'date', label: 'Tanggal', type: 'date', required: true },
  { name: 'note', label: 'Catatan (opsional)', placeholder: 'Contoh: dibeli tunai di toko' },
  { name: 'markSold', label: 'Tandai stok produk ini sebagai Terjual', type: 'checkbox' },
];

const blank = {
  name: '',
  category: 'Meja',
  price: '',
  description: '',
  material: 'Kayu Jati Solid',
  productionTime: '2 bulan',
  images: [],
  stockStatus: 'Tersedia',
  featured: false,
};

export default function Products() {
  const { products, customPortfolio, saveProduct, removeProduct, soldOf, addSale, setStock } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') === 'custom' ? 'custom' : 'catalog';

  const [modal, setModal] = useState(null);
  const [saleFor, setSaleFor] = useState(null);
  const [addCustomSignal, setAddCustomSignal] = useState(0);

  const [catFilter, setCatFilter] = useState('Semua');
  const [stockFilter, setStockFilter] = useState('Semua');
  const [query, setQuery] = useState('');
  const [collapsed, setCollapsed] = useState({});

  const switchTab = (nextTab) => {
    setAddCustomSignal(0);
    setSearchParams(nextTab === 'custom' ? { tab: 'custom' } : {}, { replace: true });
  };

  const allCategories = useMemo(() => {
    const extras = products
      .map((p) => p.category)
      .filter((c) => c && !categories.includes(c));
    return [...categories, ...new Set(extras)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (catFilter !== 'Semua' && p.category !== catFilter) return false;
      if (stockFilter === 'Tersedia' && p.stockStatus === 'Terjual') return false;
      if (stockFilter === 'Terjual' && p.stockStatus !== 'Terjual') return false;
      if (q) {
        const hay = `${p.name} ${p.category} ${p.material || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [products, catFilter, stockFilter, query]);

  const groupedProducts = useMemo(() => {
    const order = allCategories.filter((c) => c !== 'Semua');
    const map = new Map();
    for (const p of filteredProducts) {
      const key = p.category || 'Lainnya';
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(p);
    }
    return [...map.entries()].sort((a, b) => {
      const ia = order.indexOf(a[0]);
      const ib = order.indexOf(b[0]);
      return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    });
  }, [filteredProducts, allCategories]);

  const toggleGroup = (cat) => {
    setCollapsed((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  const submitSale = (v) => {
    if (!saleFor) return;
    addSale({ ...v, productId: saleFor?.id });
    toast.success(`Tercatat: ${saleFor?.name} terjual ${v.quantity}`);
    setSaleFor(null);
  };

  const submit = (v) => {
    const imgs = getProductImages(v);
    saveProduct({ ...v, images: imgs, image: imgs[0]?.url || '' });
    setModal(null);
    toast.success(v.id ? 'Perubahan produk disimpan' : 'Produk baru ditambahkan');
  };

  const openEdit = (p) => {
    setModal({ ...p, images: getProductImages(p) });
  };

  const openAddInCategory = (cat) => {
    const validCat = categories.includes(cat) && cat !== 'Semua' ? cat : 'Meja';
    setModal({ ...blank, category: validCat });
  };

  const renderProductCard = (p) => {
    const sold = soldOf(p.id);
    const isSold = p.stockStatus === 'Terjual';
    const photos = getProductImages(p);

    return (
      <article
        key={p.id}
        className="luxury-panel flex flex-col gap-3 p-4 transition hover:border-gold/55"
      >
        <div className="flex gap-3.5">
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-sand">
            <ResponsiveImage
              src={photos[0]?.url || p.image}
              alt={p.name}
              widths={[160, 320]}
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
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                  isSold ? 'bg-bark/10 text-bark' : 'bg-green-100 text-green-800'
                }`}
              >
                {isSold ? 'Terjual' : 'Tersedia'}
              </span>
              {p.featured && (
                <span className="inline-flex items-center gap-0.5 rounded-full border border-gold/45 bg-gold/15 px-2 py-0.5 text-[10.5px] font-bold text-teak">
                  <Star size={10} fill="currentColor" className="text-gold-dark" /> Unggulan
                </span>
              )}
            </div>

            <h3 className="font-heading mt-1.5 truncate text-base font-bold text-espresso" title={p.name}>
              {p.name}
            </h3>
            <p className="text-sm font-bold text-teak">{formatRupiah(p.price)}</p>
            <p className="mt-0.5 text-xs text-muted">
              Terjual <strong className="text-espresso">{sold.total}×</strong> ({sold.online} online · {sold.offline} toko)
            </p>
          </div>
        </div>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-line/70 pt-3">
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setSaleFor({ ...p })}
              className="btn-primary !min-h-[36px] !px-3 !py-1.5 text-xs"
            >
              <ShoppingBag size={13} className="text-gold-light" /> Catat terjual
            </button>
            <button
              type="button"
              onClick={() => {
                setStock(p.id, isSold ? 'Tersedia' : 'Terjual');
                toast.success(isSold ? 'Ditandai tersedia' : 'Ditandai terjual');
              }}
              className="btn-soft !min-h-[36px] !px-3 !py-1.5 text-xs"
            >
              {isSold ? (
                <>
                  <RotateCcw size={13} /> Tersedia lagi
                </>
              ) : (
                <>
                  <CheckCircle2 size={13} /> Tandai terjual
                </>
              )}
            </button>
          </div>
          <RowActions
            name={p.name}
            onEdit={() => openEdit(p)}
            onDelete={() => confirmDelete(p.name, () => removeProduct(p.id))}
          />
        </div>
      </article>
    );
  };

  return (
    <div>
      <PageHeader
        title="Katalog & Karya"
        desc="Kelola Produk Katalog dan Karya Pernah Dicustom dalam satu tempat — sudah dikelompokkan rapi per kategori."
        action={
          activeTab === 'catalog' ? (
            <AddButton onClick={() => openAddInCategory(catFilter)}>Tambah produk</AddButton>
          ) : (
            <AddButton onClick={() => setAddCustomSignal((n) => n + 1)}>
              Tambah karya custom
            </AddButton>
          )
        }
      />

      {/* Tab Utama: Produk Katalog vs Karya Custom */}
      <div className="mb-6 flex flex-wrap gap-2 rounded-2xl border border-gold/30 bg-white/85 p-1.5 shadow-soft">
        <button
          type="button"
          onClick={() => switchTab('catalog')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition sm:flex-none ${
            activeTab === 'catalog'
              ? 'bg-espresso text-gold-light shadow-soft'
              : 'text-muted hover:bg-sand/70 hover:text-espresso'
          }`}
        >
          <Package size={16} />
          Produk Katalog
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-bold ${
              activeTab === 'catalog' ? 'bg-gold text-espresso' : 'bg-sand text-teak'
            }`}
          >
            {products.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => switchTab('custom')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition sm:flex-none ${
            activeTab === 'custom'
              ? 'bg-espresso text-gold-light shadow-soft'
              : 'text-muted hover:bg-sand/70 hover:text-espresso'
          }`}
        >
          <Layers size={16} />
          Karya Pernah Dicustom
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-bold ${
              activeTab === 'custom' ? 'bg-gold text-espresso' : 'bg-sand text-teak'
            }`}
          >
            {customPortfolio.length}
          </span>
        </button>
      </div>

      {activeTab === 'custom' ? (
        <CustomGallery
          embedded
          addSignal={addCustomSignal}
          onAddConsumed={() => setAddCustomSignal(0)}
        />
      ) : (
        <>
          {/* Bar Pencarian + Filter Status */}
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 sm:max-w-sm">
              <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari nama produk atau kategori..."
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

            <div className="flex items-center gap-1.5">
              {['Semua', 'Tersedia', 'Terjual'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStockFilter(st)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                    stockFilter === st
                      ? 'bg-teak text-white shadow-soft'
                      : 'border border-line bg-white text-muted hover:border-teak hover:text-espresso'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Filter Pill per Kategori */}
          <div className="no-scrollbar mb-6 flex gap-2 overflow-x-auto pb-1 sm:flex-wrap">
            {allCategories.map((cat) => {
              const count =
                cat === 'Semua'
                  ? products.length
                  : products.filter((p) => p.category === cat).length;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCatFilter(cat)}
                  aria-pressed={catFilter === cat}
                  className={`min-h-[38px] shrink-0 rounded-full px-4 text-sm font-medium transition ${
                    catFilter === cat
                      ? 'border border-gold/40 bg-espresso text-gold-light shadow-soft'
                      : 'border border-line bg-white text-muted hover:border-gold hover:text-espresso'
                  }`}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>

          {/* Daftar Produk Terkelompok per Kategori */}
          {filteredProducts.length === 0 ? (
            <div className="luxury-panel p-10 text-center text-muted">
              <p>Tidak ada produk yang cocok dengan filter saat ini.</p>
              {(catFilter !== 'Semua' || stockFilter !== 'Semua' || query) && (
                <button
                  type="button"
                  onClick={() => {
                    setCatFilter('Semua');
                    setStockFilter('Semua');
                    setQuery('');
                  }}
                  className="btn-soft mt-4 text-xs"
                >
                  Reset Filter
                </button>
              )}
            </div>
          ) : catFilter !== 'Semua' ? (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredProducts.map(renderProductCard)}
            </div>
          ) : (
            <div className="space-y-6">
              {groupedProducts.map(([cat, list]) => {
                const isCollapsed = Boolean(collapsed[cat]);
                return (
                  <section
                    key={cat}
                    className="rounded-2xl border border-gold/25 bg-sand/35 p-4 sm:p-5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => toggleGroup(cat)}
                        className="flex items-center gap-2 text-left"
                      >
                        <span className="grid h-7 w-7 place-items-center rounded-lg bg-espresso text-gold-light">
                          {isCollapsed ? <ChevronRight size={15} /> : <ChevronDown size={15} />}
                        </span>
                        <h2 className="font-heading text-lg font-bold text-espresso">{cat}</h2>
                        <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-bold text-teak shadow-soft">
                          {list.length} produk
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => openAddInCategory(cat)}
                        className="inline-flex items-center gap-1 rounded-full border border-gold/40 bg-white px-3 py-1 text-xs font-semibold text-teak transition hover:bg-espresso hover:text-gold-light"
                      >
                        <Plus size={13} /> Tambah {cat}
                      </button>
                    </div>

                    {!isCollapsed && (
                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        {list.map(renderProductCard)}
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          )}
        </>
      )}

      <AnimatePresence>
        {saleFor && (
          <FormModal
            title={`Catat penjualan: ${saleFor.name}`}
            fields={saleFields}
            initial={{ quantity: 1, date: todayISO(), note: '', markSold: true }}
            onClose={() => setSaleFor(null)}
            onSubmit={submitSale}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {modal && (
          <FormModal
            title={modal.id ? 'Ubah produk' : 'Tambah produk'}
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