import { Link, NavLink } from 'react-router-dom';
import { Menu, X, MessageCircle, Heart, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { WA_BASE } from '../services/whatsapp';

const navItems = [
  { name: 'Beranda', path: '/', end: true },
  { name: 'Katalog', path: '/catalog' },
  { name: 'Custom', path: '/custom' },
  { name: 'Favorit', path: '/wishlist', wish: true },
];

export function LogoMark({ size = 38 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id="lk-mark-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6E3F22" />
          <stop offset="100%" stopColor="#1C130E" />
        </linearGradient>
        <linearGradient id="lk-mark-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F3DC9B" />
          <stop offset="100%" stopColor="#C69B3A" />
        </linearGradient>
      </defs>
      <rect x="1.5" y="1.5" width="61" height="61" rx="16" fill="url(#lk-mark-bg)" stroke="url(#lk-mark-gold)" strokeWidth="2.4" />
      <g fill="none" stroke="url(#lk-mark-gold)" strokeWidth="2.6" strokeLinecap="round">
        <ellipse cx="32" cy="32" rx="20.5" ry="17.5" opacity=".42" />
        <ellipse cx="32" cy="32" rx="13.5" ry="11" opacity=".76" />
        <ellipse cx="32" cy="32" rx="6.5" ry="5" />
      </g>
    </svg>
  );
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { wishlist, openKoyoWith } = useApp();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const badge = wishlist.length > 0 && (
    <motion.span
      key={wishlist.length}
      initial={{ scale: 0.5 }}
      animate={{ scale: 1 }}
      className="ml-1.5 inline-grid h-5 min-w-5 place-items-center rounded-full bg-gold px-1 text-[11px] font-bold text-espresso"
    >
      {wishlist.length}
    </motion.span>
  );

  return (
    <header
      className={`sticky top-0 z-50 safe-pt border-b transition-all duration-300 ${
        scrolled
          ? 'border-gold/25 bg-cream/95 shadow-soft backdrop-blur-lg'
          : 'border-line/70 bg-cream/85 backdrop-blur-md'
      }`}
    >
      <nav className="mx-auto max-w-6xl px-4 sm:px-6" aria-label="Navigasi utama">
        <div className="flex h-16 sm:h-[4.5rem] items-center justify-between">
          <Link to="/" className="group flex items-center gap-3" onClick={() => setOpen(false)}>
            <span className="transition-transform duration-300 group-hover:scale-105">
              <LogoMark size={40} />
            </span>
            <span className="leading-tight">
              <span className="font-heading block text-xl font-bold tracking-tight text-espresso">
                Meuble <span className="text-teak">Le'Koyo</span>
              </span>
              <span className="hidden text-[10px] font-bold uppercase tracking-[0.22em] text-gold-dark sm:block">
                Galeri Jati Solid Jambi
              </span>
            </span>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                end={item.end}
                className={({ isActive }) =>
                  `relative rounded-xl px-4 py-2 text-[15px] font-medium transition ${
                    isActive ? 'font-semibold text-espresso' : 'text-muted hover:text-espresso'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.span
                        layoutId="nav-active-pill"
                        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                        className="absolute inset-0 -z-10 rounded-xl border border-gold/35 bg-sand/85 shadow-[inset_0_1px_0_rgba(255,255,255,.7)]"
                      />
                    )}
                    {item.name}
                    {item.wish && badge}
                  </>
                )}
              </NavLink>
            ))}

            <div className="mx-2 h-6 w-px bg-line" aria-hidden="true" />

            <button
              type="button"
              onClick={() => openKoyoWith()}
              className="btn-soft !min-h-[42px] !px-4 !py-2 text-sm"
            >
              <Sparkles size={15} className="text-gold-dark" /> Tanya Koyo
            </button>
            <a
              href={WA_BASE}
              target="_blank"
              rel="noreferrer"
              className="btn-primary btn-shimmer ml-1.5 !min-h-[42px] !px-4 !py-2 text-sm"
            >
              <MessageCircle size={16} className="text-gold-light" /> Hubungi Kami
            </a>
          </div>

          <div className="flex items-center gap-1 md:hidden">
            <button
              type="button"
              onClick={() => openKoyoWith()}
              className="rounded-xl border border-gold/30 bg-sand p-2.5 text-teak"
              aria-label="Tanya Koyo"
            >
              <Sparkles size={20} className="text-gold-dark" />
            </button>
            <Link to="/wishlist" className="relative rounded-lg p-3 text-muted" aria-label="Favorit">
              <Heart size={22} />
              {wishlist.length > 0 && (
                <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-gold px-1 text-[10px] font-bold text-espresso">
                  {wishlist.length}
                </span>
              )}
            </Link>
            <button
              className="rounded-lg p-3 text-espresso"
              onClick={() => setOpen(!open)}
              aria-label="Buka menu"
              aria-expanded={open}
            >
              {open ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-1 border-t border-line pb-4 pt-3 md:hidden"
          >
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                end={item.end}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `block rounded-xl px-4 py-3 text-base font-medium ${
                    isActive ? 'border border-gold/30 bg-sand font-semibold text-espresso' : 'text-bark'
                  }`
                }
              >
                {item.name}
              </NavLink>
            ))}
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                openKoyoWith();
              }}
              className="btn-soft mt-2 w-full"
            >
              <Sparkles size={17} className="text-gold-dark" /> Ngobrol dengan Koyo
            </button>
            <a href={WA_BASE} target="_blank" rel="noreferrer" className="btn-primary mt-2 w-full">
              <MessageCircle size={18} className="text-gold-light" /> Hubungi Kami
            </a>
          </motion.div>
        )}
      </nav>
    </header>
  );
}
