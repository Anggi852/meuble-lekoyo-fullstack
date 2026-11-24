import { Link, NavLink } from 'react-router-dom';
import {
  Menu,
  X,
  MessageCircle,
  Heart,
  Sparkles,
  User,
  LogOut,
  ClipboardList,
  Crown,
  ArrowRight,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { GoogleLogin } from '@react-oauth/google';
import { toast } from 'sonner';
import { useApp } from '../context/AppContext';
import { extractApiError } from '../services/api';
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
  const [accountOpen, setAccountOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const accountRef = useRef(null);

  const { wishlist, openKoyoWith, user, isOwner, loginWithGoogle, logoutUser, myOrders } = useApp();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (accountRef.current && !accountRef.current.contains(e.target)) {
        setAccountOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const res = await loginWithGoogle(credentialResponse.credential);
      setAccountOpen(false);
      setOpen(false);
      toast.success(
        res?.user?.role === 'owner'
          ? `Mode Owner aktif — Selamat datang, ${res.user.name}!`
          : `Berhasil masuk sebagai ${res?.user?.name || 'Pelanggan'}.`,
      );
    } catch (err) {
      toast.error(extractApiError(err, 'Gagal masuk dengan Google.'));
    }
  };

  const handleLogout = () => {
    logoutUser();
    setAccountOpen(false);
    setOpen(false);
    toast.success('Anda telah keluar dari akun.');
  };

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
      {/* Bilah Eksklusif Owner — HANYA tampil saat akun Owner yang login */}
      {isOwner && (
        <div className="border-b border-gold/30 bg-espresso text-gold-light">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-1.5 text-xs sm:px-6">
            <span className="inline-flex items-center gap-1.5 font-semibold tracking-wide">
              <Crown size={13} className="text-gold" />
              <span>
                Mode Owner Aktif{' '}
                <span className="hidden text-cream/75 sm:inline">
                  · {user?.name || 'Pengelola Meuble Le\'Koyo'}
                </span>
              </span>
            </span>
            <Link
              to="/admin"
              className="inline-flex items-center gap-1 rounded-full bg-gold px-3 py-0.5 text-[11px] font-bold text-espresso transition hover:bg-gold-light"
            >
              Dashboard Owner <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      )}

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
                  `relative rounded-xl px-3.5 py-2 text-[15px] font-medium transition ${
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

            {user && (
              <NavLink
                to="/my-orders"
                className={({ isActive }) =>
                  `relative rounded-xl px-3.5 py-2 text-[15px] font-medium transition ${
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
                    Pesanan Saya
                    {myOrders.length > 0 && (
                      <span className="ml-1.5 inline-grid h-5 min-w-5 place-items-center rounded-full bg-teak px-1 text-[11px] font-bold text-cream">
                        {myOrders.length}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            )}

            <div className="mx-1.5 h-6 w-px bg-line" aria-hidden="true" />

            <button
              type="button"
              onClick={() => openKoyoWith()}
              className="btn-soft !min-h-[40px] !px-3.5 !py-2 text-sm"
            >
              <Sparkles size={15} className="text-gold-dark" /> Tanya Koyo
            </button>

            <a
              href={WA_BASE}
              target="_blank"
              rel="noreferrer"
              className="btn-primary btn-shimmer ml-1 !min-h-[40px] !px-3.5 !py-2 text-sm"
            >
              <MessageCircle size={16} className="text-gold-light" /> WA
            </a>

            {/* Akun / Login Google */}
            <div className="relative ml-1" ref={accountRef}>
              <button
                type="button"
                onClick={() => setAccountOpen((v) => !v)}
                className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                  isOwner
                    ? 'border-gold bg-espresso text-gold-light hover:bg-espresso/90'
                    : 'border-gold/35 bg-sand/80 text-espresso hover:bg-sand'
                }`}
                aria-expanded={accountOpen}
              >
                {user?.picture ? (
                  <img
                    src={user.picture}
                    alt={user.name}
                    className="h-6 w-6 rounded-full object-cover ring-1 ring-gold/50"
                    referrerPolicy="no-referrer"
                  />
                ) : isOwner ? (
                  <Crown size={15} className="text-gold" />
                ) : (
                  <User size={16} className="text-teak" />
                )}
                <span className="max-w-[90px] truncate">
                  {user ? user.name?.split(' ')[0] || 'Akun' : 'Masuk'}
                </span>
                {isOwner && (
                  <span className="rounded-md bg-gold/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gold-light">
                    Owner
                  </span>
                )}
              </button>

              {accountOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-gold/30 bg-cream p-4 shadow-xl">
                  {user ? (
                    <div className="space-y-3">
                      <div className="border-b border-line pb-3">
                        <div className="flex items-center gap-2.5">
                          {user.picture ? (
                            <img
                              src={user.picture}
                              alt={user.name}
                              className="h-9 w-9 rounded-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="grid h-9 w-9 place-items-center rounded-full bg-sand text-teak">
                              <User size={18} />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-espresso">{user.name}</p>
                            {user.email && <p className="truncate text-xs text-muted">{user.email}</p>}
                          </div>
                        </div>

                        {isOwner ? (
                          <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-espresso px-2.5 py-0.5 text-[11px] font-bold text-gold-light">
                            <Crown size={12} className="text-gold" /> Akses Eksklusif Owner
                          </span>
                        ) : (
                          <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-sand px-2.5 py-0.5 text-[11px] font-semibold text-teak">
                            Akun Pelanggan
                          </span>
                        )}
                      </div>

                      {isOwner && (
                        <Link
                          to="/admin"
                          onClick={() => setAccountOpen(false)}
                          className="flex items-center justify-between rounded-xl bg-espresso px-3 py-2.5 text-sm font-semibold text-gold-light transition hover:bg-espresso/90"
                        >
                          <span className="inline-flex items-center gap-2">
                            <Crown size={15} className="text-gold" /> Dashboard Owner
                          </span>
                          <ArrowRight size={14} />
                        </Link>
                      )}

                      <Link
                        to="/my-orders"
                        onClick={() => setAccountOpen(false)}
                        className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-espresso transition hover:bg-sand"
                      >
                        <ClipboardList size={16} className="text-teak" /> Pesanan &amp; Aktivitas Saya
                      </Link>

                      <Link
                        to="/wishlist"
                        onClick={() => setAccountOpen(false)}
                        className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-espresso transition hover:bg-sand"
                      >
                        <Heart size={16} className="text-teak" /> Favorit Saya ({wishlist.length})
                      </Link>

                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                      >
                        <LogOut size={16} /> Keluar
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3 text-center">
                      <p className="text-xs leading-relaxed text-muted">
                        Masuk dengan akun Google untuk menyinkronkan Favorit, memantau pesanan, dan melihat harga final dari Pak Nanang.
                      </p>
                      <div className="flex justify-center">
                        <GoogleLogin
                          onSuccess={handleGoogleSuccess}
                          onError={() => toast.error('Login Google dibatalkan atau gagal.')}
                          useOneTap={false}
                          shape="pill"
                          text="signin_with"
                          locale="id"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
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
            {isOwner && (
              <Link
                to="/admin"
                onClick={() => setOpen(false)}
                className="mb-2 flex items-center justify-between rounded-xl bg-espresso px-4 py-3 text-sm font-bold text-gold-light"
              >
                <span className="inline-flex items-center gap-2">
                  <Crown size={16} className="text-gold" /> Masuk Dashboard Owner
                </span>
                <ArrowRight size={15} />
              </Link>
            )}

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

            {user && (
              <NavLink
                to="/my-orders"
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `block rounded-xl px-4 py-3 text-base font-medium ${
                    isActive ? 'border border-gold/30 bg-sand font-semibold text-espresso' : 'text-bark'
                  }`
                }
              >
                Pesanan &amp; Aktivitas Saya {myOrders.length > 0 ? `(${myOrders.length})` : ''}
              </NavLink>
            )}

            {/* Bagian Akun Google di Menu HP */}
            <div className="my-2 rounded-xl border border-gold/25 bg-sand/50 p-3">
              {user ? (
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-espresso">{user.name}</p>
                    {user.email && <p className="truncate text-xs text-muted">{user.email}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600"
                  >
                    <LogOut size={14} /> Keluar
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <p className="text-center text-xs text-muted">
                    Masuk dengan Google untuk sinkron Favorit &amp; pantau pesanan
                  </p>
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => toast.error('Login Google dibatalkan atau gagal.')}
                    useOneTap={false}
                    shape="pill"
                    text="signin_with"
                    locale="id"
                  />
                </div>
              )}
            </div>

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