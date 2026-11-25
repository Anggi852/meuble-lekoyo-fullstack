import { NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Layers,
  HelpCircle,
  Quote,
  MessageSquare,
  BarChart2,
  Wallet,
  ExternalLink,
  LogOut,
  CalendarDays,
  Activity,
} from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '../../context/AppContext';
import { LogoMark } from '../Navbar';
import { getShopStatus } from '../../utils/format';
import { SWAGGER_DOCS_URL } from '../../services/api';

export default function AdminLayout() {
  const { user, isLoggedIn, logoutAdmin, backendOnline, orders } = useApp();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  if (!isLoggedIn) return <Navigate to="/admin/login" replace />;

  const status = getShopStatus();
  const todayText = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const newOrders = orders.filter(
    (o) =>
      o.status === 'Menunggu Harga Owner' ||
      o.status === 'Menunggu Konfirmasi WA' ||
      o.status === 'Baru',
  ).length;

  const items = [
    { to: '/admin', label: 'Ringkasan', icon: LayoutDashboard, end: true },
    { to: '/admin/orders', label: 'Pesanan', icon: ShoppingBag, badge: newOrders },
    { to: '/admin/products', label: 'Produk', icon: Package },
    { to: '/admin/custom-gallery', label: 'Karya Custom', icon: Layers },
    { to: '/admin/sales', label: 'Penjualan', icon: Wallet },
    { to: '/admin/faqs', label: 'FAQ', icon: HelpCircle },
    { to: '/admin/testimonials', label: 'Testimoni', icon: Quote },
    { to: '/admin/chats', label: 'Log Chat', icon: MessageSquare },
    { to: '/admin/activities', label: 'Aktivitas Akun', icon: Activity },
    { to: '/admin/analytics', label: 'Analitik', icon: BarChart2 },
  ];

  const currentItem =
    items.find((it) => (it.end ? pathname === it.to : pathname.startsWith(it.to))) || items[0];

  const ownerInitials = (user?.name || 'NS')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');

  const logout = () => {
    logoutAdmin();
    toast.info('Anda telah keluar dari portal owner.');
    navigate('/admin/login');
  };

  const Brand = (
    <div className="flex items-center gap-3">
      <LogoMark size={40} />
      <div className="leading-tight">
        <p className="font-heading text-lg font-bold text-cream">Meuble Le'Koyo</p>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold-light">
          Executive Dashboard
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-[100dvh] bg-cream lg:grid lg:grid-cols-[272px_1fr]">
      {/* Sidebar Desktop Mewah */}
      <aside className="luxury-dark sticky top-0 hidden h-screen flex-col border-r border-gold/25 p-5 text-cream/80 lg:flex">
        <div className="pb-5">{Brand}</div>
        <div className="gold-divider mb-5" aria-hidden="true" />

        <nav className="flex-1 space-y-1.5 overflow-y-auto pr-1" aria-label="Menu admin">
          {items.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              end={it.end}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-xl px-4 py-3 text-[14.5px] font-medium transition ${
                  isActive
                    ? 'border border-gold/45 bg-gradient-to-r from-teak to-teak-dark/90 font-semibold text-cream shadow-soft'
                    : 'border border-transparent text-cream/75 hover:border-white/10 hover:bg-white/[0.06] hover:text-cream'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <it.icon
                    size={18}
                    className={
                      isActive ? 'text-gold-light' : 'text-gold-light/65 group-hover:text-gold-light'
                    }
                  />
                  <span className="flex-1">{it.label}</span>
                  {it.badge > 0 && (
                    <span className="grid h-6 min-w-6 place-items-center rounded-full bg-gold px-1.5 text-xs font-bold text-espresso shadow-gold">
                      {it.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="mt-5 space-y-1.5 border-t border-white/10 pt-4">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-cream/80 transition hover:bg-white/10 hover:text-gold-light"
          >
            <ExternalLink size={17} className="text-gold-light/80" /> Lihat Website Galeri
          </a>
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left text-sm font-medium text-cream/70 transition hover:bg-red-500/15 hover:text-red-200"
          >
            <LogOut size={17} /> Keluar
          </button>
        </div>
      </aside>

      <div className="min-w-0 flex flex-col">
        {/* Topbar Desktop */}
        <header className="sticky top-0 z-30 hidden items-center justify-between border-b border-gold/20 bg-cream/90 px-8 py-3.5 backdrop-blur-md lg:flex">
          <div className="flex items-center gap-2.5 text-sm">
            <span className="font-heading text-base font-bold text-espresso">
              {currentItem.label}
            </span>
            <span className="text-gold">✦</span>
            <span className="inline-flex items-center gap-1.5 text-muted">
              <CalendarDays size={14} className="text-gold-dark" /> {todayText}
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold shadow-soft ${
                backendOnline
                  ? 'border-sage/35 bg-sage/10 text-sage'
                  : 'border-red-300 bg-red-50 text-red-700'
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${backendOnline ? 'bg-sage' : 'bg-red-500'}`}
              />
              {backendOnline ? 'API Terhubung' : 'API Offline'}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-white px-3.5 py-1.5 text-xs font-semibold text-bark shadow-soft">
              <span
                className={`h-2 w-2 rounded-full ${status.open ? 'bg-sage' : 'bg-wood/60'}`}
              />
              {status.label}
            </span>
            {user?.picture ? (
              <img
                src={user.picture}
                alt={user.name || 'Owner'}
                className="h-9 w-9 rounded-full border border-gold/50 object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="grid h-9 w-9 place-items-center rounded-full border border-gold/45 bg-espresso font-heading text-sm font-bold text-gold-light">
                {ownerInitials || 'NS'}
              </span>
            )}
          </div>
        </header>

        {/* Header Mobile */}
        <header className="luxury-dark safe-pt sticky top-0 z-30 border-b border-gold/30 lg:hidden">
          <div className="flex items-center justify-between px-4 py-3.5">
            {Brand}
            <div className="flex gap-1 text-cream/85">
              <a
                href="/"
                target="_blank"
                rel="noreferrer"
                className="rounded-xl p-2.5 hover:bg-white/10"
                aria-label="Lihat website"
              >
                <ExternalLink size={20} className="text-gold-light" />
              </a>
              <button
                onClick={logout}
                className="rounded-xl p-2.5 hover:bg-white/10"
                aria-label="Keluar"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
          <nav
            className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-3.5"
            aria-label="Menu admin"
          >
            {items.map((it) => (
              <NavLink
                key={it.to}
                to={it.to}
                end={it.end}
                className={({ isActive }) =>
                  `flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition ${
                    isActive
                      ? 'border-gold bg-gold text-espresso shadow-gold'
                      : 'border-white/15 bg-white/10 text-cream/85'
                  }`
                }
              >
                {it.label}
                {it.badge > 0 && (
                  <span className="grid h-5 min-w-5 place-items-center rounded-full bg-espresso px-1 text-[10px] font-bold text-gold-light">
                    {it.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
        </header>

        <main className="safe-pb mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-8 sm:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}