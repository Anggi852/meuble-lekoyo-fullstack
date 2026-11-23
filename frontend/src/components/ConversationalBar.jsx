import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Sparkles, Compass, Wallet, Truck, Ruler } from 'lucide-react';
import Koyo from './Koyo';
import { useApp } from '../context/AppContext';

const LIVE_PLACEHOLDERS = [
  'Cari meja makan jati di bawah 5 juta...',
  'Bagaimana cara kerja sistem tabung?',
  'Bisa kirim lemari jati ke Padang atau Palembang?',
  'Mau custom kamar set kayu jati, berapa lama?',
  'Rekomendasi kursi tamu ukir untuk ruang minimalis...',
];

const QUICK_SCENARIOS = [
  {
    icon: Compass,
    label: 'Meja < 5 Juta',
    prompt: 'Cari meja di bawah 5 juta',
    reaction: 'Siap! Koyo cek koleksi meja jati terbaik di bawah 5 juta buatmu!',
    mood: 'excited',
  },
  {
    icon: Wallet,
    label: 'Sistem Tabung',
    prompt: 'Bagaimana cara kerja sistem tabung?',
    reaction: 'Dengan Sistem Tabung, bahan langsung dibeli & barang mulai dibuat!',
    mood: 'happy',
  },
  {
    icon: Truck,
    label: 'Kirim Luar Jambi',
    prompt: 'Bisa kirim ke luar Jambi?',
    reaction: 'Tentu bisa! Kami biasa kirim ke Palembang, Padang, Pekanbaru, Batam & Medan.',
    mood: 'excited',
  },
  {
    icon: Ruler,
    label: 'Custom (±2 Bln)',
    prompt: 'Saya mau pesan custom',
    reaction: 'Punya ukuran sendiri? Koyo arahkan ke Studio Custom atau bantu rangkum ke WA!',
    mood: 'happy',
  },
];

export default function ConversationalBar() {
  const { openKoyoWith } = useApp();
  const [query, setQuery] = useState('');
  const [phIdx, setPhIdx] = useState(0);
  const [hoveredScenario, setHoveredScenario] = useState(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setPhIdx((n) => (n + 1) % LIVE_PLACEHOLDERS.length), 3200);
    return () => clearInterval(id);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      openKoyoWith();
      return;
    }
    openKoyoWith(trimmed);
    setQuery('');
  };

  const koyoSpeech = hoveredScenario
    ? hoveredScenario.reaction
    : isFocused
    ? 'Tulis saja santai ya—boleh sebut nama furnitur, budget, atau kota tujuanmu!'
    : 'Selamat datang di Galeri Le\'Koyo! Mau Koyo bantu pilihkan furnitur jati hari ini?';

  const koyoMood = hoveredScenario ? hoveredScenario.mood : isFocused ? 'excited' : 'happy';

  return (
    <section className="mx-auto max-w-6xl px-4 pt-10 sm:px-6 sm:pt-14">
      <div className="luxury-panel relative overflow-hidden p-4 sm:p-7 lg:p-9">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gold/15 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-24 left-12 h-60 w-60 rounded-full bg-wood/15 blur-3xl" aria-hidden="true" />

        <div className="relative grid items-center gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-8">
          {/* Panggung Concierge: kompak horizontal di HP agar tak makan tempat, penuh di tablet/laptop */}
          <div className="relative flex flex-row items-end gap-3.5 overflow-hidden rounded-2xl border border-gold/35 bg-gradient-to-br from-sand/90 via-cream to-white px-3.5 pt-4 text-bark shadow-soft sm:gap-5 sm:rounded-[1.5rem] sm:px-6 sm:pt-5">
            <div className="relative h-28 w-24 shrink-0 sm:h-44 sm:w-36 lg:h-48 lg:w-40">
              <div className="absolute inset-x-0 bottom-0 h-16 rounded-t-3xl bg-gradient-to-t from-gold/15 to-transparent" aria-hidden />
              <Koyo
                speaking={Boolean(hoveredScenario) || isFocused}
                mood={koyoMood}
                className="relative z-10 h-full w-full"
              />
            </div>

            <div className="min-w-0 flex-1 pb-3.5 sm:pb-5">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-sage/30 bg-white/95 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sage shadow-soft sm:px-3 sm:py-1 sm:text-[11px]">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-sage sm:h-2 sm:w-2" /> Koyo Concierge
              </span>

              <div className="mt-2 min-h-[3.75rem] rounded-xl rounded-tl-sm border border-gold/30 bg-white/95 p-2.5 text-xs leading-relaxed text-bark shadow-soft sm:mt-3 sm:min-h-[4.6rem] sm:rounded-2xl sm:p-3.5 sm:text-sm">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={koyoSpeech}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                  >
                    "{koyoSpeech}"
                  </motion.p>
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Input Percakapan & Skenario */}
          <div>
            <span className="kicker">
              <Sparkles size={13} className="text-gold" /> Layanan Concierge Galeri
            </span>
            <h2 className="font-heading mt-1.5 text-2xl font-bold leading-snug text-espresso sm:text-3xl">
              Ceritakan kebutuhan ruangmu ke <span className="italic text-teak">Koyo</span>
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted sm:text-[15px]">
              Sebutkan jenis furnitur, kisaran budget, atau kota pengiriman—Koyo langsung menyaringkan pilihan terbaik beserta tombol pesan cepat.
            </p>

            <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-2.5 sm:mt-5 sm:flex-row">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={query}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={LIVE_PLACEHOLDERS[phIdx]}
                  aria-label="Tanya Koyo langsung"
                  className="field !rounded-2xl !border-gold/40 !py-3.5 shadow-soft"
                />
              </div>
              <button type="submit" className="btn-primary btn-shimmer w-full shrink-0 !rounded-2xl sm:w-auto sm:!px-6">
                Tanya Koyo <ArrowRight size={17} className="text-gold-light" />
              </button>
            </form>

            <div className="mt-3.5 grid grid-cols-2 gap-2 sm:mt-4 sm:grid-cols-4 sm:gap-2.5">
              {QUICK_SCENARIOS.map((sc) => (
                <motion.button
                  key={sc.label}
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  onMouseEnter={() => setHoveredScenario(sc)}
                  onMouseLeave={() => setHoveredScenario(null)}
                  onFocus={() => setHoveredScenario(sc)}
                  onBlur={() => setHoveredScenario(null)}
                  onClick={() => openKoyoWith(sc.prompt)}
                  className="group flex items-center gap-2 rounded-xl border border-line bg-cream/75 p-2.5 text-left transition hover:border-gold hover:bg-espresso hover:text-cream hover:shadow-soft sm:flex-col sm:items-start sm:rounded-2xl sm:p-3"
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-gold/25 bg-white text-teak transition group-hover:border-gold/50 group-hover:bg-gold/15 group-hover:text-gold-light sm:rounded-xl">
                    <sc.icon size={15} />
                  </span>
                  <span className="text-xs font-semibold leading-tight">{sc.label}</span>
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
