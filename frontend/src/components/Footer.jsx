import { Link } from 'react-router-dom';
import { MapPin, Phone, Clock, Sparkles, ExternalLink } from 'lucide-react';
import { LogoMark } from './Navbar';
import { WA_BASE } from '../services/whatsapp';
import { STORE } from '../data/store';
import { getShopStatus } from '../utils/format';

export default function Footer() {
  const status = getShopStatus();
  return (
    <footer className="luxury-dark relative mt-14 border-t border-gold/30 text-cream/85">
      <div className="gold-divider" aria-hidden="true" />
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.35fr_1.15fr_0.95fr]">
        <div>
          <div className="flex items-center gap-3.5">
            <LogoMark size={44} />
            <div>
              <h3 className="font-heading text-2xl font-bold text-cream">{STORE.name}</h3>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-gold-light">Galeri Jati Solid Jambi</p>
            </div>
          </div>
          <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-cream/80">
            Furnitur kayu jati solid pilihan asli Jambi. Melayani pembelian siap jual maupun pesanan custom apa saja — mulai dari kitchen set, meja, lemari, kamar set, hingga pintu &amp; partisi — dengan pengiriman luar daerah.
          </p>
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-[14.5px] font-medium">
            <Link to="/catalog" className="transition hover:text-gold-light">Katalog</Link>
            <Link to="/custom" className="transition hover:text-gold-light">Studio Custom</Link>
            <Link to="/wishlist" className="transition hover:text-gold-light">Favorit</Link>
          </div>
        </div>

        <div>
          <h4 className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-gold-light">Kontak &amp; Alamat Showroom</h4>
          <ul className="space-y-3.5 text-[14.5px]">
            <li className="flex items-start gap-3">
              <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-gold/25 bg-white/10 text-gold-light">
                <Phone size={15} />
              </span>
              <span>
                <strong className="block font-semibold text-cream">{STORE.owner}</strong>
                <a href={WA_BASE} target="_blank" rel="noreferrer" className="text-cream/85 transition hover:text-gold-light">
                  WhatsApp / HP: {STORE.phoneDisplay}
                </a>
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-gold/25 bg-white/10 text-gold-light">
                <MapPin size={15} />
              </span>
              <span>
                <span className="block leading-relaxed text-cream/85">{STORE.address}</span>
                <a
                  href={STORE.mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-bold text-gold-light transition hover:underline"
                >
                  Buka lokasi di Google Maps <ExternalLink size={12} />
                </a>
              </span>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-gold-light">Jam Operasional</h4>
          <p className="flex items-start gap-3 text-[14.5px]">
            <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-gold/25 bg-white/10 text-gold-light">
              <Clock size={15} />
            </span>
            <span className="text-cream/85">
              {STORE.hoursWeekday}
              <br />
              {STORE.hoursSunday}
            </span>
          </p>
          <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-cream">
            <span className={`h-2 w-2 rounded-full ${status.open ? 'bg-emerald-400' : 'bg-cream/50'}`} /> {status.label}
          </p>
        </div>
      </div>

      <div className="safe-pb border-t border-white/15 py-5">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 text-xs text-cream/65 sm:px-6">
          <p>© {new Date().getFullYear()} {STORE.name} · Capstone Project A26-CS019</p>
          <Link to="/admin" className="inline-flex items-center gap-1.5 font-semibold text-gold-light/90 transition hover:text-gold-light">
            <Sparkles size={12} /> Portal Owner &amp; Admin
          </Link>
        </div>
      </div>
    </footer>
  );
}
