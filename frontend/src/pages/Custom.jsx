import { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toast } from 'sonner';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  History,
  ImagePlus,
  Info,
  Loader2,
  MessageCircle,
  RotateCcw,
  Ruler,
  Sparkles,
  User,
  Wand2,
  X,
} from 'lucide-react';
import FurniturePreview from '../components/FurniturePreview';
import Koyo from '../components/Koyo';
import { useApp } from '../context/AppContext';
import { buildCustomWhatsAppLink } from '../services/whatsapp';
import { ID_PHONE_REGEX, normalizePhone } from '../utils/phone';
import {
  CUSTOM_TYPE_KEYS,
  FINISHES,
  MIN_DAYS,
  SHEENS,
  TYPES,
  defaultsFor,
  describeSpec,
  getKoyoDesignTip,
  minDate,
} from '../data/custom';

const Label = ({ htmlFor, children }) => (
  <label htmlFor={htmlFor} className="mb-1.5 block text-[15px] font-medium text-bark">
    {children}
  </label>
);

const Err = ({ e }) =>
  e ? (
    <p className="mt-1.5 text-sm font-medium text-red-600" role="alert">
      {e.message}
    </p>
  ) : null;

const StepHeader = ({ n, title, subtitle }) => (
  <div className="mb-3.5">
    <h2 className="font-heading flex items-center gap-2.5 text-xl font-bold text-bark">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-gold/45 bg-espresso font-heading text-sm font-bold text-gold-light shadow-soft">
        {n}
      </span>
      {title}
    </h2>
    {subtitle && <p className="mt-1 pl-9 text-sm text-muted">{subtitle}</p>}
  </div>
);

const TYPE_GROUPS = [
  { name: 'Dapur & Ruang Keluarga', keys: ['kitchen', 'buffet'] },
  { name: 'Ruang Makan & Tamu', keys: ['meja', 'kursi'] },
  { name: 'Kamar & Penyimpanan', keys: ['lemari', 'kamar', 'cermin'] },
  { name: 'Interior & Bebas Request', keys: ['partisi', 'lainnya'] },
];

const schema = yup
  .object({
    name: yup.string().trim().min(2, 'Nama minimal 2 huruf').required('Nama pemesan wajib diisi'),
    phone: yup
      .string()
      .trim()
      .matches(ID_PHONE_REGEX, 'Gunakan nomor WhatsApp Indonesia yang valid (contoh: 081234567890)')
      .required('Nomor WhatsApp aktif wajib diisi'),
    address: yup.string().trim().min(4, 'Tuliskan kota & alamat lebih lengkap').required('Kota & alamat pengiriman wajib diisi'),
    quantity: yup.number().typeError('Jumlah harus angka').min(1, 'Minimal 1 unit').max(50, 'Maksimal 50 unit').required(),
    payment: yup.string().oneOf(['Tunai', 'Tabung']).required(),
    needBy: yup
      .string()
      .test(
        'lead',
        `Pembuatan sekitar 2 bulan (tidak terima mendadak). Pilih minimal ${MIN_DAYS} hari dari sekarang.`,
        (v) => !v || v >= minDate(),
      ),
    note: yup.string().max(500, 'Maksimal 500 karakter'),
    agreedToTerms: yup
      .boolean()
      .oneOf([true], 'Centang persetujuan konfirmasi WhatsApp terlebih dahulu')
      .required(),
  })
  .required();

function resolveInitialState(navState) {
  const item = navState?.fromPortfolio;
  if (item) {
    const key = TYPES[item.typeKey]
      ? item.typeKey
      : CUSTOM_TYPE_KEYS.find((k) => TYPES[k].label === item.category) || 'lainnya';
    const def = defaultsFor(key);
    return {
      type: key,
      dims: { ...def.dims, ...(item.preset?.dims || {}) },
      opts: {
        ...def.opts,
        ...(key === 'lainnya' ? { jenisBebas: item.name } : {}),
        ...(item.preset?.opts || {}),
      },
      finish: item.preset?.finish || 'natural',
      activePreset: item.name,
    };
  }
  const initialKey = navState?.initialType && TYPES[navState.initialType] ? navState.initialType : 'kitchen';
  const def = defaultsFor(initialKey);
  return {
    type: initialKey,
    dims: def.dims,
    opts: def.opts,
    finish: 'natural',
    activePreset: '',
  };
}

