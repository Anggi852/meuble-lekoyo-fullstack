import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Crown,
  Heart,
  History,
  Info,
  Layers,
  MapPin,
  Maximize2,
  MessageCircle,
  Palette,
  Ruler,
  ShieldCheck,
  Sparkles,
  Star,
  Truck,
  Wallet,
  Wrench,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import OrderModal from '../components/OrderModal';
import ProductCard from '../components/ProductCard';
import CustomPortfolioCard from '../components/CustomPortfolioCard';
import ResponsiveImage from '../components/ResponsiveImage';
import { useApp } from '../context/AppContext';
import { formatRupiah } from '../utils/format';
import { getProductImages } from '../utils/image';
import { WA_BASE } from '../services/whatsapp';

function normalizeCat(cat) {
  if (cat === 'Kursi') return 'Kursi & Sofa';
  if (cat === 'Cermin') return 'Cermin & Rias';
  return cat;
}

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    products,
    customPortfolio,
    testimonials,
    wishlist,
    toggleWishlist,
    trackView,
    soldOf,
    openKoyoWith,
    isOwner,
  } = useApp();

  const isCustomItem = String(id || '').startsWith('custom-');
  const numericId = parseInt(String(id || '').replace(/^custom-/, ''), 10);

  const customItem = isCustomItem ? customPortfolio.find((c) => c.id === numericId) : null;
  const product = !isCustomItem ? products.find((p) => p.id === numericId) : null;
  const activeItem = customItem || product;

  const [showOrder, setShowOrder] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const itemKey = activeItem ? `${isCustomItem ? 'c' : 'p'}-${activeItem.id}` : null;

  useEffect(() => {
    setActiveIdx(0);
    setZoomOpen(false);
  }, [itemKey]);

  useEffect(() => {
    if (!product?.id) return;
    try {
      const key = `lekoyo_viewed_${product.id}`;
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
    } catch { /* abaikan */ }
    trackView(product.id);
  }, [product?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!activeItem) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-24 text-center">
        <p className="text-xl text-muted">Produk tidak ditemukan.</p>
        <Link to="/catalog" className="btn-outline mt-6">Kembali ke katalog</Link>
      </div>
    );
  }

  const photos = getProductImages(activeItem);
  const safeIdx = Math.min(activeIdx, Math.max(0, photos.length - 1));
  const activePhoto = photos[safeIdx] || { url: activeItem.image, label: 'Tampak Depan' };

  const prevPhoto = () => setActiveIdx((i) => (i - 1 + photos.length) % photos.length);
  const nextPhoto = () => setActiveIdx((i) => (i + 1) % photos.length);

  const liked = !isCustomItem && wishlist.some((i) => i.id === product.id);
  const sold = !isCustomItem ? soldOf(product.id).total : 0;
  const isSold = !isCustomItem && product.stockStatus === 'Terjual';

  const productReviews = !isCustomItem
    ? (testimonials || []).filter((t) => Number(t.productId) === Number(product.id))
    : [];
  const avgRating =
    productReviews.length > 0
      ? (
          productReviews.reduce((sum, r) => sum + (Number(r.rating) || 5), 0) /
          productReviews.length
        ).toFixed(1)
      : null;

  const currentNormCat = normalizeCat(activeItem.category);
  const relatedProducts = products
    .filter((p) => normalizeCat(p.category) === currentNormCat && (isCustomItem || p.id !== product.id))
    .slice(0, 4);
  const relatedCustom = customPortfolio
    .filter((c) => normalizeCat(c.category) === currentNormCat && (!isCustomItem || c.id !== customItem.id))
    .slice(0, 4);

  const specs = isCustomItem
    ? [
        [Ruler, 'Dimensi dibuat', customItem.size || 'Sesuai permintaan'],
        [Palette, 'Finishing', customItem.finish || 'Natural Jati'],
        [ShieldCheck, 'Bahan', 'Kayu Jati Solid Asli'],
        [MapPin, 'Kota pemesan', customItem.city || 'Jambi'],
        [Calendar, 'Tahun', customItem.year || '2026'],
        [Clock, 'Estimasi buat serupa', '±2 bulan (tunai / sistem tabung)'],
      ]
    : [
        [ShieldCheck, 'Bahan', product.material],
        [Clock, 'Estimasi pembuatan', `±${product.productionTime}`],
        [Truck, 'Pengiriman', 'Tersedia ke luar daerah'],
        [Wallet, 'Pembayaran', 'Tunai atau sistem tabung'],
        [Wrench, 'Garansi', 'Perbaikan gratis selama masa garansi'],
      ];

  const customWaLink = isCustomItem
    ? `${WA_BASE}?text=${encodeURIComponent(
        `Halo Pak Nanang, saya tertarik memesan model serupa karya custom:\n\n*Model:* ${customItem.name}\n*Jenis:* ${customItem.category}\n*Ukuran referensi:* ${customItem.size}\n*Finishing:* ${customItem.finish}\n\nMohon info estimasi harga dan jadwal pembuatannya (±2 bulan). Terima kasih.`,
      )}`
    : WA_BASE;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <Link
        to={isCustomItem ? '/catalog?tab=custom' : '/catalog'}
        className="inline-flex min-h-[44px] items-center gap-1.5 font-medium text-teak hover:underline"
      >
        <ArrowLeft size={18} /> Kembali ke {isCustomItem ? 'katalog pernah dicustom' : 'katalog'}
      </Link>

      <div className="mt-4 grid gap-8 md:grid-cols-2 lg:gap-12">
        {/* ==================== GALERI MULTI-FOTO PRODUK ==================== */}
        <div>
          <div className="group relative overflow-hidden rounded-3xl border-[5px] border-white bg-sand shadow-lift ring-1 ring-gold/35">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${itemKey}-${safeIdx}`}
                initial={{ opacity: 0.35 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0.35 }}
                transition={{ duration: 0.22 }}
              >
                <ResponsiveImage
                  src={activePhoto.url}
                  alt={`${activeItem.name} — ${activePhoto.label}`}
                  widths={[480, 768, 1080, 1440]}
                  sizes="(max-width: 767px) 94vw, 48vw"
                  defaultWidth={1000}
                  priority
                  onClick={() => setZoomOpen(true)}
                  className="aspect-[4/3] w-full cursor-zoom-in object-cover object-center sm:aspect-[16/10] md:aspect-square"
                />
              </motion.div>
            </AnimatePresence>

            <div className="absolute left-3.5 top-3.5 flex flex-wrap gap-1.5">
              {isCustomItem && (
                <span className="rounded-full border border-gold/50 bg-gold px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-espresso shadow-soft">
                  Pernah Dicustom
                </span>
              )}
              <span className="rounded-full border border-gold/40 bg-espresso/85 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-gold-light backdrop-blur-md">
                {activeItem.category}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setZoomOpen(true)}
              aria-label="Perbesar foto"
              className="absolute right-3.5 top-3.5 grid h-9 w-9 place-items-center rounded-full border border-white/50 bg-white/90 text-espresso shadow-soft backdrop-blur-md transition hover:scale-105 hover:border-gold"
            >
              <Maximize2 size={15} />
            </button>

            <div className="pointer-events-none absolute inset-x-3.5 bottom-3.5 flex items-center justify-between gap-2">
              <span className="rounded-full bg-white/92 px-3 py-1 text-xs font-bold text-espresso shadow-soft backdrop-blur-md">
                {activePhoto.label}
              </span>
              {photos.length > 1 && (
                <span className="rounded-full bg-espresso/80 px-2.5 py-1 text-xs font-semibold text-cream backdrop-blur-md">
                  {safeIdx + 1} / {photos.length}
                </span>
              )}
            </div>

            {photos.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={prevPhoto}
                  aria-label="Foto sebelumnya"
                  className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-white/60 bg-white/90 text-espresso shadow-soft backdrop-blur-sm transition hover:scale-105 hover:bg-white sm:opacity-0 sm:group-hover:opacity-100"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  type="button"
                  onClick={nextPhoto}
                  aria-label="Foto berikutnya"
                  className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-white/60 bg-white/90 text-espresso shadow-soft backdrop-blur-sm transition hover:scale-105 hover:bg-white sm:opacity-0 sm:group-hover:opacity-100"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}
          </div>

          {photos.length > 1 && (
            <div className="mt-3.5 grid grid-cols-4 gap-2.5 sm:gap-3" role="tablist" aria-label="Pilih sudut foto produk">
              {photos.map((ph, idx) => {
                const isActive = idx === safeIdx;
                return (
                  <button
                    key={`${ph.url}-${idx}`}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActiveIdx(idx)}
                    className={`group overflow-hidden rounded-2xl border-2 bg-white text-left transition ${
                      isActive
                        ? 'border-gold shadow-soft ring-2 ring-gold/30'
                        : 'border-line/80 opacity-80 hover:border-wood hover:opacity-100'
                    }`}
                  >
                    <div className="aspect-[4/3] overflow-hidden bg-sand">
                      <ResponsiveImage
                        src={ph.url}
                        alt={ph.label}
                        widths={[240, 360]}
                        sizes="22vw"
                        defaultWidth={240}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                    </div>
                    <p className={`truncate px-2 py-1.5 text-center text-[11px] font-semibold ${isActive ? 'bg-sand/70 text-espresso' : 'text-muted'}`}>
                      {ph.label}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ==================== INFO & TOMBOL PESAN ==================== */}
        <div>
          <div className="flex items-start justify-between gap-4">
            <h1 className="font-heading text-3xl font-bold leading-tight text-espresso sm:text-4xl">{activeItem.name}</h1>
            {!isCustomItem && !isOwner && (
              <button
                onClick={() => toggleWishlist(product)}
                aria-pressed={liked}
                aria-label={liked ? 'Hapus dari favorit' : 'Simpan ke favorit'}
                className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-line bg-white transition hover:border-teak"
              >
                <Heart size={22} className={liked ? 'fill-red-500 text-red-500' : 'text-muted'} />
              </button>
            )}
          </div>

          {isCustomItem ? (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-sand px-3.5 py-1 text-sm font-bold text-teak">
                <History size={14} /> Karya Custom Pelanggan · Harga via WhatsApp
              </span>
            </div>
          ) : (
            <>
              <p className="mt-3 text-3xl font-bold text-teak">{formatRupiah(product.price)}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className={`rounded-full px-3 py-1 text-sm font-semibold ${isSold ? 'bg-bark/10 text-bark' : 'bg-green-100 text-green-800'}`}>
                  {isSold ? 'Terjual' : 'Tersedia'}
                </span>
                {sold > 0 && (
                  <span className="rounded-full bg-sand px-3 py-1 text-sm font-semibold text-teak">Sudah terjual {sold}×</span>
                )}
                {avgRating && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-gold/15 px-3 py-1 text-sm font-semibold text-teak">
                    <Star size={14} fill="currentColor" className="text-gold" /> {avgRating} ({productReviews.length} ulasan)
                  </span>
                )}
              </div>
              {isSold && (
                <p className="mt-3 text-[15px] text-muted">
                  Unit ini sudah terjual, tetapi kamu tetap bisa memesannya lagi. Dibuat baru, estimasi ±{product.productionTime}.
                </p>
              )}
            </>
          )}

          <p className="mt-4 text-lg leading-relaxed text-muted">{activeItem.description}</p>

          <dl className="luxury-panel mt-6 divide-y divide-line/80 overflow-hidden">
            {specs.map(([Icon, label, value]) => (
              <div key={label} className="flex items-center justify-between gap-4 px-5 py-3.5">
                <dt className="flex items-center gap-2.5 text-muted">
                  <Icon size={19} className="text-wood" /> {label}
                </dt>
                <dd className="text-right font-medium text-bark">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-5 flex items-start gap-3 rounded-xl bg-sand p-4">
            <Info size={20} className="mt-0.5 shrink-0 text-teak" />
            <p className="text-[15px] leading-relaxed text-bark">
              {isCustomItem
                ? 'Kamu bisa ubah ukuran, warna kayu, maupun detail ukiran dari model ini langsung di Studio Custom.'
                : 'Pesanan mendadak tidak dapat diterima. Mohon pesan sesuai estimasi pembuatan di atas.'}
            </p>
          </div>

          {isOwner ? (
            <div className="mt-6 rounded-2xl border border-gold/40 bg-espresso p-5 text-cream shadow-soft">
              <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gold-light">
                <Crown size={14} className="text-gold" /> Mode Pratinjau Owner
              </p>
              <p className="mt-1.5 text-sm text-cream/80">
                Anda sedang meninjau tampilan halaman produk. Akun Owner tidak dapat mengajukan pemesanan.
              </p>
              <Link to="/admin" className="btn-gold mt-4 w-full text-sm">
                Kelola Produk di Dashboard Owner
              </Link>
            </div>
          ) : isCustomItem ? (
            <div className="mt-6 space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => navigate('/custom', { state: { fromPortfolio: customItem } })}
                  className="btn-primary btn-shimmer flex-1"
                >
                  <Layers size={18} className="text-gold-light" /> Rancang &amp; Pesan Model Serupa
                </button>
                <a href={customWaLink} target="_blank" rel="noreferrer" className="btn-outline flex-1">
                  <MessageCircle size={18} /> Tanya Harga di WA
                </a>
              </div>
              <button
                type="button"
                onClick={() => openKoyoWith(`Saya mau tanya soal hasil custom ${customItem.name} (${customItem.size})`)}
                className="btn-soft w-full"
              >
                <Sparkles size={17} className="text-gold-dark" /> Diskusi Model Ini dengan Koyo
              </button>
            </div>
          ) : (
            <>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button onClick={() => setShowOrder(true)} className="btn-primary btn-shimmer flex-1">
                  <MessageCircle size={19} /> Pesan via WhatsApp
                </button>
                <button
                  type="button"
                  onClick={() => openKoyoWith(`Mau pesan ${product.name}`, product)}
                  className="btn-soft flex-1"
                >
                  <Sparkles size={18} /> Pesan lewat Koyo
                </button>
              </div>
              <a href={WA_BASE} target="_blank" rel="noreferrer" className="btn-outline mt-3 w-full">
                Tanya Langsung ke Owner
              </a>
            </>
          )}
        </div>
      </div>

      {/* ULASAN PEMBELI KHUSUS PRODUK INI */}
      {!isCustomItem && (
        <section className="mt-14">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <span className="kicker">
                <Star size={12} className="text-gold-dark" /> Ulasan Produk
              </span>
              <h2 className="font-heading mt-1 text-2xl font-bold text-espresso">
                Ulasan pembeli ({productReviews.length})
              </h2>
            </div>
            {avgRating && (
              <div className="inline-flex items-center gap-2 rounded-2xl border border-gold/35 bg-sand/70 px-4 py-2">
                <Star size={18} fill="currentColor" className="text-gold" />
                <span className="font-heading text-lg font-bold text-espresso">{avgRating}</span>
                <span className="text-xs text-muted">/ 5.0</span>
              </div>
            )}
          </div>

          {productReviews.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-line bg-cream/70 p-6 text-sm text-muted">
              Belum ada ulasan khusus untuk produk ini. Pelanggan yang pesanannya berstatus <strong>Selesai</strong> dapat langsung menulis ulasan melalui halaman{' '}
              <Link to="/my-orders" className="font-semibold text-teak underline">
                Pesanan Saya
              </Link>.
            </div>
          ) : (
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {productReviews.map((rev) => {
                const stars = Math.min(5, Math.max(1, Number(rev.rating) || 5));
                return (
                  <article key={rev.id} className="rounded-2xl border border-gold/25 bg-white p-5 shadow-soft">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-espresso">{rev.name}</p>
                        <p className="flex items-center gap-1 text-xs text-muted">
                          <MapPin size={11} className="text-gold-dark" /> {rev.city}
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-sage/10 px-2.5 py-0.5 text-[11px] font-semibold text-sage">
                        <CheckCircle2 size={11} /> {rev.source === 'customer' ? 'Pembeli Asli' : 'Terverifikasi'}
                      </span>
                    </div>
                    <div className="mt-2.5 flex gap-0.5 text-gold">
                      {[...Array(5)].map((_, k) => (
                        <Star
                          key={k}
                          size={14}
                          fill={k < stars ? 'currentColor' : 'none'}
                          className={k < stars ? 'text-gold' : 'text-line'}
                        />
                      ))}
                    </div>
                    <p className="mt-2.5 text-[15px] leading-relaxed text-bark">"{rev.text}"</p>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* YANG PERNAH DICUSTOM DI JENIS YANG SAMA */}
      {relatedCustom.length > 0 && (
        <section className="mt-16">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <span className="kicker">
                <History size={12} className="text-gold-dark" /> Referensi Custom Sejenis
              </span>
              <h2 className="font-heading mt-1 text-2xl font-bold text-espresso">
                Yang pernah dicustom di jenis {currentNormCat}
              </h2>
            </div>
            <Link to={`/catalog?tab=custom&category=${encodeURIComponent(currentNormCat)}`} className="text-sm font-bold text-teak hover:underline">
              Lihat semua di Katalog →
            </Link>
          </div>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {relatedCustom.map((item) => (
              <CustomPortfolioCard
                key={item.id}
                item={item}
                onUseAsBase={(it) => navigate('/custom', { state: { fromPortfolio: it } })}
              />
            ))}
          </div>
        </section>
      )}

      {/* PRODUK KATALOG LAINNYA DI KATEGORI YANG SAMA */}
      {relatedProducts.length > 0 && (
        <section className="mt-14">
          <h2 className="font-heading text-2xl font-bold text-espresso">Lainnya di katalog {currentNormCat}</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Lightbox Perbesar Foto */}
      <AnimatePresence>
        {zoomOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setZoomOpen(false)}
            className="fixed inset-0 z-[95] flex flex-col items-center justify-center bg-espresso/90 p-4 backdrop-blur-md"
            role="dialog"
            aria-modal="true"
            aria-label="Pratinjau foto besar"
          >
            <button
              type="button"
              onClick={() => setZoomOpen(false)}
              aria-label="Tutup pratinjau"
              className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25"
            >
              <X size={22} />
            </button>
            <div className="relative max-h-[80dvh] max-w-4xl" onClick={(e) => e.stopPropagation()}>
              <img
                src={activePhoto.url}
                alt={`${activeItem.name} — ${activePhoto.label}`}
                className="max-h-[76dvh] w-auto rounded-2xl object-contain shadow-lift"
              />
              {photos.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={prevPhoto}
                    aria-label="Foto sebelumnya"
                    className="absolute left-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-espresso shadow-lift hover:bg-white"
                  >
                    <ChevronLeft size={22} />
                  </button>
                  <button
                    type="button"
                    onClick={nextPhoto}
                    aria-label="Foto berikutnya"
                    className="absolute right-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-espresso shadow-lift hover:bg-white"
                  >
                    <ChevronRight size={22} />
                  </button>
                </>
              )}
            </div>
            <p className="mt-3 text-sm font-semibold text-cream">
              {activeItem.name} · <span className="text-gold-light">{activePhoto.label}</span> ({safeIdx + 1}/{photos.length})
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showOrder && product && !isOwner && <OrderModal product={product} onClose={() => setShowOrder(false)} />}
      </AnimatePresence>
    </div>
  );
}