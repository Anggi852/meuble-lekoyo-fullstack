import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Volume2, VolumeX, X, RotateCcw, ArrowRight } from 'lucide-react';
import Koyo from './Koyo';
import { useSpeech } from '../hooks/useSpeech';
import { useTypewriter } from '../hooks/useTypewriter';
import { safeGet, safeSet } from '../utils/format';

const LS_VISITED = 'lekoyo_visited';   // sudah pernah berkunjung (permanen)
const SS_GREETED = 'lekoyo_greeted';   // sudah disapa pada sesi ini

// Dialog untuk pengunjung BARU. `text` ditampilkan, `say` dibacakan (angka dieja agar pelafalan benar).
const introSteps = [
  {
    text: "Selamat datang di Meuble Le'Koyo! Perkenalkan, namaku Koyo, asisten digital toko ini.",
    chips: [],
  },
  {
    text: 'Toko kami membuat furnitur kayu jati asli dari Jambi: meja, kursi, lemari, cermin, sampai kamar set. Ada yang siap jual, ada juga yang dibuat khusus sesuai pesananmu.',
    chips: ['Meja', 'Kursi', 'Lemari', 'Cermin', 'Kamar set', 'Siap jual', 'Custom'],
  },
  {
    text: 'Pembuatan pesanan custom memakan waktu sekitar 2 bulan, jadi mohon pesan jauh hari ya. Pembayaran bisa tunai atau sistem tabung, dan pengiriman ke luar daerah tersedia.',
    say: 'Pembuatan pesanan custom memakan waktu sekitar dua bulan, jadi mohon pesan jauh hari ya. Pembayaran bisa tunai atau sistem tabung, dan pengiriman ke luar daerah tersedia.',
    chips: ['± 2 bulan', 'Pesan jauh hari', 'Tunai / Tabung', 'Kirim luar daerah'],
  },
  {
    text: 'Cara pesannya mudah: pilih produk, isi formulir, lalu lanjut ke WhatsApp Pak Nanang. Silakan lihat-lihat dulu, dan klik aku kalau butuh bantuan!',
    chips: ['1 · Pilih produk', '2 · Isi formulir', '3 · Lanjut WhatsApp'],
  },
];

const returningText = 'Selamat datang kembali! Senang bertemu lagi. Mau lihat koleksi terbaru, atau lanjut dari produk favoritmu?';

function tipFor(pathname) {
  if (pathname === '/') return 'Hai! Mau lihat koleksi jati terbaru? Pilih kategori di bawah, atau langsung buka katalog.';
  if (pathname.startsWith('/catalog')) return 'Ini katalog kami. Pakai kolom cari atau pilih kategori untuk mempersempit pilihan.';
  if (pathname.startsWith('/product')) return 'Suka produk ini? Tekan tombol Pesan via WhatsApp, formulirnya langsung jadi pesan untuk Pak Nanang.';
  if (pathname.startsWith('/wishlist')) return 'Ini produk yang kamu simpan. Buka salah satunya untuk memesan.';
  if (pathname.startsWith('/login')) return 'Halaman ini khusus untuk owner toko.';
  return 'Ada yang bisa Koyo bantu?';
}

