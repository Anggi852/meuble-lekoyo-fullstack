import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Clock, ShoppingBag, Sparkles, ArrowUpRight, Images } from 'lucide-react';
import ResponsiveImage from './ResponsiveImage';
import { useApp } from '../context/AppContext';
import { formatRupiah } from '../utils/format';
import { getProductImages } from '../utils/image';

export default function ProductCard({ product }) {
  const { wishlist, toggleWishlist, soldOf, openKoyoWith, isOwner } = useApp();
  const sold = soldOf(product.id).total;
  const isSold = product.stockStatus === 'Terjual';
  const isWishlisted = wishlist.some((item) => item.id === product.id);
  const photos = getProductImages(product);
  const primaryPhoto = photos[0]?.url || product.image;
  const secondaryPhoto = photos[1]?.url || null;

  return (
    <article className="card-alive group relative flex flex-col overflow-hidden">
      {!isOwner && (
        <>
          <motion.button
            whileTap={{ scale: 0.82 }}
            onClick={() => toggleWishlist(product)}
            className="absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full border border-white/70 bg-white/90 shadow-soft backdrop-blur-md transition hover:scale-105 hover:border-gold"
            aria-label={isWishlisted ? 'Hapus dari favorit' : 'Simpan ke favorit'}
            aria-pressed={isWishlisted}
          >
            <Heart size={18} className={isWishlisted ? 'fill-red-500 text-red-500' : 'text-bark/70'} />
          </motion.button>

          {/* Tombol hover cepat khusus desktop/laptop */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              openKoyoWith(`Mau pesan ${product.name}`, product);
            }}
            className="absolute right-3 top-[10.5rem] z-10 hidden items-center gap-1 rounded-full border border-gold/50 bg-espresso/95 px-3 py-1.5 text-xs font-semibold text-cream opacity-0 shadow-lift backdrop-blur-sm transition-all duration-300 group-hover:opacity-100 lg:inline-flex"
            title={`Tanya atau pesan ${product.name} lewat Koyo`}
          >
            <Sparkles size={12} className="text-gold-light" /> Tanya Koyo
          </button>
        </>
      )}

      <Link to={`/product/${product.id}`} className="flex flex-1 flex-col">
        {/* Proporsi gambar adaptif: 16:10 di HP, 4:3 di Tablet/Laptop */}
        <div className="relative aspect-[16/10] overflow-hidden bg-sand sm:aspect-[4/3]">
          <ResponsiveImage
            src={primaryPhoto}
            alt={product.name}
            widths={[400, 640, 900]}
            sizes="(max-width: 639px) 94vw, (max-width: 1023px) 46vw, 24vw"
            defaultWidth={640}
            className="h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
          />
          {secondaryPhoto && (
            <ResponsiveImage
              src={secondaryPhoto}
              alt={`${product.name} - ${photos[1]?.label || 'Sudut lain'}`}
              widths={[400, 640]}
              sizes="(max-width: 1023px) 46vw, 24vw"
              defaultWidth={640}
              className="pointer-events-none absolute inset-0 hidden h-full w-full object-cover object-center opacity-0 transition-opacity duration-500 group-hover:opacity-100 lg:block"
            />
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-espresso/45 via-transparent to-transparent opacity-40 transition-opacity duration-300 group-hover:opacity-70" />
          <span className="absolute left-3 top-3 rounded-full border border-gold/30 bg-espresso/80 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wider text-gold-light backdrop-blur-md sm:px-3 sm:text-[11px]">
            {product.category}
          </span>
          {photos.length > 1 && (
            <span className="absolute bottom-2.5 right-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-0.5 text-[11px] font-bold text-espresso shadow-soft backdrop-blur-sm">
              <Images size={11} className="text-teak" /> {photos.length} foto
            </span>
          )}
          {isSold && (
            <span className="absolute bottom-2.5 left-3 rounded-full border border-white/25 bg-espresso/85 px-2.5 py-1 text-[11px] font-semibold text-cream backdrop-blur-sm">
              Terjual · bisa dipesan ulang
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col p-4 sm:p-5">
          <h3 className="font-heading text-[17px] font-bold leading-snug text-espresso transition-colors group-hover:text-teak sm:text-lg">
            {product.name}
          </h3>
          <p className="mt-1 text-lg font-bold tracking-tight text-teak sm:mt-1.5 sm:text-xl">{formatRupiah(product.price)}</p>
          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted sm:mt-2 sm:text-[14.5px]">{product.description}</p>
          <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-line/70 pt-3 text-xs text-muted sm:pt-3.5">
            <span className="flex items-center gap-1.5 font-medium">
              <Clock size={14} className="text-gold-dark" /> ±{product.productionTime}
            </span>
            {sold > 0 ? (
              <span className="flex items-center gap-1 rounded-full border border-gold/30 bg-sand/80 px-2.5 py-0.5 font-bold text-teak">
                <ShoppingBag size={12} /> Terjual {sold}×
              </span>
            ) : (
              <span className="inline-flex items-center gap-0.5 font-bold text-gold-dark transition group-hover:translate-x-0.5">
                Detail <ArrowUpRight size={14} />
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Tombol sentuh cepat untuk HP — hanya untuk pelanggan */}
      {!isOwner && (
        <div className="border-t border-line/60 bg-cream/70 px-4 py-2.5 lg:hidden">
          <button
            type="button"
            onClick={() => openKoyoWith(`Mau pesan ${product.name}`, product)}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-gold/35 bg-white py-2 text-xs font-bold text-espresso shadow-soft active:scale-[0.98]"
          >
            <Sparkles size={13} className="text-gold-dark" /> Tanya / Pesan lewat Koyo
          </button>
        </div>
      )}
    </article>
  );
}