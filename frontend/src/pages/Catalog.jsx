import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { History, Layers, Package, Search, SearchX, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';
import ProductCard from '../components/ProductCard';
import CustomPortfolioCard from '../components/CustomPortfolioCard';
import OrderModal from '../components/OrderModal';
import { CUSTOM_CATEGORIES, CUSTOM_TYPE_KEYS, TYPES } from '../data/custom';

// Menyamakan label kategori antara produk katalog reguler & karya pernah dicustom
function normalizeCategory(cat) {
  if (!cat) return 'Semua';
  if (cat === 'Kursi') return 'Kursi & Sofa';
  if (cat === 'Cermin') return 'Cermin & Rias';
  return cat;
}

export default function Catalog() {
  const { products, customPortfolio, openKoyoWith, isOwner } = useApp();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const rawCat = searchParams.get('category') || 'Semua';
  const category = normalizeCategory(rawCat);
  const tab = searchParams.get('tab') || 'all'; // 'all' | 'catalog' | 'custom'
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('default');
  const [quickOrderCustom, setQuickOrderCustom] = useState(null);

  const publicCustomPortfolio = useMemo(
    () => customPortfolio.filter((item) => item.isPublished !== false),
    [customPortfolio],
  );

  const updateParams = (nextTab, nextCat) => {
    const params = {};
    if (nextTab && nextTab !== 'all') params.tab = nextTab;
    if (nextCat && nextCat !== 'Semua') params.category = nextCat;
    setSearchParams(params);
  };

  const setCategory = (cat) => updateParams(tab, cat);
  const setTab = (nextTab) => updateParams(nextTab, category);

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = products.filter((p) => {
      const pCat = normalizeCategory(p.category);
      const matchCategory = category === 'Semua' || pCat === category;
      const matchQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        pCat.toLowerCase().includes(q);
      return matchCategory && matchQuery;
    });
    if (sort === 'asc') return [...list].sort((a, b) => a.price - b.price);
    if (sort === 'desc') return [...list].sort((a, b) => b.price - a.price);
    return list;
  }, [products, category, query, sort]);

  const filteredCustom = useMemo(() => {
    const q = query.trim().toLowerCase();
    return publicCustomPortfolio.filter((item) => {
      const cCat = normalizeCategory(item.category || TYPES[item.typeKey]?.label);
      const matchCategory = category === 'Semua' || cCat === category;
      const matchQuery =
        !q ||
        item.name.toLowerCase().includes(q) ||
        (item.description || '').toLowerCase().includes(q) ||
        (item.city || '').toLowerCase().includes(q) ||
        cCat.toLowerCase().includes(q);
      return matchCategory && matchQuery;
    });
  }, [publicCustomPortfolio, category, query]);

  // Kelompokkan "Yang Pernah Dicustom" menurut jenis-jenisnya agar rapi
  const groupedCustom = useMemo(() => {
    const order = CUSTOM_TYPE_KEYS.map((k) => TYPES[k].label);
    const map = {};
    filteredCustom.forEach((item) => {
      const cat = normalizeCategory(item.category || TYPES[item.typeKey]?.label || 'Bebas Request');
      map[cat] = map[cat] || [];
      map[cat].push(item);
    });
    const keys = [
      ...order.filter((c) => map[c]?.length > 0),
      ...Object.keys(map).filter((c) => !order.includes(c)),
    ];
    return keys.map((cat) => ({ category: cat, items: map[cat] }));
  }, [filteredCustom]);

  const showCatalog = tab === 'all' || tab === 'catalog';
  const showCustom = tab === 'all' || tab === 'custom';
  const totalShown = (showCatalog ? filteredProducts.length : 0) + (showCustom ? filteredCustom.length : 0);

  const openCustomWithPreset = (item) => {
    navigate('/custom', { state: { fromPortfolio: item } });
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      {/* Header Katalog Terpadu */}
      <div className="flex flex-col justify-between gap-4 border-b border-gold/25 pb-7 md:flex-row md:items-end">
        <div>
          <span className="kicker">Galeri Produk &amp; Arsip Custom Jati</span>
          <h1 className="font-heading mt-1.5 text-4xl font-bold text-espresso">
            Katalog &amp; <span className="italic text-teak">Pernah Dicustom</span>
          </h1>
          <p className="mt-2.5 max-w-2xl text-[16.5px] text-muted">
            Satu tempat untuk melihat koleksi katalog toko beserta karya furnitur yang pernah dicustom pelanggan — dari Kitchen Set, Meja, Lemari, Kamar Set, Pintu &amp; Partisi, hingga Mimbar &amp; Gazebo.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 self-start md:self-end">
          <button
            type="button"
            onClick={() => navigate('/custom')}
            className="btn-primary !min-h-[42px] text-sm"
          >
            <Layers size={15} className="text-gold-light" /> Buat Custom Baru
          </button>
          <button
            type="button"
            onClick={() => openKoyoWith('Bantu saya cari furnitur sesuai budget')}
            className="btn-soft !min-h-[42px] text-sm"
          >
            <Sparkles size={15} className="text-gold-dark" /> Tanya Koyo
          </button>
        </div>
      </div>

      {/* Tab Penyatuan: Semua | Katalog Toko | Pernah Dicustom */}
      <div className="mt-6 flex flex-wrap gap-2" role="tablist" aria-label="Pilih sumber koleksi">
        {[
          { key: 'all', label: 'Semua Koleksi', count: products.length + publicCustomPortfolio.length, icon: Layers },
          { key: 'catalog', label: 'Katalog Toko', count: products.length, icon: Package },
          { key: 'custom', label: 'Pernah Dicustom', count: publicCustomPortfolio.length, icon: History },
        ].map((item) => {
          const active = tab === item.key;
          return (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(item.key)}
              className={`inline-flex min-h-[44px] items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-bold transition ${
                active
                  ? 'border-gold/50 bg-espresso text-gold-light shadow-soft'
                  : 'border-line bg-white text-bark hover:border-gold hover:text-teak'
              }`}
            >
              <item.icon size={15} className={active ? 'text-gold-light' : 'text-gold-dark'} />
              {item.label}
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  active ? 'bg-gold text-espresso' : 'bg-sand text-teak'
                }`}
              >
                {item.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Pencarian, Urutkan, & Filter Jenis Lengkap */}
      <div className="luxury-panel mt-4 space-y-4 p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-dark" size={19} />
            <input
              type="search"
              aria-label="Cari produk atau karya custom"
              placeholder="Cari kitchen set, meja makan, lemari, mimbar, pintu jati..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="field !pl-12"
            />
          </div>
          {showCatalog && (
            <select
              aria-label="Urutkan produk"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="field sm:!w-56"
            >
              <option value="default">Urutan unggulan</option>
              <option value="asc">Harga terendah</option>
              <option value="desc">Harga tertinggi</option>
            </select>
          )}
        </div>

        {/* Filter Pil Jenis-Jenis Furnitur */}
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1 sm:flex-wrap" role="group" aria-label="Filter jenis furnitur">
          {CUSTOM_CATEGORIES.map((cat) => {
            const active = category === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                aria-pressed={active}
                className={`min-h-[40px] shrink-0 rounded-full px-4 text-sm font-semibold transition ${
                  active
                    ? 'border border-gold/45 bg-espresso text-gold-light shadow-soft'
                    : 'border border-line bg-white text-muted hover:border-gold hover:text-espresso'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      <p className="mt-6 text-sm font-medium text-muted" aria-live="polite">
        Menampilkan <strong className="text-espresso">{totalShown}</strong> item
        {category !== 'Semua' && (
          <>
            {' '}untuk jenis <strong className="text-teak">{category}</strong>
          </>
        )}
      </p>

      {totalShown === 0 ? (
        <div className="card mt-4 px-6 py-16 text-center">
          <SearchX className="mx-auto text-gold-dark" size={42} />
          <p className="font-heading mt-4 text-2xl font-bold text-espresso">Koleksi tidak ditemukan</p>
          <p className="mt-1 text-muted">Coba kata kunci lain, hapus filter, atau langsung rancang model keinginanmu di Studio Custom.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => {
                setQuery('');
                updateParams('all', 'Semua');
                setSort('default');
              }}
              className="btn-outline"
            >
              Hapus semua filter
            </button>
            <button onClick={() => navigate('/custom')} className="btn-primary">
              <Layers size={16} className="text-gold-light" /> Rancang Custom Sendiri
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-6 space-y-12">
          {/* SEKSI 1: KATALOG TOKO REGULER */}
          {showCatalog && filteredProducts.length > 0 && (
            <section>
              {tab === 'all' && (
                <div className="mb-4 flex items-center justify-between border-b border-line pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-8 w-8 place-items-center rounded-xl bg-sand text-teak">
                      <Package size={16} />
                    </span>
                    <h2 className="font-heading text-2xl font-bold text-espresso">Katalog Produk Toko</h2>
                    <span className="rounded-full bg-sand px-2.5 py-0.5 text-xs font-bold text-teak">
                      {filteredProducts.length} produk
                    </span>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </section>
          )}

          {/* SEKSI 2: YANG PERNAH DICUSTOM SEBELUMNYA (DIPISAH MENURUT JENIS-JENISNYA) */}
          {showCustom && groupedCustom.length > 0 && (
            <section>
              <div className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-gold/30 pb-3">
                <div>
                  <span className="kicker">
                    <History size={12} className="text-gold-dark" /> Arsip Karya Custom Pelanggan
                  </span>
                  <h2 className="font-heading mt-1 text-2xl font-bold text-espresso sm:text-3xl">
                    Yang <span className="italic text-teak">pernah dicustom</span> sebelumnya
                  </h2>
                  <p className="mt-1 text-sm text-muted">
                    Dipisahkan menurut jenisnya. Klik <strong>"Pesan Langsung"</strong> untuk memesan model yang sama tanpa mengatur ulang, atau klik ikon pengaturan untuk ubah ukuran di Studio Custom.
                  </p>
                </div>
                <span className="rounded-full border border-gold/35 bg-sand/70 px-3.5 py-1 text-xs font-bold text-teak">
                  {filteredCustom.length} karya
                </span>
              </div>

              <div className="space-y-9">
                {groupedCustom.map((group) => (
                  <div key={group.category}>
                    <div className="mb-4 flex items-center justify-between gap-3 border-b border-line/80 pb-2">
                      <div className="flex items-center gap-2.5">
                        <span className="h-2.5 w-2.5 rotate-45 bg-gold" aria-hidden="true" />
                        <h3 className="font-heading text-xl font-bold text-espresso">{group.category}</h3>
                        <span className="rounded-full bg-sand px-2.5 py-0.5 text-xs font-bold text-teak">
                          {group.items.length} karya
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const k = CUSTOM_TYPE_KEYS.find((key) => TYPES[key].label === group.category) || 'lainnya';
                          navigate('/custom', { state: { initialType: k } });
                        }}
                        className="text-xs font-bold text-teak hover:underline sm:text-sm"
                      >
                        + Custom {group.category}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {group.items.map((item) => (
                        <CustomPortfolioCard
                          key={item.id}
                          item={item}
                          onUseAsBase={openCustomWithPreset}
                          onQuickOrder={(it) => setQuickOrderCustom(it)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      <AnimatePresence>
        {quickOrderCustom && !isOwner && (
          <OrderModal customItem={quickOrderCustom} onClose={() => setQuickOrderCustom(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}