/* ------------------------------------------------------------------ */
/* Pengantar dari Koyo: tampil di pojok halaman, tidak menutup layar    */
/* ------------------------------------------------------------------ */
function IntroTour({ speech, onFinish }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const current = introSteps[step];
  const isLast = step === introSteps.length - 1;
  const typed = useTypewriter(current.text, 18);
  const { voiceOn, speak, stop, speaking, supported } = speech;

  useEffect(() => {
    if (voiceOn) speak(current.say ?? current.text);
  }, [step, voiceOn, speak, current]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') { stop(); onFinish(true); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onFinish, stop]);

  const next = () => {
    if (!typed.done) { typed.skip(); return; }
    if (isLast) return;
    stop();
    setStep((n) => n + 1);
  };
  const skip = () => { stop(); onFinish(true); };
  const finish = (to) => { stop(); onFinish(false); if (to) navigate(to); };

  return (
    <motion.div
      className="fixed bottom-4 left-4 right-4 z-40 flex items-end gap-3 sm:bottom-6 sm:left-6 sm:right-auto"
      initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 28, transition: { duration: 0.25 } }}
      transition={{ delay: 0.6, type: 'spring', stiffness: 140, damping: 16 }}
      role="dialog" aria-label="Sambutan dari Koyo"
    >
      <span className="bob relative block h-16 w-16 shrink-0 overflow-hidden rounded-full border-[3px] border-white bg-sand shadow-lift sm:h-[72px] sm:w-[72px]">
        <Koyo face speaking={speaking || !typed.done} className="h-full w-full" />
      </span>

      <div className="relative mb-1 w-full max-w-[24rem] rounded-2xl rounded-bl-sm border border-line bg-white p-4 shadow-lift">
        <div className="flex items-center justify-between gap-2">
          <span className="rounded-md bg-teak px-2.5 py-0.5 text-xs font-bold text-white">Koyo</span>
          <button onClick={skip} className="flex min-h-[36px] items-center gap-1 rounded-full px-3 text-sm font-medium text-muted transition hover:bg-sand hover:text-teak" aria-label="Lewati pengantar">
            Lewati <X size={15} />
          </button>
        </div>

        <p className={`mt-2 min-h-[5.5rem] text-[15px] leading-relaxed text-bark ${typed.done ? '' : 'caret'}`} aria-live="polite">{typed.shown}</p>

        {typed.done && current.chips.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {current.chips.map((c, i) => (
              <motion.span key={c} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-full bg-sand px-2.5 py-1 text-xs font-semibold text-teak">{c}</motion.span>
            ))}
          </div>
        )}

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
          <div className="flex items-center gap-2">
            {supported && (
              <button onClick={() => speech.setVoiceOn(!voiceOn)} className="grid h-10 w-10 place-items-center rounded-lg border border-line text-muted transition hover:border-teak hover:text-teak" aria-label={voiceOn ? 'Matikan suara' : 'Nyalakan suara'}>
                {voiceOn ? <Volume2 size={17} /> : <VolumeX size={17} />}
              </button>
            )}
            <div className="flex items-center gap-1" aria-label={`Langkah ${step + 1} dari ${introSteps.length}`}>
              {introSteps.map((_, i) => (
                <span key={i} className={`h-1.5 rounded-full transition-all ${i === step ? 'w-5 bg-teak' : i < step ? 'w-1.5 bg-wood' : 'w-1.5 bg-line'}`} />
              ))}
            </div>
          </div>
          {isLast && typed.done ? (
            <div className="flex gap-2">
              <button onClick={() => finish()} className="btn-soft !min-h-[40px] !px-3 !py-2">Lihat-lihat</button>
              <button onClick={() => finish('/catalog')} className="btn-primary !min-h-[40px] !px-3 !py-2">Katalog <ArrowRight size={16} /></button>
            </div>
          ) : (
            <button onClick={next} className="btn-primary !min-h-[40px] !px-4 !py-2">{typed.done ? 'Lanjut' : 'Tampilkan semua'} <ArrowRight size={16} /></button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Pemandu kecil di pojok kiri bawah (pengunjung lama & sesudah intro)  */
/* ------------------------------------------------------------------ */
function GuideDock({ speech, onReplay, greetOnMount, hint }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [bubble, setBubble] = useState(null); // { text, actions }
  const typed = useTypewriter(bubble?.text ?? '', 22);
  const hideTimer = useRef(null);
  const { voiceOn, speak, stop, speaking, supported } = speech;

  const show = useCallback((next, { autoSpeak = true } = {}) => {
    setBubble(next);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setBubble(null), 16000);
    if (autoSpeak && voiceOn) speak(next.text);
  }, [speak, voiceOn]);

  // Sapaan pengunjung lama: sekali per sesi, hanya di beranda
  useEffect(() => {
    if (safeGet(SS_GREETED, 'session')) return undefined;
    if (!greetOnMount || pathname !== '/') return undefined;
    const t = setTimeout(() => {
      safeSet(SS_GREETED, '1', 'session');
      show({
        text: returningText,
        actions: [{ label: 'Lihat katalog', to: '/catalog' }, { label: 'Favoritku', to: '/wishlist' }],
      });
    }, 1400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Setelah pengantar dilewati: petunjuk singkat supaya jelas Koyo masih bisa dipanggil
  useEffect(() => {
    if (!hint) return undefined;
    const t = setTimeout(() => show({ text: hint }, { autoSpeak: false }), 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => { clearTimeout(hideTimer.current); }, []);

  if (pathname.startsWith('/admin')) return null;

  const toggle = () => {
    if (bubble) { setBubble(null); stop(); return; }
    show({ text: tipFor(pathname) });
  };
  const close = () => { setBubble(null); stop(); };
  const go = (to) => { close(); navigate(to); };

  return (
    <div className="fixed bottom-4 left-4 z-40 flex items-end gap-3 sm:bottom-6 sm:left-6">
      <button onClick={toggle} aria-label="Bicara dengan Koyo" className="group relative h-16 w-16 shrink-0 sm:h-[72px] sm:w-[72px]">
        <span className="relative block h-full w-full overflow-hidden rounded-full border-[3px] border-white bg-sand shadow-lift transition group-hover:scale-105">
          <Koyo face speaking={speaking || (!!bubble && !typed.done)} className="h-full w-full" />
        </span>
        <span className="absolute bottom-0.5 right-0.5 h-4 w-4 rounded-full border-2 border-white bg-sage" />
      </button>

      <AnimatePresence>
        {bubble && (
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.2 }}
            className="relative mb-2 w-[min(19rem,calc(100vw-7.5rem))] rounded-2xl rounded-bl-sm border border-line bg-white p-4 shadow-lift sm:w-80"
          >
            <p className={`text-[15px] leading-relaxed text-bark ${typed.done ? '' : 'caret'}`} aria-live="polite">{typed.shown}</p>
            {bubble.actions && typed.done && (
              <div className="mt-3 flex flex-wrap gap-2">
                {bubble.actions.map((a) => (
                  <button key={a.to} onClick={() => go(a.to)} className="min-h-[40px] rounded-lg bg-sand px-4 text-sm font-semibold text-teak transition hover:bg-teak hover:text-white">{a.label}</button>
                ))}
              </div>
            )}
            <div className="mt-3 flex items-center justify-between border-t border-line pt-2.5 text-sm text-muted">
              <button onClick={() => { close(); onReplay(); }} className="flex items-center gap-1.5 transition hover:text-teak"><RotateCcw size={14} /> Ulangi perkenalan</button>
              <div className="flex items-center gap-0.5">
                {supported && (
                  <button
                    onClick={() => { if (voiceOn) { speech.setVoiceOn(false); } else { speech.setVoiceOn(true); speak(bubble.text); } }}
                    className="rounded-full p-2 transition hover:bg-sand hover:text-teak"
                    aria-label={voiceOn ? 'Matikan suara' : 'Dengarkan Koyo'}
                  >
                    {voiceOn ? <Volume2 size={17} /> : <VolumeX size={17} />}
                  </button>
                )}
                <button onClick={close} className="rounded-full p-2 transition hover:bg-sand hover:text-teak" aria-label="Tutup"><X size={17} /></button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
export default function Greeter() {
  const speech = useSpeech();
  const [mode, setMode] = useState(() => (safeGet(LS_VISITED) ? 'idle' : 'intro'));
  const [replayKey, setReplayKey] = useState(0);
  const [justFinished, setJustFinished] = useState(false);
  const [hint, setHint] = useState('');

  const finishIntro = useCallback((skipped) => {
    safeSet(LS_VISITED, '1');
    safeSet(SS_GREETED, '1', 'session');
    speech.stop();
    setJustFinished(true);
    setHint(skipped === true ? 'Oke! Klik aku kapan saja kalau butuh bantuan, atau pilih "Ulangi perkenalan".' : '');
    setMode('idle');
  }, [speech]);

  const replay = () => { setReplayKey((k) => k + 1); setMode('intro'); };

  return (
    <>
      <AnimatePresence>
        {mode === 'intro' && <IntroTour key={replayKey} speech={speech} onFinish={finishIntro} />}
      </AnimatePresence>
      {mode === 'idle' && <GuideDock speech={speech} onReplay={replay} greetOnMount={!justFinished} hint={hint} />}
    </>
  );
}
