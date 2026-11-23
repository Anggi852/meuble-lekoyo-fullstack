import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Images, MapPin, Ruler, Sparkles, ArrowUpRight } from 'lucide-react';
import ResponsiveImage from './ResponsiveImage';
import { getProductImages } from '../utils/image';

export default function CustomPortfolioCard({ item, onUseAsBase }) {
  const photos = getProductImages(item);
  const [idx, setIdx] = useState(0);
  const safeIdx = Math.min(idx, Math.max(0, photos.length - 1));
  const active = photos[safeIdx] || { url: '/toko-mobile.jpg', label: 'Tampak Depan' };

  const prev = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIdx((i) => (i - 1 + photos.length) % photos.length);
  };
  const next = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIdx((i) => (i + 1) % photos.length);
  };

  return (
    <article className="card-alive group flex flex-col overflow-hidden">
      <Link to={`/product/custom-${item.id}`} className="relative block aspect-[16/10] overflow-hidden bg-sand sm:aspect-[4/3]">
        <ResponsiveImage
          src={active.url}
          alt={`${item.name} — ${active.label}`}
          widths={[400, 640, 900]}
          sizes="(max-width: 639px) 94vw, (max-width: 1023px) 46vw, 24vw"
          defaultWidth={640}
          className="h-full w-full object-cover object-center transition duration-500 group-hover:scale-105"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-espresso/55 via-transparent to-transparent" />

        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <span className="rounded-full border border-gold/45 bg-gold px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-espresso shadow-soft">
            Pernah Dicustom
          </span>
          <span className="rounded-full border border-gold/35 bg-espresso/85 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gold-light backdrop-blur-md">
            {item.category}
          </span>
        </div>

        <div className="pointer-events-none absolute inset-x-3 bottom-2.5 flex items-center justify-between gap-2">
          <span className="rounded-full bg-white/92 px-2.5 py-0.5 text-[11px] font-bold text-espresso shadow-soft">
            {active.label}
          </span>
          {photos.length > 1 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-espresso/80 px-2 py-0.5 text-[10.5px] font-semibold text-cream">
              <Images size={10} /> {safeIdx + 1}/{photos.length}
            </span>
          )}
        </div>

        {photos.length > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="Foto sebelumnya"
              className="absolute left-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-espresso shadow-soft transition hover:bg-white sm:opacity-0 sm:group-hover:opacity-100"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Foto berikutnya"
              className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-espresso shadow-soft transition hover:bg-white sm:opacity-0 sm:group-hover:opacity-100"
            >
              <ChevronRight size={16} />
            </button>
          </>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <Link to={`/product/custom-${item.id}`} className="group/title">
          <h4 className="font-heading text-[17px] font-bold leading-snug text-espresso transition group-hover/title:text-teak">
            {item.name}
          </h4>
        </Link>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
          {item.size && (
            <span className="inline-flex items-center gap-1 font-semibold text-teak">
              <Ruler size={12} /> {item.size}
            </span>
          )}
          {item.city && (
            <span className="inline-flex items-center gap-1">
              <MapPin size={12} className="text-gold-dark" /> {item.city}
            </span>
          )}
        </div>

        {item.finish && (
          <p className="mt-1 text-xs text-muted">
            Finishing: <span className="font-semibold text-bark">{item.finish}</span>
          </p>
        )}

        {item.description && (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">{item.description}</p>
        )}

        <div className="mt-auto flex items-center gap-2 pt-4">
          <button
            type="button"
            onClick={() => onUseAsBase(item)}
            className="btn-soft !min-h-[40px] flex-1 !rounded-xl !px-3 text-xs font-bold"
          >
            <Sparkles size={13} className="text-gold-dark" /> Pesan Serupa
          </button>
          <Link
            to={`/product/custom-${item.id}`}
            className="inline-flex min-h-[40px] items-center justify-center gap-1 rounded-xl border border-line bg-white px-3 text-xs font-bold text-espresso transition hover:border-gold hover:text-teak"
          >
            Detail <ArrowUpRight size={13} />
          </Link>
        </div>
      </div>
    </article>
  );
}