export default function Custom() {
  const { addOrder, openKoyoWith } = useApp();
  const location = useLocation();
  const init = useMemo(() => resolveInitialState(location.state), [location.state]);

  const [type, setType] = useState(init.type);
  const [dims, setDims] = useState(init.dims);
  const [opts, setOpts] = useState(init.opts);
  const [finish, setFinish] = useState(init.finish);
  const [sheen, setSheen] = useState('doff');
  const [activePreset, setActivePreset] = useState(init.activePreset);
  const [view, setView] = useState('front');
  const [showScale, setShowScale] = useState(true);
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(true);
  const [photos, setPhotos] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const t = TYPES[type] || TYPES.meja;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { quantity: 1, payment: 'Tunai', needBy: '', note: '', phone: '', agreedToTerms: false },
  });

  const spec = useMemo(
    () => describeSpec({ type, dims, opts, finish, sheen }),
    [type, dims, opts, finish, sheen],
  );

  const koyoTip = useMemo(
    () => getKoyoDesignTip({ type, dims, opts, finish }),
    [type, dims, opts, finish],
  );

  const pickType = (k) => {
    setType(k);
    const d = defaultsFor(k);
    setDims(d.dims);
    setOpts(d.opts);
    setActivePreset('');
    setView('front');
  };

  const applyPreset = (preset) => {
    setDims({ ...defaultsFor(type).dims, ...preset.dims });
    setOpts({ ...defaultsFor(type).opts, ...preset.opts });
    setActivePreset(preset.name);
    toast.success(`Template "${preset.name}" diterapkan!`);
  };

  const resetDesign = () => {
    const d = defaultsFor(type);
    setDims(d.dims);
    setOpts(d.opts);
    setFinish('natural');
    setSheen('doff');
    setActivePreset('');
    setView('front');
  };

  const onPhotos = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const remaining = 3 - photos.length;
    if (remaining <= 0) {
      toast.error('Maksimal 3 foto referensi.');
      return;
    }
    const valid = [];
    files.slice(0, remaining).forEach((f) => {
      if (!f.type.startsWith('image/') || f.size > 8 * 1024 * 1024) {
        toast.error(`File "${f.name}" harus berupa gambar maksimal 8 MB`);
      } else {
        valid.push({ id: `${Date.now()}-${Math.random()}`, url: URL.createObjectURL(f), name: f.name });
      }
    });
    if (valid.length) setPhotos((prev) => [...prev, ...valid]);
    e.target.value = '';
  };

  const removePhoto = (id) => setPhotos((prev) => prev.filter((p) => p.id !== id));

  const askKoyoAboutDesign = () => {
    openKoyoWith(
      `Saya sedang merancang custom ${spec.title} (${spec.size}, finishing ${spec.finish}). Bisa pakai sistem tabung dan kirim ke luar Jambi?`,
    );
  };

  const onSubmit = async (data) => {
    if (submitting) return;
    setSubmitting(true);
    const cleanPhone = normalizePhone(data.phone);
    try {
      await addOrder({
        name: data.name.trim(),
        phone: cleanPhone,
        address: data.address.trim(),
        quantity: Number(data.quantity),
        payment: data.payment,
        agreedToTerms: true,
        product: `Custom (${spec.categoryLabel}): ${spec.title} (${spec.size})`,
        productId: null,
        total: 0,
        custom: {
          ...spec,
          needBy: data.needBy,
          note: data.note,
          hasPhoto: photos.length > 0,
          photoCount: photos.length,
        },
      });
      window.open(
        buildCustomWhatsAppLink({
          spec,
          order: { ...data, phone: cleanPhone, photoCount: photos.length, hasPhoto: photos.length > 0 },
        }),
        '_blank',
      );
      toast.success('Pengajuan custom tercatat (Menunggu Konfirmasi WA)! Membuka WhatsApp Pak Nanang...');
    } catch {
      // Error validasi/anti-spam sudah ditampilkan
    } finally {
      setSubmitting(false);
    }
  };

  const secondViewLabel = type === 'lemari' ? 'Tata Dalam' : 'Tampak Samping';

  return (
    <div className="section">
      {/* Header Studio Custom — Bersih, fokus merancang */}
      <div className="flex flex-col justify-between gap-4 border-b border-gold/25 pb-6 md:flex-row md:items-end">
        <div>
          <p className="kicker">Pesan Custom • Bisa Buat Jenis Apa Saja</p>
          <h1 className="font-heading mt-1 text-3xl font-bold text-espresso md:text-4xl">
            Rancang <span className="italic text-teak">furniturmu</span> sendiri
          </h1>
          <p className="mt-2 max-w-2xl text-muted">
            Pilih jenis furnitur apa saja — dari Kitchen Set, Buffet TV, Meja, Lemari, Kamar Set, Pintu &amp; Partisi, hingga Mimbar/Podium, Gazebo, atau Meja Kasir — lengkap pratinjau replika langsung.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 self-start md:self-end">
          <Link to="/catalog?tab=custom" className="btn-soft !min-h-[42px] text-sm">
            <History size={15} className="text-gold-dark" /> Lihat Pernah Dicustom di Katalog <ArrowRight size={14} />
          </Link>
          <button
            type="button"
            onClick={resetDesign}
            className="btn-outline !min-h-[42px] text-sm"
          >
            <RotateCcw size={15} /> Reset
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 grid gap-7 lg:mt-8 lg:grid-cols-[1fr_435px] lg:gap-8">
        {/* PRATINJAU STICKY KHUSUS HP ANDROID/iOS & TABLET */}
        <div className="sticky top-[4.15rem] z-30 -mx-1 lg:hidden">
          <div className="overflow-hidden rounded-2xl border border-gold/40 bg-white/95 shadow-lift backdrop-blur-md">
            <div className="luxury-dark flex items-center justify-between gap-2 px-3 py-2">
              <div className="flex items-center gap-1" role="tablist" aria-label="Sudut pandang pratinjau mobile">
                <button
                  type="button"
                  role="tab"
                  aria-selected={view === 'front'}
                  onClick={() => { setView('front'); setMobilePreviewOpen(true); }}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                    view === 'front' ? 'bg-gold text-espresso' : 'text-cream/75 hover:bg-white/10'
                  }`}
                >
                  Depan
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={view === 'side'}
                  onClick={() => { setView('side'); setMobilePreviewOpen(true); }}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                    view === 'side' ? 'bg-gold text-espresso' : 'text-cream/75 hover:bg-white/10'
                  }`}
                >
                  {secondViewLabel}
                </button>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowScale((v) => !v)}
                  aria-pressed={showScale}
                  className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-semibold ${
                    showScale ? 'border-gold/50 bg-gold/20 text-gold-light' : 'border-white/20 text-cream/70'
                  }`}
                >
                  <User size={11} /> 170cm
                </button>
                <button
                  type="button"
                  onClick={() => setMobilePreviewOpen((v) => !v)}
                  className="inline-flex items-center gap-1 rounded-lg border border-white/20 bg-white/10 px-2 py-1 text-[11px] font-semibold text-cream"
                  aria-expanded={mobilePreviewOpen}
                >
                  {mobilePreviewOpen ? <><ChevronUp size={13} /> Lipat</> : <><ChevronDown size={13} /> Lihat</>}
                </button>
              </div>
            </div>

            {mobilePreviewOpen ? (
              <div className="mx-auto max-w-[340px] sm:max-w-[420px]">
                <FurniturePreview
                  type={type}
                  dims={dims}
                  opts={opts}
                  finish={finish}
                  sheen={sheen}
                  view={view}
                  showScale={showScale}
                />
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2 bg-cream/90 px-3.5 py-2 text-xs">
                <span className="truncate font-bold text-espresso">{spec.title}</span>
                <span className="shrink-0 font-semibold text-teak">{spec.size}</span>
              </div>
            )}
          </div>
        </div>

        {/* KOLOM KIRI: 4 LANGKAH SIMPEL */}
        <div className="space-y-8">
          {/* LANGKAH 1: PILIH JENIS (DIPISAH PER KELOMPOK JENIS) */}
          <section>
            <StepHeader
              n={1}
              title="Pilih jenis furnitur"
              subtitle="Dipisahkan menurut jenisnya — dari Kitchen Set hingga Bebas Request (bisa buat model apa saja)."
            />

            <div className="card space-y-4 p-4 sm:p-5">
              {TYPE_GROUPS.map((grp) => (
                <div key={grp.name}>
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-gold-dark">{grp.name}</p>
                  <div className="flex flex-wrap gap-2">
                    {grp.keys.map((k) => {
                      const v = TYPES[k];
                      const active = type === k;
                      return (
                        <button
                          key={k}
                          type="button"
                          onClick={() => pickType(k)}
                          aria-pressed={active}
                          className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                            active
                              ? 'border-teak bg-gradient-to-br from-teak to-teak-dark text-white shadow-soft'
                              : 'border-line bg-cream/65 text-bark hover:border-teak hover:bg-white hover:text-teak'
                          }`}
                        >
                          {v.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              <p className="rounded-xl bg-cream px-3.5 py-2.5 text-xs leading-relaxed text-muted">
                <strong className="text-espresso">{t.name}:</strong> {t.tagline}
              </p>

              {t.presets && t.presets.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 border-t border-line/70 pt-3.5">
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-wood">
                    <Wand2 size={13} /> Contoh populer:
                  </span>
                  {t.presets.map((pr) => {
                    const isActive = activePreset === pr.name;
                    return (
                      <button
                        key={pr.name}
                        type="button"
                        onClick={() => applyPreset(pr)}
                        aria-pressed={isActive}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
                          isActive
                            ? 'border-gold/70 bg-gradient-to-br from-teak to-teak-dark text-white shadow-soft'
                            : 'border-line bg-white text-bark hover:border-teak hover:bg-cream'
                        }`}
                      >
                        {isActive && <Check size={13} className="text-gold-light" />}
                        {pr.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {/* LANGKAH 2: UKURAN & MODEL */}
          <section>
            <StepHeader
              n={2}
              title="Ukuran & model"
              subtitle="Geser ukuran (cm) dan pilih gaya yang kamu inginkan—replika langsung menyesuaikan."
            />
            <div className="card space-y-5 p-5">
              {t.dims.map(([k, label, min, max]) => (
                <div key={k}>
                  <div className="mb-1.5 flex items-center justify-between gap-3">
                    <label htmlFor={`d-${k}`} className="text-[15px] font-semibold text-bark">
                      {label}
                    </label>
                    <span className="flex items-center gap-1.5">
                      <input
                        type="number"
                        aria-label={`${label} (cm)`}
                        min={min}
                        max={max}
                        value={dims[k] ?? min}
                        onChange={(e) => {
                          setActivePreset('');
                          setDims((prev) => ({
                            ...prev,
                            [k]: Math.min(max, Math.max(min, Number(e.target.value) || min)),
                          }));
                        }}
                        className="field !w-24 !py-1.5 text-center font-semibold"
                      />
                      <span className="text-sm text-muted">cm</span>
                    </span>
                  </div>
                  <input
                    id={`d-${k}`}
                    type="range"
                    min={min}
                    max={max}
                    value={dims[k] ?? min}
                    onChange={(e) => {
                      setActivePreset('');
                      setDims((prev) => ({ ...prev, [k]: Number(e.target.value) }));
                    }}
                    className="w-full cursor-pointer accent-[#7A4A2B]"
                  />
                  <div className="flex justify-between text-xs text-muted">
                    <span>{min} cm</span>
                    <span>{max} cm</span>
                  </div>
                </div>
              ))}

              {t.opts.map((o) => {
                if (o.showIf && !o.showIf(opts)) return null;

                if (o.kind === 'text') {
                  return (
                    <div key={o.key}>
                      <label htmlFor={`opt-${o.key}`} className="mb-1.5 block text-[15px] font-semibold text-bark">
                        {o.label}
                      </label>
                      <input
                        id={`opt-${o.key}`}
                        type="text"
                        value={opts[o.key] ?? ''}
                        onChange={(e) => {
                          setActivePreset('');
                          setOpts((prev) => ({ ...prev, [o.key]: e.target.value }));
                        }}
                        placeholder={o.placeholder}
                        className="field"
                      />
                    </div>
                  );
                }

                if (o.kind === 'toggle') {
                  return (
                    <label
                      key={o.key}
                      className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-line/70 bg-cream/70 px-4 py-3 text-[15px] font-medium text-bark transition hover:border-wood"
                    >
                      <span>{o.label}</span>
                      <input
                        type="checkbox"
                        checked={Boolean(opts[o.key])}
                        onChange={(e) => {
                          setActivePreset('');
                          setOpts((prev) => ({ ...prev, [o.key]: e.target.checked }));
                        }}
                        className="h-5 w-5 shrink-0 cursor-pointer accent-[#7A4A2B]"
                      />
                    </label>
                  );
                }

                if (o.kind === 'swatch') {
                  return (
                    <div key={o.key}>
                      <p className="mb-2 text-[15px] font-semibold text-bark">{o.label}</p>
                      <div className="flex flex-wrap gap-2.5">
                        {o.choices.map((sw) => {
                          const active = opts[o.key] === sw.key;
                          return (
                            <button
                              key={sw.key}
                              type="button"
                              onClick={() => {
                                setActivePreset('');
                                setOpts((prev) => ({ ...prev, [o.key]: sw.key }));
                              }}
                              className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition ${
                                active
                                  ? 'border-teak bg-sand text-teak shadow-soft'
                                  : 'border-line bg-white text-bark hover:border-teak'
                              }`}
                            >
                              <span
                                className="h-4 w-4 rounded-full border border-bark/20"
                                style={{ backgroundColor: sw.hex }}
                              />
                              {sw.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={o.key}>
                    <p className="mb-2 text-[15px] font-semibold text-bark">{o.label}</p>
                    <div className="flex flex-wrap gap-2">
                      {o.choices.map((c) => {
                        const active = opts[o.key] === c;
                        return (
                          <button
                            key={c}
                            type="button"
                            aria-pressed={active}
                            onClick={() => {
                              setActivePreset('');
                              setOpts((prev) => ({ ...prev, [o.key]: c }));
                            }}
                            className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                              active
                                ? 'border-teak bg-sand text-teak shadow-soft'
                                : 'border-line bg-white text-bark hover:border-teak'
                            }`}
                          >
                            {c}
                            {o.suffix ?? ''}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* LANGKAH 3: WARNA KAYU & REFERENSI */}
          <section>
            <StepHeader
              n={3}
              title="Warna kayu & catatan tambahan"
              subtitle="Pilih warna pelitur kayu jati dan sertakan catatan atau foto contoh jika ada."
            />
            <div className="card space-y-5 p-5">
              <div>
                <p className="mb-2.5 text-[15px] font-semibold text-bark">Warna Finishing Kayu Jati</p>
                <div className="flex flex-wrap gap-3">
                  {FINISHES.map((f) => {
                    const active = finish === f.key;
                    return (
                      <button
                        key={f.key}
                        type="button"
                        onClick={() => setFinish(f.key)}
                        aria-pressed={active}
                        className="group flex flex-col items-center gap-1.5"
                      >
                        <span
                          className={`grid h-12 w-12 place-items-center rounded-full border-2 transition ${
                            active ? 'border-teak ring-2 ring-teak/30' : 'border-line group-hover:border-teak'
                          }`}
                          style={{ background: f.color }}
                        >
                          {active && <Check size={18} className={f.key === 'putih' ? 'text-bark' : 'text-white'} />}
                        </span>
                        <span className={`text-xs font-semibold ${active ? 'text-teak' : 'text-bark'}`}>{f.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="mb-2 text-[15px] font-semibold text-bark">Hasil Akhir</p>
                <div className="flex flex-wrap gap-2">
                  {SHEENS.map((sh) => (
                    <button
                      key={sh.key}
                      type="button"
                      onClick={() => setSheen(sh.key)}
                      className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                        sheen === sh.key
                          ? 'border-teak bg-sand text-teak shadow-soft'
                          : 'border-line bg-white text-bark hover:border-teak'
                      }`}
                    >
                      {sh.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-line pt-4">
                <Label htmlFor="note">Catatan tambahan (opsional)</Label>
                <textarea
                  id="note"
                  rows={2}
                  className="field"
                  placeholder="Contoh: posisi kompor/wastafel sebelah kanan, minta ukiran kaligrafi di mimbar, atau request sekat khusus..."
                  {...register('note')}
                />
                <Err e={errors.note} />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[15px] font-medium text-bark">Foto / sketsa contoh (opsional, maks. 3)</p>
                  {photos.length > 0 && <span className="text-xs font-semibold text-muted">{photos.length}/3</span>}
                </div>

                {photos.length > 0 && (
                  <div className="mb-3 grid grid-cols-3 gap-2.5">
                    {photos.map((ph) => (
                      <div key={ph.id} className="relative overflow-hidden rounded-xl border border-line bg-cream">
                        <img src={ph.url} alt={ph.name} className="aspect-square w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removePhoto(ph.id)}
                          aria-label={`Hapus ${ph.name}`}
                          className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-bark/80 text-white hover:bg-red-600"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {photos.length < 3 && (
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line py-4 text-sm font-medium text-muted transition hover:border-teak hover:bg-cream/60 hover:text-teak">
                    <ImagePlus size={18} /> Pilih gambar referensi
                    <input type="file" accept="image/*" multiple className="sr-only" onChange={onPhotos} />
                  </label>
                )}

                <p className="mt-2 flex gap-1.5 text-xs text-muted">
                  <Info size={15} className="mt-0.5 shrink-0 text-teak" />
                  Setelah WhatsApp terbuka, kirim langsung foto referensinya di chat ke Pak Nanang.
                </p>
              </div>
            </div>
          </section>

          {/* LANGKAH 4: DATA PEMESAN */}
          <section>
            <StepHeader
              n={4}
              title="Data pemesan & pengiriman"
              subtitle="Melayani pemesanan Jambi & luar daerah (Palembang, Padang, Pekanbaru, Batam, Medan, dll.)."
            />
            <div className="card space-y-4 p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="name">Nama lengkap</Label>
                  <input id="name" className="field" placeholder="Nama kamu" autoComplete="name" {...register('name')} />
                  <Err e={errors.name} />
                </div>
                <div>
                  <Label htmlFor="phone">Nomor WhatsApp aktif</Label>
                  <input id="phone" type="tel" inputMode="tel" className="field" placeholder="Contoh: 081234567890" autoComplete="tel" {...register('phone')} />
                  <Err e={errors.phone} />
                </div>
              </div>

              <div>
                <Label htmlFor="address">Kota &amp; alamat pengiriman</Label>
                <textarea
                  id="address"
                  rows={2}
                  className="field"
                  placeholder="Contoh: Jl. Sudirman No. 12, Palembang"
                  {...register('address')}
                />
                <Err e={errors.address} />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="quantity">Jumlah unit</Label>
                  <input id="quantity" type="number" min={1} className="field" {...register('quantity')} />
                  <Err e={errors.quantity} />
                </div>
                <div>
                  <Label htmlFor="payment">Pembayaran</Label>
                  <select id="payment" className="field" {...register('payment')}>
                    <option value="Tunai">Tunai / M-Banking</option>
                    <option value="Tabung">Sistem Tabung</option>
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="needBy">Dibutuhkan sebelum (opsional)</Label>
                <input id="needBy" type="date" min={minDate()} className="field" {...register('needBy')} />
                <Err e={errors.needBy} />
                <p className="mt-1.5 text-xs text-muted">
                  Estimasi pengerjaan ±2 bulan. Pesanan mendadak (1 minggu / 1 bulan) belum dapat diterima.
                </p>
              </div>

              <div className="pt-1">
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gold/40 bg-cream/85 p-3.5 text-sm leading-relaxed text-bark">
                  <input
                    type="checkbox"
                    {...register('agreedToTerms')}
                    className="mt-0.5 h-5 w-5 shrink-0 accent-[#6E3F22]"
                  />
                  <span>
                    Saya mengisi data dengan benar dan memahami pengajuan custom ini berstatus <strong>Menunggu Konfirmasi WA</strong> (pengerjaan baru dimulai setelah harga akhir &amp; DP disepakati bersama Pak Nanang di WhatsApp).
                  </span>
                </label>
                <Err e={errors.agreedToTerms} />
              </div>
            </div>
          </section>
        </div>

        {/* KOLOM KANAN: PRATINJAU REPLIKA DESKTOP + KOYO LIVE */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="luxury-panel overflow-hidden border-gold/40 shadow-lift">
            <div className="hidden lg:block">
              <div className="luxury-dark flex items-center justify-between gap-2 border-b border-gold/30 px-3.5 py-2.5">
                <div className="flex items-center gap-1" role="tablist" aria-label="Sudut pandang pratinjau">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={view === 'front'}
                    onClick={() => setView('front')}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                      view === 'front' ? 'bg-gold text-espresso shadow-gold' : 'text-cream/75 hover:bg-white/10 hover:text-cream'
                    }`}
                  >
                    Tampak Depan
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={view === 'side'}
                    onClick={() => setView('side')}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                      view === 'side' ? 'bg-gold text-espresso shadow-gold' : 'text-cream/75 hover:bg-white/10 hover:text-cream'
                    }`}
                  >
                    {secondViewLabel}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setShowScale((v) => !v)}
                  aria-pressed={showScale}
                  className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${
                    showScale ? 'border-gold/50 bg-gold/20 text-gold-light' : 'border-white/20 bg-white/5 text-cream/70 hover:border-gold/40'
                  }`}
                  title="Tampilkan pembanding tinggi manusia 170 cm"
                >
                  <User size={13} /> 170cm
                </button>
              </div>

              <FurniturePreview
                type={type}
                dims={dims}
                opts={opts}
                finish={finish}
                sheen={sheen}
                view={view}
                showScale={showScale}
              />
            </div>

            {/* Saran Singkat dari Koyo */}
            <div className="flex items-start gap-3 border-y border-line bg-gradient-to-r from-cream via-white to-sand/50 px-4 py-3">
              <span className="h-11 w-11 shrink-0 overflow-hidden rounded-full border-2 border-white bg-sand shadow-soft">
                <Koyo face mood="excited" tracking={false} className="h-full w-full" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-teak">
                  <Sparkles size={11} className="text-gold" /> Kata Koyo
                </p>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={koyoTip}
                    initial={{ opacity: 0, y: 3 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -3 }}
                    transition={{ duration: 0.2 }}
                    className="mt-0.5 text-xs leading-relaxed text-bark"
                  >
                    "{koyoTip}"
                  </motion.p>
                </AnimatePresence>
              </div>
            </div>

            {/* Ringkasan & Tombol Aksi */}
            <div className="space-y-3 p-5 text-[14.5px]">
              <div>
                <span className="inline-block rounded-full bg-sand px-2.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wider text-teak">
                  {spec.categoryLabel}
                </span>
                <p className="font-heading mt-1 text-xl font-bold text-bark">{spec.title}</p>
                <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-teak">
                  <Ruler size={14} /> {spec.size}
                </p>
              </div>

              <div className="space-y-1 text-sm text-muted">
                <p>
                  <span className="font-semibold text-bark">Finishing:</span> {spec.finish}
                </p>
                <p>
                  <span className="font-semibold text-bark">Detail:</span> {spec.options}
                </p>
              </div>

              <p className="rounded-xl bg-cream px-3 py-2 text-xs leading-relaxed text-muted">
                Gambar adalah ilustrasi pratinjau replika. Harga akhir, DP/sistem tabung, &amp; jadwal (±2 bulan) disepakati bersama Pak Nanang lewat WhatsApp.
              </p>

              <div className="space-y-2 pt-1">
                <button type="submit" disabled={submitting} className="btn-primary btn-shimmer w-full disabled:opacity-65">
                  {submitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin text-gold-light" /> Mengirim rancangan...
                    </>
                  ) : (
                    <>
                      <MessageCircle size={18} /> Ajukan &amp; Kirim ke WhatsApp
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={askKoyoAboutDesign}
                  className="btn-soft !min-h-[42px] w-full text-sm"
                >
                  <Sparkles size={15} className="text-gold" /> Diskusikan Desain Ini ke Koyo
                </button>
              </div>
            </div>
          </div>
        </aside>
      </form>
    </div>
  );
}
