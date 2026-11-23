import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion';
import { ArrowRight, MapPin, MessageCircle, ShieldCheck, Ruler, Truck, Sparkles } from 'lucide-react';
import Koyo from './Koyo';
import ResponsiveImage from './ResponsiveImage';
import { useApp } from '../context/AppContext';
import { WA_BASE } from '../services/whatsapp';
import { STORE } from '../data/store';
import { formatRupiah } from '../utils/format';

const ease = [0.22, 1, 0.36, 1];
const rotating = ['kitchen set jati', 'meja makan', 'kursi ukir', 'lemari jati', 'kamar set', 'pintu & partisi'];
const marquee = [
  'Kayu Jati Solid Asli',
  'Ukiran & Custom Presisi (±2 Bln)',
  'Sistem Tabung Fleksibel',
  'Pengiriman Luar Daerah Jambi',
  'Garansi Perbaikan Tukang',
  'Konsultasi Langsung Pak Nanang',
];
const koyoGreetings = [
  'Selamat datang! Cari furnitur jati apa?',
  'Bisa pakai Sistem Tabung lho!',
  'Melayani kirim Palembang, Padang & sekitarnya!',
  'Klik aku buat dibantu pilih koleksi!',
];

function RotatingWord() {
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);
  useEffect(() => {
    if (reduce) return undefined;
    const id = setInterval(() => setI((n) => (n + 1) % rotating.length), 2400);
    return () => clearInterval(id);
  }, [reduce]);
  return (
    <span className="inline-block overflow-hidden py-0.5 align-bottom">
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={rotating[i]}
          className="font-heading inline-block italic font-semibold text-teak underline decoration-gold/70 decoration-2 underline-offset-4"
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '-100%', opacity: 0 }}
          transition={{ duration: 0.35, ease }}
        >
          {rotating[i]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function HeadlineWords({ text, startDelay = 0, marker = false, italic = false }) {
  return text.split(' ').map((w, i) => (
    <span key={`${w}-${i}`}>
      <span
        className={`inline-block overflow-hidden pb-[0.14em] align-bottom ${marker ? 'marker text-teak' : ''} ${italic ? 'italic font-medium' : ''}`}
        style={marker ? { animationDelay: `${startDelay + 0.55 + i * 0.12}s` } : undefined}
      >
        <motion.span
          className="inline-block"
          initial={{ y: '110%' }}
          animate={{ y: 0 }}
          transition={{ delay: startDelay + i * 0.09, duration: 0.7, ease }}
        >
          {w}
        </motion.span>
      </span>{' '}
    </span>
  ));
}

const motes = [
  { x: 6, s: 7, d: 14, t: 0 }, { x: 18, s: 9, d: 18, t: 3 }, { x: 31, s: 5, d: 16, t: 6 },
  { x: 48, s: 8, d: 19, t: 2 }, { x: 63, s: 6, d: 15, t: 8 }, { x: 78, s: 9, d: 17, t: 4 },
  { x: 91, s: 6, d: 20, t: 1 },
];

export default function Hero({ hero, status }) {
  const reduce = useReducedMotion();
  const { openKoyoWith } = useApp();
  const [greetIdx, setGreetIdx] = useState(0);

  useEffect(() => {
    if (reduce) return undefined;
    const id = setInterval(() => setGreetIdx((n) => (n + 1) % koyoGreetings.length), 3600);
    return () => clearInterval(id);
  }, [reduce]);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 60, damping: 18 });
  const sy = useSpring(my, { stiffness: 60, damping: 18 });
  const blobX = useTransform(sx, (v) => v * 32);
  const blobY = useTransform(sy, (v) => v * 32);
  const photoX = useTransform(sx, (v) => v * -12);
  const photoY = useTransform(sy, (v) => v * -10);
  const cardX = useTransform(sx, (v) => v * 24);
  const cardY = useTransform(sy, (v) => v * 16);
  const badgeX = useTransform(sx, (v) => v * -28);
  const badgeY = useTransform(sy, (v) => v * -20);

  // Parallax hanya aktif untuk perangkat mouse (desktop/laptop), nonaktif di layar sentuh Android/iOS
  const onMove = (e) => {
    if (reduce) return;
    if (typeof window !== 'undefined' && !window.matchMedia('(pointer: fine)').matches) return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onLeave = () => { mx.set(0); my.set(0); };

  return (
    <section
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="wood-grain-bg relative overflow-x-clip overflow-y-hidden"
      style={{
        backgroundImage:
          'radial-gradient(62rem 34rem at 86% 6%, rgba(198,155,58,.20), transparent 62%), radial-gradient(48rem 32rem at 0% 100%, rgba(167,116,66,.16), transparent 60%)',
      }}
    >
      <div className="pointer-events-none absolute inset-0 hidden sm:block" aria-hidden>
        {motes.map((m, i) => (
          <span
            key={i}
            className="mote mote-wood"
            style={{ left: `${m.x}%`, width: m.s, height: m.s, animationDuration: `${m.d}s`, animationDelay: `${m.t}s` }}
          />
        ))}
      </div>

      <div className="relative mx-auto grid max-w-6xl items-center gap-9 px-4 pb-12 pt-6 sm:gap-12 sm:px-6 sm:pb-16 sm:pt-10 lg:grid-cols-[1.06fr_0.94fr] lg:gap-12 lg:pb-20 lg:pt-14">
        {/* ---------- Teks Editorial ---------- */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease }}
            className="flex flex-wrap items-center gap-2"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/35 bg-white/95 px-3.5 py-1.5 text-xs font-semibold text-bark shadow-soft">
              <span className={`h-2 w-2 shrink-0 rounded-full ${status.open ? 'animate-pulse bg-sage' : 'bg-wood/60'}`} />
              <span className="truncate">{status.label}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-espresso px-3 py-1.5 text-[10.5px] font-bold uppercase tracking-[0.15em] text-gold-light shadow-soft sm:px-3.5 sm:text-[11px]">
              <Sparkles size={12} /> Galeri Jati Solid Jambi
            </span>
          </motion.div>

          <h1 className="font-heading mt-5 text-[clamp(2rem,8.2vw,3.85rem)] font-bold leading-[1.1] text-espresso">
            <HeadlineWords text="Karya jati asli Jambi," />
            <br className="hidden sm:block" />
            <HeadlineWords text="elegan untuk setiap ruang." startDelay={0.45} marker italic />
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.55, ease }}
            className="mt-4 text-lg text-bark sm:mt-6 sm:text-xl"
          >
            Kami merancang <RotatingWord /> dari kayu jati solid pilihan.
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0, duration: 0.55, ease }}
            className="mt-2 max-w-lg text-[15.5px] leading-relaxed text-muted sm:text-[17px]"
          >
            Jelajahi koleksi unggulan, rancang ukuran custom sesuai rumahmu, atau diskusi santai bersama Koyo sebelum konfirmasi ke WhatsApp Pak Nanang.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.15, duration: 0.55, ease }}
            className="mt-6 grid grid-cols-1 gap-2.5 sm:mt-8 sm:flex sm:flex-wrap sm:gap-3"
          >
            <Link to="/catalog" className="btn-primary btn-shimmer group w-full sm:w-auto sm:!px-6">
              Jelajahi Katalog <ArrowRight size={18} className="text-gold-light transition group-hover:translate-x-1" />
            </Link>
            <div className="grid grid-cols-2 gap-2.5 sm:contents">
              <button type="button" onClick={() => openKoyoWith()} className="btn-gold group w-full !px-3.5 text-sm sm:w-auto sm:!px-5 sm:text-[15px]">
                <Sparkles size={16} className="shrink-0 transition group-hover:rotate-12" /> Konsultasi Koyo
              </button>
              <a href={WA_BASE} target="_blank" rel="noreferrer" className="btn-outline w-full !px-3.5 text-sm sm:w-auto sm:!px-5 sm:text-[15px]">
                <MessageCircle size={17} className="shrink-0" /> Pak Nanang
              </a>
            </div>
          </motion.div>

          {/* Baris Jaminan Kualitas */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.35, duration: 0.5 }}
            className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-gold/25 pt-4 text-xs sm:mt-9 sm:gap-x-6 sm:pt-5 sm:text-sm"
          >
            <span className="flex items-center gap-2 font-semibold text-bark">
              <span className="h-1.5 w-1.5 rotate-45 bg-gold" /> Pengerjaan ±2 Bulan
            </span>
            <span className="flex items-center gap-2 font-semibold text-bark">
              <span className="h-1.5 w-1.5 rotate-45 bg-gold" /> Tunai &amp; Sistem Tabung
            </span>
            <span className="flex items-center gap-2 font-semibold text-bark">
              <span className="h-1.5 w-1.5 rotate-45 bg-gold" /> Garansi Servis Tukang
            </span>
          </motion.div>
        </div>

        {/* ---------- Visual Galeri Adaptif (HP Android/iOS vs Tablet vs Laptop) ---------- */}
        <div className="relative mx-auto w-full max-w-[32rem] lg:pb-6">
          <motion.div style={{ x: blobX, y: blobY }} className="absolute -inset-4 hidden sm:block lg:-inset-6" aria-hidden>
            <div className="drift h-full w-full rounded-[45%] bg-gradient-to-br from-gold/30 via-wood/30 to-transparent blur-2xl" />
          </motion.div>

          {/* Foto Showroom dengan <picture> khusus HP (4:3), Tablet (5:4), dan Laptop (Arch 1:1.03) */}
          <motion.div style={{ x: photoX, y: photoY }} className="relative">
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.8, ease }}
              className="relative aspect-[4/3] overflow-hidden rounded-[1.5rem] border-[4px] border-white bg-sand shadow-lift ring-1 ring-gold/40 sm:aspect-[5/4] sm:rounded-[2rem] sm:border-[6px] lg:aspect-[1/1.03] lg:rounded-t-[999px] lg:rounded-b-[2rem] lg:border-[7px] lg:ring-2 lg:ring-gold/35"
            >
              <picture>
                <source media="(max-width: 639px)" srcSet="/toko-mobile.jpg" />
                <source media="(max-width: 1023px)" srcSet="/toko-tablet.jpg" />
                <img
                  src="/toko-hero.jpg"
                  alt="Toko Jati Le'Koyo Meuble di Jambi"
                  fetchPriority="high"
                  className="kenburns h-full w-full object-cover object-center"
                />
              </picture>
              <div className="pointer-events-none absolute inset-2.5 rounded-[1.1rem] border border-white/30 sm:inset-3 sm:rounded-[1.5rem] lg:rounded-t-[999px] lg:rounded-b-[1.4rem]" />
              <div className="absolute inset-0 bg-gradient-to-t from-espresso/70 via-espresso/10 to-transparent" />
              <div className="shine pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-gold-light/25 to-transparent" aria-hidden />

              {/* Badge Lokasi — selalu terbaca bersih tanpa menabrak elemen lain */}
              <div className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-2 sm:inset-x-4 sm:bottom-4">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/45 bg-espresso/85 px-3 py-1 text-[11px] font-bold text-gold-light backdrop-blur-md lg:hidden">
                  <ShieldCheck size={13} /> 100% Jati Asli
                </span>
                <a
                  href={STORE.mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-espresso/85 px-3 py-1 text-xs font-semibold text-cream shadow-soft backdrop-blur-md transition hover:border-gold hover:bg-espresso"
                >
                  <MapPin size={13} className="text-gold-light" /> Telanaipura, Jambi · Maps
                </a>
              </div>
            </motion.div>
          </motion.div>

          {/* Lencana berputar Espresso & Gold — hanya tampil di tablet lebar / laptop agar HP tidak sesak */}
          <motion.div style={{ x: badgeX, y: badgeY }} className="absolute -left-6 top-10 z-10 hidden lg:block xl:-left-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.4, rotate: -90 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ delay: 0.9, type: 'spring', stiffness: 120, damping: 14 }}
              className="relative grid h-28 w-28 place-items-center rounded-full border border-gold/45 bg-espresso shadow-lift"
            >
              <svg viewBox="0 0 120 120" className="spin-slow absolute inset-0 h-full w-full" aria-hidden>
                <defs><path id="lk-circle" d="M60,60 m-45,0 a45,45 0 1,1 90,0 a45,45 0 1,1 -90,0" /></defs>
                <text fontSize="10.5" fontWeight="700" fill="#E6C97A" textLength="280" lengthAdjust="spacing">
                  <textPath href="#lk-circle">KAYU JATI ASLI • BUATAN JAMBI • </textPath>
                </text>
              </svg>
              <span className="grid h-11 w-11 place-items-center rounded-full border border-gold/50 bg-gradient-to-br from-gold-light to-gold-dark text-espresso shadow-gold">
                <ShieldCheck size={22} />
              </span>
            </motion.div>
          </motion.div>

          {/* Koyo interaktif: di laptop melayang di pojok kanan atas, di HP/tablet tampil rapi di bawah foto tanpa menutupi toko */}
          <motion.button
            type="button"
            onClick={() => openKoyoWith()}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ delay: 1.1, type: 'spring', stiffness: 160, damping: 16 }}
            className="group mt-3.5 flex w-full items-center gap-3 rounded-2xl border border-gold/35 bg-white/95 p-2.5 pr-4 text-left shadow-soft backdrop-blur-md transition hover:border-gold lg:absolute lg:-right-4 lg:-top-3 lg:z-20 lg:mt-0 lg:w-auto lg:items-start lg:gap-2 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none lg:backdrop-blur-none"
            aria-label="Klik Koyo untuk mulai ngobrol"
          >
            <span className="relative order-first block h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-white bg-sand shadow-soft ring-2 ring-gold/60 lg:order-last lg:h-16 lg:w-16 lg:border-[3px] lg:shadow-lift">
              <Koyo face mood="excited" tracking={false} className="h-full w-full" />
              <span className="absolute bottom-0.5 right-0.5 h-3 w-3 rounded-full border-2 border-white bg-sage lg:h-3.5 lg:w-3.5" />
            </span>
            <div className="min-w-0 flex-1 lg:mt-2 lg:max-w-[13.5rem] lg:flex-none lg:rounded-2xl lg:rounded-br-sm lg:border lg:border-gold/40 lg:bg-white/95 lg:px-3.5 lg:py-2 lg:shadow-lift">
              <span className="block text-[10px] font-bold uppercase tracking-widest text-gold-dark lg:hidden">
                Koyo Online · Ketuk untuk Chat
              </span>
              <AnimatePresence mode="wait">
                <motion.span
                  key={greetIdx}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.25 }}
                  className="block truncate text-xs font-semibold leading-snug text-bark sm:text-[13px] lg:whitespace-normal"
                >
                  {koyoGreetings[greetIdx]}
                </motion.span>
              </AnimatePresence>
            </div>
          </motion.button>

          {/* Chip melayang khusus desktop */}
          <motion.button
            type="button"
            onClick={() => openKoyoWith('Saya mau pesan custom')}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ scale: 1.06 }}
            transition={{ delay: 1.5, duration: 0.5, ease }}
            className="absolute -right-5 top-[46%] z-10 hidden lg:block"
          >
            <span className="bob flex items-center gap-2 rounded-full border border-gold/40 bg-white/95 px-4 py-2 text-sm font-semibold text-espresso shadow-lift transition hover:border-gold hover:bg-espresso hover:text-cream" style={{ animationDelay: '1s' }}>
              <Ruler size={15} className="text-gold-dark" /> Custom Presisi
            </span>
          </motion.button>
          <motion.button
            type="button"
            onClick={() => openKoyoWith('Bisa kirim ke luar Jambi?')}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ scale: 1.06 }}
            transition={{ delay: 1.65, duration: 0.5, ease }}
            className="absolute -left-8 top-[58%] z-10 hidden lg:block"
          >
            <span className="bob flex items-center gap-2 rounded-full border border-gold/40 bg-white/95 px-4 py-2 text-sm font-semibold text-espresso shadow-lift transition hover:border-gold hover:bg-espresso hover:text-cream" style={{ animationDelay: '1.6s' }}>
              <Truck size={15} className="text-gold-dark" /> Kirim Luar Jambi
            </span>
          </motion.button>

          {/* Kartu produk unggulan: rapi di bawah foto pada HP/Tablet, melayang elegan di Laptop */}
          {hero && (
            <motion.div
              style={{ x: cardX, y: cardY }}
              className="mt-3 lg:absolute lg:-bottom-2 lg:-left-6 lg:z-20 lg:mt-0 lg:min-w-[19.5rem]"
            >
              <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9, duration: 0.55, ease }}>
                <Link
                  to={`/product/${hero.id}`}
                  className="glass-warm group flex items-center gap-3.5 rounded-2xl border border-gold/35 p-2.5 pr-4 shadow-soft transition hover:border-gold lg:gap-4 lg:p-3 lg:pr-5 lg:shadow-lift lg:hover:-translate-y-1"
                >
                  <ResponsiveImage
                    src={hero.image}
                    alt={hero.name}
                    widths={[160, 320]}
                    sizes="64px"
                    defaultWidth={240}
                    className="h-14 w-14 shrink-0 rounded-xl object-cover shadow-soft ring-1 ring-gold/25 sm:h-16 sm:w-16"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-gold-dark">Koleksi Pilihan</span>
                    <span className="font-heading block truncate text-[15px] font-bold text-espresso sm:text-base">{hero.name}</span>
                    <span className="flex items-center justify-between gap-3">
                      <span className="text-sm font-bold text-teak sm:text-base">{formatRupiah(hero.price)}</span>
                      <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-teak">
                        Detail <ArrowRight size={13} className="transition group-hover:translate-x-1" />
                      </span>
                    </span>
                  </span>
                </Link>
              </motion.div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Pita Marquee Espresso & Champagne Gold */}
      <div className="relative overflow-hidden border-y border-gold/30 bg-espresso py-3 text-cream shadow-soft sm:py-3.5" aria-hidden>
        <div className="marquee flex w-max">
          {[0, 1].map((g) => (
            <div key={g} className="flex shrink-0 items-center">
              {marquee.map((m) => (
                <span key={`${g}-${m}`} className="flex items-center text-[11px] font-semibold uppercase tracking-[0.2em] text-cream/90 sm:text-xs sm:tracking-[0.22em]">
                  <span className="px-5 sm:px-7">{m}</span>
                  <span className="text-gold-light">✦</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
