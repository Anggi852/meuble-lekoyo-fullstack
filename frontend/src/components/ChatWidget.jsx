import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  ExternalLink,
  MessageCircle,
  RotateCcw,
  Send,
  ShoppingBag,
  Sparkles,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import Koyo from './Koyo';
import { useApp } from '../context/AppContext';
import { useSpeech } from '../hooks/useSpeech';
import { generateKoyoReply } from '../services/koyoEngine';
import { extractApiError } from '../services/api';
import { WA_BASE, buildWhatsAppLink } from '../services/whatsapp';
import { formatRupiah, safeGet, safeSet } from '../utils/format';
import { isValidIndonesianPhone, normalizePhone } from '../utils/phone';

const LS_VISITED = 'lekoyo_v8_visited';
const SS_GREETED = 'lekoyo_v8_greeted';

const ORDER_STEPS = ['name', 'phone', 'address', 'quantity', 'payment'];

const WELCOME_MSG = {
  id: 'welcome',
  sender: 'bot',
  text: "Halo! Aku **Koyo**, asisten showroom digital **Meuble Le'Koyo** Jambi.\n\nKamu bisa cerita aja lagi cari furnitur kayu jati apa (bisa sebut budget juga!), tanya **sistem tabung**, **custom order (±2 bulan)**, atau langsung **pesan lewat obrolan** ini!",
  quickReplies: [
    'Lihat produk unggulan',
    'Cara sistem tabung',
    'Cari meja di bawah 5 juta',
    'Pesan custom (±2 bln)',
    'Kirim luar Jambi bisa?',
  ],
};

function RichText({ text }) {
  const paragraphs = String(text || '').split('\n');
  return (
    <div className="space-y-1.5">
      {paragraphs.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1" />;
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return (
          <p key={i} className="leading-relaxed">
            {parts.map((part, j) =>
              part.startsWith('**') && part.endsWith('**') ? (
                <strong key={j} className="font-semibold">
                  {part.slice(2, -2)}
                </strong>
              ) : (
                <span key={j}>{part}</span>
              ),
            )}
          </p>
        );
      })}
    </div>
  );
}

function stripMarkdown(text) {
  return String(text || '').replace(/\*\*/g, '').replace(/\n+/g, ' ');
}

function VoiceWaves() {
  return (
    <span className="inline-flex h-3.5 items-end gap-[2px]" aria-hidden="true">
      {[0, 0.15, 0.3, 0.1].map((delay, idx) => (
        <span
          key={idx}
          className="voice-bar w-[3px] rounded-full bg-gold"
          style={{ height: idx % 2 === 0 ? '100%' : '70%', animationDelay: `${delay}s` }}
        />
      ))}
    </span>
  );
}

function proactivePromptFor(pathname, isFirstVisit) {
  if (isFirstVisit) {
    return {
      badge: 'Baru di sini?',
      text: "Selamat datang di Meuble Le'Koyo! Mau Koyo bantu carikan furnitur kayu jati, atau tanya sistem tabung & pengiriman luar Jambi?",
      chips: ['Cari furnitur jati', 'Cara sistem tabung', 'Pesan custom (±2 bln)'],
    };
  }
  if (pathname.startsWith('/custom')) {
    return {
      badge: 'Asisten Custom',
      text: 'Bingung pilih ukuran atau estimasi pengerjaan custom (±2 bulan)? Tanyakan ke Koyo ya!',
      chips: ['Lama pembuatan?', 'Cara sistem tabung'],
    };
  }
  if (pathname.startsWith('/catalog')) {
    return {
      badge: 'Tips Koyo',
      text: 'Mau lebih cepat? Sebutkan saja kategori & budgetmu ke Koyo, nanti Koyo pilihkan yang pas!',
      chips: ['Meja di bawah 5 juta', 'Produk unggulan'],
    };
  }
  return {
    badge: 'Koyo Online',
    text: 'Selamat datang kembali! Mau lihat koleksi jati terbaru atau lanjut konsultasi?',
    chips: ['Lihat produk unggulan', 'Mulai pesan lewat chat'],
  };
}

export default function ChatWidget() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const {
    products,
    faqs,
    addChatLog,
    sendKoyoMessage,
    addOrder,
    koyoOpen,
    setKoyoOpen,
    koyoPrompt,
    clearKoyoPrompt,
  } = useApp();

  const speech = useSpeech();
  const { voiceOn, setVoiceOn, speak, stop, speaking, supported } = speech;

  const [messages, setMessages] = useState([WELCOME_MSG]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [orderFlow, setOrderFlow] = useState(null); // null | { step, product, name, address, quantity, payment }
  const [nudge, setNudge] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Sapaan proaktif kontekstual saat chat belum dibuka
  useEffect(() => {
    if (pathname.startsWith('/admin') || koyoOpen) {
      setNudge(null);
      return undefined;
    }
    if (safeGet(SS_GREETED, 'session')) return undefined;

    const isFirstVisit = !safeGet(LS_VISITED);
    const delay = isFirstVisit ? 1400 : 2000;
    const t = setTimeout(() => {
      safeSet(LS_VISITED, '1');
      safeSet(SS_GREETED, '1', 'session');
      setNudge(proactivePromptFor(pathname, isFirstVisit));
    }, delay);
    return () => clearTimeout(t);
  }, [pathname, koyoOpen]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing, koyoOpen]);

  useEffect(() => {
    if (koyoOpen) {
      setNudge(null);
      setTimeout(() => inputRef.current?.focus(), 200);
    } else {
      stop();
    }
  }, [koyoOpen, stop]);

  const pushBotMessage = useCallback(
    (msg) => {
      const entry = { id: `${Date.now()}-${Math.random()}`, sender: 'bot', ...msg };
      setMessages((prev) => [...prev, entry]);
      if (voiceOn) {
        speak(msg.speakText || stripMarkdown(msg.text));
      }
    },
    [voiceOn, speak],
  );

  // Mulai alur pemesanan langsung dari kartu produk
  const startConversationalOrder = useCallback(
    (product) => {
      setMessages((prev) => [
        ...prev,
        { id: `${Date.now()}-u`, sender: 'user', text: `Saya mau pesan ${product.name}` },
      ]);
      addChatLog(`Mulai pesan via chat: ${product.name}`, 'pemesanan');
      setOrderFlow({
        step: 'name',
        product,
        name: '',
        phone: '',
        address: '',
        quantity: 1,
        payment: '',
      });
      setTyping(true);
      setTimeout(() => {
        setTyping(false);
        pushBotMessage({
          text: `Pilihan bagus! Kita siapkan pesanan untuk **${product.name}** (${formatRupiah(product.price)}, estimasi ±${product.productionTime}).\n\nLangkah 1/5: Boleh tahu **nama lengkapmu**?`,
          quickReplies: ['Batal pesan'],
        });
      }, 420);
    },
    [addChatLog, pushBotMessage],
  );

  // Penanganan langkah-langkah pemesanan percakapan (aman untuk React Compiler)
  const handleOrderFlowStep = useCallback(
    async (text) => {
      if (!orderFlow) return;
      const trimmed = text.trim();
      if (/^(batal|cancel|keluar|stop|ga jadi|tidak jadi)\b/i.test(trimmed)) {
        setOrderFlow(null);
        pushBotMessage({
          text: 'Oke, proses pemesanan dibatalkan ya. Kamu tetap bisa tanya-tanya soal katalog jati, sistem tabung, atau custom order kapan saja!',
          quickReplies: ['Lihat produk unggulan', 'Cara sistem tabung', 'Pesan custom'],
        });
        return;
      }

      if (orderFlow.step === 'product') {
        const lower = trimmed.toLowerCase();
        const found = products.find((p) => p.name.toLowerCase().includes(lower) || lower.includes(p.name.toLowerCase()));
        const chosen = found || { id: null, name: trimmed, price: 0, productionTime: '2 bulan' };
        setOrderFlow((prev) => (prev ? { ...prev, step: 'name', product: chosen } : prev));
        pushBotMessage({
          text: found
            ? `Siap! Produk dipilih: **${found.name}** (${formatRupiah(found.price)}).\n\nLangkah 1/5: Siapa **nama lengkapmu**?`
            : `Siap! Koyo catat produk: **${trimmed}**.\n\nLangkah 1/5: Siapa **nama lengkapmu**?`,
          quickReplies: ['Batal pesan'],
        });
        return;
      }

      if (orderFlow.step === 'name') {
        if (trimmed.length < 2) {
          pushBotMessage({ text: 'Boleh tuliskan nama lengkap minimal 2 huruf ya?', quickReplies: ['Batal pesan'] });
          return;
        }
        setOrderFlow((prev) => (prev ? { ...prev, step: 'phone', name: trimmed } : prev));
        pushBotMessage({
          text: `Salam kenal, **${trimmed}**! Langkah 2/5: Berapa **nomor WhatsApp aktifmu**? (Contoh: 081234567890 — untuk konfirmasi pesanan bersama Pak Nanang)`,
          quickReplies: ['Batal pesan'],
        });
        return;
      }

      if (orderFlow.step === 'phone') {
        if (!isValidIndonesianPhone(trimmed)) {
          pushBotMessage({
            text: 'Format nomor WhatsApp belum valid ya. Gunakan nomor HP Indonesia seperti **081234567890** atau **+6281234567890**.',
            quickReplies: ['Batal pesan'],
          });
          return;
        }
        setOrderFlow((prev) => (prev ? { ...prev, step: 'address', phone: normalizePhone(trimmed) } : prev));
        pushBotMessage({
          text: 'Sip, nomor WhatsApp tercatat! Langkah 3/5: Boleh tuliskan **kota & alamat pengiriman** lengkapmu? (Melayani pengiriman luar daerah Jambi)',
          quickReplies: ['Batal pesan'],
        });
        return;
      }

      if (orderFlow.step === 'address') {
        if (trimmed.length < 5) {
          pushBotMessage({
            text: 'Mohon tulis kota dan alamat sedikit lebih jelas ya (contoh: Jl. Sudirman No. 12, Padang).',
            quickReplies: ['Batal pesan'],
          });
          return;
        }
        setOrderFlow((prev) => (prev ? { ...prev, step: 'quantity', address: trimmed } : prev));
        pushBotMessage({
          text: 'Alamat tercatat! Langkah 4/5: Mau pesan **berapa unit**?',
          quickReplies: ['1', '2', '3', 'Batal pesan'],
        });
        return;
      }

      if (orderFlow.step === 'quantity') {
        const qty = parseInt(trimmed.replace(/[^0-9]/g, ''), 10);
        if (!qty || qty < 1 || qty > 50) {
          pushBotMessage({ text: 'Masukkan jumlah unit dalam angka ya (misalnya 1 atau 2).', quickReplies: ['1', '2', 'Batal pesan'] });
          return;
        }
        setOrderFlow((prev) => (prev ? { ...prev, step: 'payment', quantity: qty } : prev));
        pushBotMessage({
          text: 'Terakhir, langkah 5/5: Pilih **metode pembayaran** yang kamu inginkan:',
          quickReplies: ['Tunai / M-Banking', 'Sistem Tabung', 'Batal pesan'],
        });
        return;
      }

      if (orderFlow.step === 'payment') {
        const payment = /tabung/i.test(trimmed) ? 'Sistem Tabung' : 'Tunai / M-Banking';
        const finalOrder = {
          name: orderFlow.name,
          phone: orderFlow.phone,
          address: orderFlow.address,
          product: orderFlow.product?.name || '',
          productId: orderFlow.product?.id ?? null,
          quantity: orderFlow.quantity,
          payment,
          agreedToTerms: true,
          total: (orderFlow.product?.price || 0) * orderFlow.quantity,
        };
        try {
          await addOrder(finalOrder);
          const waUrl = buildWhatsAppLink(finalOrder);
          setOrderFlow(null);
          pushBotMessage({
            text: `Pengajuan pesananmu sudah Koyo catat dengan status **Menunggu Konfirmasi WA**!\n\n• **Produk:** ${finalOrder.product} (${finalOrder.quantity} unit)\n• **Nama:** ${finalOrder.name}\n• **No. WhatsApp:** ${finalOrder.phone}\n• **Alamat:** ${finalOrder.address}\n• **Pembayaran:** ${finalOrder.payment}${finalOrder.total ? `\n• **Estimasi Harga:** ${formatRupiah(finalOrder.total)}` : ''}\n\nPesanan baru mulai dikerjakan setelah kesepakatan harga & DP di **WhatsApp Pak Nanang**. Klik tombol di bawah untuk langsung konfirmasi ya!`,
            waUrl,
            waLabel: 'Konfirmasi Pesanan ke WhatsApp Pak Nanang',
            quickReplies: ['Lihat produk lain', 'Tanya garansi'],
          });
        } catch (err) {
          setOrderFlow(null);
          pushBotMessage({
            text: extractApiError(err, 'Pengajuan pesanan belum dapat diproses saat ini. Silakan hubungi Pak Nanang langsung via WhatsApp.'),
            wa: true,
            quickReplies: ['Lihat produk unggulan', 'Cara sistem tabung'],
          });
        }
      }
    },
    [orderFlow, products, addOrder, pushBotMessage],
  );

  const sendMessage = useCallback(
    async (rawText, productContext = null) => {
      const text = (rawText || '').trim();
      if (!text || typing) return;

      setMessages((prev) => [...prev, { id: `${Date.now()}-u`, sender: 'user', text }]);
      setInput('');
      setTyping(true);

      if (orderFlow) {
        addChatLog(text, 'pemesanan');
        setTimeout(() => {
          setTyping(false);
          handleOrderFlowStep(text);
        }, 280);
        return;
      }

      try {
        // Layanan Gen AI selalu diakses melalui Backend Express (POST /api/v1/chats), bukan langsung dari Frontend
        const reply = await sendKoyoMessage({
          message: text,
          activeProductId: productContext?.id ?? null,
        });

        setTyping(false);
        if (reply.startOrder) {
          setOrderFlow({
            step: reply.product ? 'name' : 'product',
            product: reply.product || productContext || null,
            name: '',
            phone: '',
            address: '',
            quantity: 1,
            payment: '',
          });
        }
        pushBotMessage(reply);
      } catch (err) {
        // Kegagalan layanan API / timeout / server offline ditangani dengan pesan jelas + fallback ramah
        const errNotice = extractApiError(
          err,
          'Koneksi ke server asisten sedang terganggu; menampilkan jawaban cadangan.',
        );
        const fallback = generateKoyoReply(text, {
          products,
          faqs,
          activeProduct: productContext,
        });
        setTyping(false);
        if (fallback.startOrder) {
          setOrderFlow({
            step: fallback.product ? 'name' : 'product',
            product: fallback.product || productContext || null,
            name: '',
            phone: '',
            address: '',
            quantity: 1,
            payment: '',
          });
        }
        pushBotMessage({ ...fallback, warning: errNotice });
      }
    },
    [typing, orderFlow, products, faqs, addChatLog, sendKoyoMessage, handleOrderFlowStep, pushBotMessage],
  );

  // Dengarkan pemicu global dari halaman lain
  useEffect(() => {
    if (!koyoPrompt) return;
    const { text, product } = koyoPrompt;
    clearKoyoPrompt();
    if (text) {
      sendMessage(text, product);
    }
  }, [koyoPrompt, clearKoyoPrompt, sendMessage]);

  const resetChat = () => {
    stop();
    setOrderFlow(null);
    setMessages([WELCOME_MSG]);
  };

  if (pathname.startsWith('/admin')) return null;

  const lastMsg = messages[messages.length - 1];
  const koyoMood = typing
    ? 'thinking'
    : lastMsg?.products?.length > 0 || lastMsg?.waUrl
    ? 'excited'
    : 'happy';

  const orderStepIndex = orderFlow ? ORDER_STEPS.indexOf(orderFlow.step) : -1;

  return (
    <>
      {/* Gelembung sapaan proaktif kontekstual saat chat tertutup */}
      <AnimatePresence>
        {!koyoOpen && nudge && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            className="fixed bottom-[calc(5.2rem+env(safe-area-inset-bottom,0px))] right-3.5 z-40 w-[calc(100vw-1.75rem)] max-w-xs rounded-2xl rounded-br-sm border border-gold/35 bg-white/95 p-4 shadow-lift backdrop-blur-md sm:bottom-24 sm:right-6"
            role="dialog"
            aria-label="Sapaan Koyo"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-sand px-2.5 py-0.5 text-xs font-semibold text-teak">
                <Sparkles size={12} className="text-gold" /> {nudge.badge}
              </span>
              <button
                onClick={() => setNudge(null)}
                className="rounded-full p-1 text-muted transition hover:bg-sand hover:text-teak"
                aria-label="Tutup sapaan"
              >
                <X size={15} />
              </button>
            </div>
            <p className="mt-2 text-[14px] leading-relaxed text-bark">{nudge.text}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {nudge.chips.map((chip) => (
                <button
                  key={chip}
                  onClick={() => {
                    setNudge(null);
                    setKoyoOpen(true);
                    setTimeout(() => sendMessage(chip), 150);
                  }}
                  className="rounded-full border border-teak/25 bg-cream px-3 py-1 text-xs font-semibold text-teak transition hover:bg-teak hover:text-white"
                >
                  {chip}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tombol pemicu utama Koyo dengan efek napas hidup */}
      <div className="fixed bottom-[calc(0.9rem+env(safe-area-inset-bottom,0px))] right-3.5 z-50 sm:bottom-6 sm:right-6">
        {!koyoOpen && (
          <span
            className="koyo-pulse-ring pointer-events-none absolute inset-0 rounded-full bg-teak/45"
            aria-hidden="true"
          />
        )}
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => setKoyoOpen(!koyoOpen)}
          className="group relative flex items-center gap-2.5 rounded-full border border-gold/45 bg-gradient-to-br from-teak via-teak-dark to-espresso p-1.5 pr-4 text-cream shadow-lift transition hover:border-gold hover:brightness-110"
          aria-label={koyoOpen ? 'Tutup obrolan Koyo' : 'Ngobrol dengan Koyo'}
        >
          <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border-2 border-white/85 bg-sand">
            <Koyo face mood={koyoMood} speaking={speaking} tracking={!koyoOpen} className="h-full w-full" />
            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-sage" />
          </span>
          <span className="text-left leading-tight">
            <span className="block text-[14px] font-bold">{koyoOpen ? 'Tutup Chat' : 'Tanya Koyo'}</span>
            {!koyoOpen && <span className="hidden text-[11px] text-white/80 sm:block">Asisten Jati Online</span>}
          </span>
        </motion.button>
      </div>

      {/* Jendela Percakapan Showroom Koyo */}
      <AnimatePresence>
        {koyoOpen && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 280, damping: 24 }}
            className="fixed inset-x-3 bottom-[calc(4.9rem+env(safe-area-inset-bottom,0px))] z-50 flex h-[min(76dvh,36rem)] flex-col overflow-hidden rounded-3xl border border-gold/35 bg-white shadow-lift sm:inset-x-auto sm:bottom-24 sm:right-6 sm:w-[26.5rem]"
            role="dialog"
            aria-label="Percakapan dengan Koyo"
          >
            {/* Header Koyo */}
            <div className="luxury-dark border-b border-gold/30 px-4 py-3.5 text-cream">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-gold/70 bg-sand shadow-soft">
                    <Koyo face mood={koyoMood} speaking={speaking || typing} tracking={false} className="h-full w-full" />
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-sage" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-heading text-[17px] font-bold leading-tight">Koyo • Meuble Le'Koyo</h3>
                      {speaking && <VoiceWaves />}
                    </div>
                    <p className="text-xs text-white/80">
                      {typing
                        ? 'Koyo sedang berpikir...'
                        : speaking
                        ? 'Sedang berbicara...'
                        : orderFlow
                        ? 'Mode Pesan Lewat Chat'
                        : 'Asisten Showroom Jati Jambi'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {supported && (
                    <button
                      onClick={() => setVoiceOn(!voiceOn)}
                      className={`grid h-9 w-9 place-items-center rounded-full transition ${
                        voiceOn ? 'bg-white/20 text-gold' : 'text-white/85 hover:bg-white/15 hover:text-white'
                      }`}
                      title={voiceOn ? 'Matikan suara Koyo' : 'Nyalakan suara Koyo'}
                      aria-label={voiceOn ? 'Matikan suara Koyo' : 'Nyalakan suara Koyo'}
                    >
                      {voiceOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
                    </button>
                  )}
                  <button
                    onClick={resetChat}
                    className="grid h-9 w-9 place-items-center rounded-full text-white/85 transition hover:bg-white/15 hover:text-white"
                    title="Mulai obrolan baru"
                    aria-label="Mulai obrolan baru"
                  >
                    <RotateCcw size={16} />
                  </button>
                  <button
                    onClick={() => setKoyoOpen(false)}
                    className="grid h-9 w-9 place-items-center rounded-full text-white/85 transition hover:bg-white/15 hover:text-white"
                    aria-label="Tutup"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Indikator progres visual saat Mode Pesan Lewat Chat aktif */}
              {orderFlow && orderStepIndex >= 0 && (
                <div className="mt-3 rounded-xl bg-white/10 px-3 py-2">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-white/90">
                    <span>Menyusun Pesanan WhatsApp</span>
                    <span>Langkah {orderStepIndex + 1} / 5</span>
                  </div>
                  <div className="mt-1.5 grid grid-cols-5 gap-1.5">
                    {ORDER_STEPS.map((st, idx) => (
                      <span
                        key={st}
                        className={`h-1.5 rounded-full transition-all ${
                          idx <= orderStepIndex ? 'bg-gold' : 'bg-white/25'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Area Percakapan */}
            <div className="wood-grain-bg flex-1 space-y-3.5 overflow-y-auto bg-cream p-4">
              {messages.map((msg, idx) => {
                const isLast = idx === messages.length - 1;
                return (
                  <motion.div
                    key={msg.id || idx}
                    initial={{ opacity: 0, y: 10, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[88%] rounded-2xl px-4 py-3 text-[14.5px] ${
                        msg.sender === 'user'
                          ? 'rounded-br-sm bg-gradient-to-br from-teak to-teak-dark text-white shadow-soft'
                          : 'rounded-bl-sm border border-line bg-white text-bark shadow-soft'
                      }`}
                    >
                      <RichText text={msg.text} />
                      {msg.warning && (
                        <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[11px] font-medium text-amber-800">
                          Info layanan: {msg.warning}
                        </p>
                      )}

                      {/* Kartu Produk Interaktif di dalam Chat */}
                      {msg.products && msg.products.length > 0 && (
                        <div className="mt-3 space-y-2.5">
                          {msg.products.map((p) => (
                            <motion.div
                              key={p.id}
                              whileHover={{ y: -2 }}
                              className="flex gap-2.5 overflow-hidden rounded-xl border border-line bg-cream/85 p-2 shadow-soft transition hover:border-wood"
                            >
                              <img
                                src={p.image}
                                alt={p.name}
                                className="h-16 w-16 shrink-0 rounded-lg object-cover"
                                loading="lazy"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-bold text-bark">{p.name}</p>
                                <p className="text-xs font-bold text-teak">{formatRupiah(p.price)}</p>
                                <p className="text-[11px] text-muted">Estimasi ±{p.productionTime}</p>
                                <div className="mt-1.5 flex gap-1.5">
                                  <button
                                    onClick={() => {
                                      setKoyoOpen(false);
                                      navigate(`/product/${p.id}`);
                                    }}
                                    className="rounded-md border border-line bg-white px-2.5 py-1 text-xs font-semibold text-bark transition hover:border-teak hover:text-teak"
                                  >
                                    Lihat
                                  </button>
                                  <button
                                    onClick={() => startConversationalOrder(p)}
                                    className="inline-flex items-center gap-1 rounded-md bg-teak px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-teak-dark"
                                  >
                                    <ShoppingBag size={12} /> Pesan ini
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}

                      {/* Tombol Aksi Navigasi */}
                      {msg.actions && msg.actions.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {msg.actions.map((act) => (
                            <Link
                              key={act.to}
                              to={act.to}
                              onClick={() => setKoyoOpen(false)}
                              className="inline-flex items-center gap-1 rounded-lg bg-sand px-3 py-1.5 text-xs font-semibold text-teak transition hover:bg-teak hover:text-white"
                            >
                              {act.label} <ArrowRight size={13} />
                            </Link>
                          ))}
                        </div>
                      )}

                      {/* Tombol WhatsApp Khusus Pesanan Jadi */}
                      {msg.waUrl && (
                        <a
                          href={msg.waUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-shimmer relative mt-3 flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-sage px-3.5 py-2.5 text-center text-sm font-semibold text-white shadow-soft transition hover:opacity-95"
                        >
                          <MessageCircle size={16} />
                          {msg.waLabel || 'Lanjut ke WhatsApp Pak Nanang'}
                          <ExternalLink size={14} />
                        </a>
                      )}

                      {/* Tombol WhatsApp Fallback / Konsultasi */}
                      {msg.wa && !msg.waUrl && (
                        <a
                          href={WA_BASE}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2.5 flex items-center justify-center gap-1.5 rounded-xl bg-sand px-3 py-2 text-center text-xs font-semibold text-teak transition hover:bg-line"
                        >
                          <MessageCircle size={15} /> Chat Pak Nanang via WhatsApp
                        </a>
                      )}
                    </div>

                    {/* Quick-Reply Chips dinamis hanya di pesan terakhir */}
                    {isLast && !typing && msg.sender === 'bot' && msg.quickReplies && msg.quickReplies.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {msg.quickReplies.map((chip) => (
                          <motion.button
                            key={chip}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.96 }}
                            onClick={() => {
                              if (chip === 'Chat Pak Nanang') {
                                window.open(WA_BASE, '_blank', 'noopener,noreferrer');
                              } else if (chip === 'Lihat katalog') {
                                setKoyoOpen(false);
                                navigate('/catalog');
                              } else {
                                sendMessage(chip);
                              }
                            }}
                            className="rounded-full border border-teak/30 bg-white px-3 py-1.5 text-xs font-semibold text-teak shadow-soft transition hover:bg-teak hover:text-white"
                          >
                            {chip}
                          </motion.button>
                        ))}
                      </div>
                    )}
                  </motion.div>
                );
              })}

              {typing && (
                <div className="flex justify-start">
                  <div className="flex gap-1.5 rounded-2xl rounded-bl-sm border border-line bg-white px-4 py-3 shadow-soft" aria-label="Koyo sedang mengetik">
                    {[0, 1, 2].map((d) => (
                      <motion.span
                        key={d}
                        className="h-2 w-2 rounded-full bg-wood"
                        animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                        transition={{ duration: 0.8, repeat: Infinity, delay: d * 0.14 }}
                      />
                    ))}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input Pesan */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage(input);
              }}
              className="flex items-center gap-2 border-t border-line bg-white p-3"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  orderFlow
                    ? 'Tulis jawabanmu (atau ketik "batal")...'
                    : 'Tanya produk, budget, atau sistem tabung...'
                }
                aria-label="Tulis pesan untuk Koyo"
                className="field !rounded-full !py-2.5 text-base sm:text-sm"
              />
              <button
                type="submit"
                disabled={!input.trim() || typing}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-teak text-white transition hover:bg-teak-dark disabled:opacity-45"
                aria-label="Kirim pesan"
              >
                <Send size={17} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
