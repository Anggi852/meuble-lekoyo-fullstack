import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Reveal from '../components/Reveal';
import Hero from '../components/Hero';
import ConversationalBar from '../components/ConversationalBar';
import {
  ArrowRight,
  Star,
  ShieldCheck,
  Ruler,
  Truck,
  MessageCircle,
  Clock,
  Search,
  ClipboardList,
  Hammer,
  Info,
  Sparkles,
  MapPin,
  CheckCircle2,
  Quote,
  Phone,
  ExternalLink,
  Navigation,
  Package,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import ProductCard from '../components/ProductCard';
import ResponsiveImage from '../components/ResponsiveImage';
import FaqList from '../components/FaqList';
import { WA_BASE } from '../services/whatsapp';
import { STORE } from '../data/store';
import { getShopStatus } from '../utils/format';

const trust = [
  { icon: ShieldCheck, title: 'Kayu jati solid asli', text: 'Kualitas bahan pilihan & ketahanan bertahun-tahun jadi prioritas utama kami.' },
  { icon: Ruler, title: 'Studio custom presisi', text: 'Atur ukuran, model ukiran Jepara, & warna finishing dengan pratinjau langsung.', to: '/custom' },
  { icon: Truck, title: 'Kirim luar daerah Jambi', text: 'Melayani pengiriman aman ke Padang, Palembang, Pekanbaru, Batam, hingga Medan.' },
];

const steps = [
  { icon: Search, title: 'Pilih atau tanya Koyo', text: 'Jelajahi katalog per kategori atau ceritakan budgetmu ke Koyo.' },
  { icon: ClipboardList, title: 'Isi formulir / lewat chat', text: 'Masukkan nama, alamat luar daerah, jumlah, dan pilihan tunai/tabung.' },
  { icon: MessageCircle, title: 'Konfirmasi WhatsApp', text: 'Pak Nanang mengonfirmasi harga akhir, DP, dan jadwal pembuatan.' },
  { icon: Hammer, title: 'Dibuat & dikirim aman', text: 'Dikerjakan teliti selama ±2 bulan, lalu dikirim rapi ke alamatmu.' },
];

const reachCities = [
  'Kota Jambi',
  'Palembang',
  'Padang',
  'Pekanbaru',
  'Batam',
  'Medan',
  'Bengkulu',
  'Bandar Lampung',
  'Bukittinggi',
  'Dumai',
];

const categoryList = ['Meja', 'Kursi', 'Lemari', 'Cermin', 'Kamar Set'];

export default function Home() {
  const { products, testimonials, faqs, openKoyoWith } = useApp();
  const featured = products.filter((p) => p.featured).slice(0, 4);
  const hero = products.find((p) => p.featured) || products[0];
  const status = getShopStatus();

  return (
    <div>
      <Hero hero={hero} status={status} />

      {/* KEUNGGULAN GALERI */}
      <section className="border-b border-gold/20 bg-white/90 backdrop-blur-md">
        <ul className="mx-auto grid max-w-6xl divide-y divide-line/80 px-4 py-7 sm:px-6 md:grid-cols-3 md:divide-x md:divide-y-0">
          {trust.map((t, i) => (
            <Reveal key={t.title} delay={i * 0.08}>
              <li className="group flex items-start gap-4 py-4 md:px-6 md:py-2 first:md:pl-0 last:md:pr-0">
                {t.to ? (
                  <Link to={t.to} className="flex items-start gap-4">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-gold/30 bg-sand/80 text-teak shadow-soft transition group-hover:scale-105 group-hover:border-gold group-hover:bg-espresso group-hover:text-gold-light">
                      <t.icon size={22} />
                    </span>
                    <div>
                      <p className="font-heading text-lg font-bold text-espresso group-hover:text-teak">
                        {t.title} <ArrowRight size={14} className="inline text-gold-dark transition group-hover:translate-x-1" />
                      </p>
                      <p className="mt-0.5 text-[14.5px] leading-relaxed text-muted">{t.text}</p>
                    </div>
                  </Link>
                ) : (
                  <>
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-gold/30 bg-sand/80 text-teak shadow-soft transition group-hover:scale-105 group-hover:border-gold group-hover:bg-espresso group-hover:text-gold-light">
                      <t.icon size={22} />
                    </span>
                    <div>
                      <p className="font-heading text-lg font-bold text-espresso">{t.title}</p>
                      <p className="mt-0.5 text-[14.5px] leading-relaxed text-muted">{t.text}</p>
                    </div>
                  </>
                )}
              </li>
            </Reveal>
          ))}
        </ul>
      </section>

      {/* PANGGUNG CONCIERGE PERCAKAPAN BERSAMA KOYO */}
      <ConversationalBar />

      {/* KATEGORI EDITORIAL */}
      <section className="section">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="kicker">Koleksi Kayu Jati Solid</span>
            <h2 className="font-heading mt-1.5 text-3xl font-bold text-espresso sm:text-4xl">
              Eksplorasi berdasarkan <span className="italic text-teak">kategori</span>
            </h2>
            <p className="mt-2 text-muted">Temukan karya jati terbaik untuk setiap ruang rumahmu.</p>
          </div>
          <button
            type="button"
            onClick={() => openKoyoWith('Rekomendasi produk unggulan')}
            className="btn-soft !min-h-[42px] !rounded-full !px-4 !py-2 text-sm"
          >
            <Sparkles size={15} className="text-gold-dark" /> Minta Koyo pilihkan
          </button>
        </div>

        <div className="mt-7 grid grid-cols-2 gap-3 sm:mt-8 sm:gap-4 md:grid-cols-5">
          {categoryList.map((cat, i) => {
            const list = products.filter((p) => p.category === cat);
            const isFifth = i === categoryList.length - 1;
            return (
              <Reveal key={cat} delay={i * 0.06} className={isFifth ? 'col-span-2 md:col-span-1' : ''}>
                <Link
                  to={`/catalog?category=${encodeURIComponent(cat)}`}
                  className="card-alive group relative block overflow-hidden border-gold/25"
                >
                  <div className={`relative overflow-hidden bg-sand ${isFifth ? 'aspect-[2/1] sm:aspect-[2.3/1] md:aspect-[4/5]' : 'aspect-[4/3] sm:aspect-square md:aspect-[4/5]'}`}>
                    {list[0] && (
                      <ResponsiveImage
                        src={list[0].image}
                        alt={cat}
                        widths={[360, 560, 800]}
                        sizes={isFifth ? '(max-width: 767px) 94vw, 20vw' : '(max-width: 767px) 46vw, 20vw'}
                        defaultWidth={560}
                        className="h-full w-full object-cover object-center transition duration-700 ease-out group-hover:scale-105 md:group-hover:scale-110"
                      />
                    )}
                    <div className="pointer-events-none absolute inset-2.5 rounded-xl border border-white/25 transition duration-300 group-hover:border-gold-light/65" />
                    <div className="absolute inset-0 bg-gradient-to-t from-espresso/85 via-espresso/20 to-transparent" />
                    <span className="absolute right-3.5 top-3.5 rounded-full border border-gold/40 bg-espresso/80 px-2.5 py-0.5 text-[11px] font-bold text-gold-light backdrop-blur-md">
                      {list.length} item
                    </span>
                    <div className="absolute inset-x-0 bottom-0 p-4 text-cream">
                      <h3 className="font-heading text-xl font-bold">{cat}</h3>
                      <p className="mt-0.5 flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-gold-light/90 transition group-hover:text-gold-light">
                        Lihat <ArrowRight size={13} className="transition group-hover:translate-x-1" />
                      </p>
                    </div>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* UNGGULAN */}
      <section className="section !pt-2">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="kicker">Signature Collection</span>
            <h2 className="font-heading mt-1.5 text-3xl font-bold text-espresso sm:text-4xl">
              Produk <span className="italic text-teak">unggulan</span> kami
            </h2>
            <p className="mt-2 text-muted">Karya jati solid pilihan terbaik dari Meuble Le'Koyo Jambi.</p>
          </div>
          <Link to="/catalog" className="group inline-flex items-center gap-1.5 font-semibold text-teak transition hover:text-espresso">
            Lihat semua katalog <ArrowRight size={17} className="text-gold-dark transition group-hover:translate-x-1" />
          </Link>
        </div>
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((product, i) => (
            <Reveal key={product.id} delay={i * 0.08}>
              <ProductCard product={product} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* ALUR PESAN + LINIMASA PENGERJAAN 2 BULAN (Hangat, Cerah, & Terstruktur Rapi) */}
      <section className="wood-grain-bg relative overflow-hidden border-y border-gold/25 bg-gradient-to-b from-sand/70 via-cream to-sand/55">
        <div className="section">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="kicker">Transparan &amp; Personal</span>
              <h2 className="font-heading mt-1.5 text-3xl font-bold text-espresso sm:text-4xl">
                Cara memesan dari <span className="italic text-teak">mana saja</span>
              </h2>
              <p className="mt-2 max-w-xl text-muted">
                Empat langkah sederhana dari memilih hingga furnitur kayu jati solid tiba dengan aman di rumahmu.
              </p>
            </div>
            <button
              type="button"
              onClick={() => openKoyoWith('Mulai pesan lewat chat')}
              className="btn-primary btn-shimmer !min-h-[44px] text-sm"
            >
              <Sparkles size={16} className="text-gold-light" /> Coba Pesan Lewat Chat
            </button>
          </div>

          <ol className="relative mt-8 grid gap-4 sm:mt-9 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
            {steps.map((s, i) => (
              <motion.li
                key={s.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ delay: i * 0.08, duration: 0.45 }}
                className="card-alive group relative p-5 sm:p-6"
              >
                <div className="flex items-center justify-between">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl border border-gold/40 bg-gradient-to-br from-sand to-cream font-heading text-lg font-bold text-teak shadow-soft transition group-hover:bg-teak group-hover:text-gold-light">
                    0{i + 1}
                  </span>
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-cream text-gold-dark">
                    <s.icon size={19} />
                  </span>
                </div>
                <h3 className="font-heading mt-5 text-lg font-bold text-espresso">{s.title}</h3>
                <p className="mt-1.5 text-[14.5px] leading-relaxed text-muted">{s.text}</p>
              </motion.li>
            ))}
          </ol>

          {/* Kartu Linimasa 3 Tahap Pengerjaan (±2 Bulan) — Rapi, Proporsional, Tanpa Panah Menggantung */}
          <div className="luxury-panel mt-7 overflow-hidden p-5 sm:mt-8 sm:p-7">
            <div className="flex flex-col gap-3 border-b border-line/80 pb-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3.5">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-gold/35 bg-sand/85 text-teak shadow-soft">
                  <Info size={20} />
                </span>
                <div>
                  <h3 className="font-heading text-xl font-bold text-espresso">
                    Mengapa pengerjaan memakan waktu ± 2 bulan?
                  </h3>
                  <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">
                    Demi menjaga mutu kayu jati solid dan kerapian ukiran, pesanan mendadak (1 minggu atau 1 bulan) belum dapat kami terima. Mohon pesan jauh hari, atau tanyakan stok siap jual di toko.
                  </p>
                </div>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-full border border-gold/35 bg-cream px-3.5 py-1.5 text-xs font-bold text-teak">
                <Clock size={13} className="text-gold-dark" /> Estimasi Standar ±60 Hari
              </span>
            </div>

            {/* 3 Kolom Tahapan Simetris dengan Garis Penghubung Rapi di Desktop */}
            <div className="relative mt-6 grid gap-4 md:grid-cols-3 md:gap-6">
              <div
                className="pointer-events-none absolute left-[16%] right-[16%] top-5 hidden h-[2px] bg-gradient-to-r from-gold/35 via-gold to-sage/50 md:block"
                aria-hidden="true"
              />

              {[
                {
                  step: 'Tahap 1 · Minggu 1',
                  title: 'Pengadaan Kayu Jati',
                  desc: 'Kayu jati solid berkualitas dipesan dari Jakarta dan diseleksi sebelum masuk workshop.',
                  badge: 'bg-sand text-teak border-gold/40',
                  dot: 'bg-teak text-gold-light',
                },
                {
                  step: 'Tahap 2 · Minggu 2–8',
                  title: 'Pengerjaan Pengrajin',
                  desc: 'Proses potong, perakitan kokoh, pahatan ukiran Jepara, hingga pelitur finishing halus.',
                  badge: 'bg-gold/15 text-teak-dark border-gold/50',
                  dot: 'bg-gold text-espresso',
                },
                {
                  step: 'Tahap 3 · Selesai',
                  title: 'Pengiriman Aman',
                  desc: 'Pemeriksaan kualitas akhir, pengemasan rapi, lalu dikirim aman ke Jambi maupun luar daerah.',
                  badge: 'bg-sage/15 text-sage border-sage/35',
                  dot: 'bg-sage text-white',
                },
              ].map((stage, idx) => (
                <div
                  key={stage.title}
                  className="relative flex items-start gap-3.5 rounded-2xl border border-line/85 bg-cream/65 p-4 md:flex-col md:items-center md:bg-white md:p-5 md:text-center md:shadow-soft"
                >
                  <span
                    className={`relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 border-white font-heading text-sm font-bold shadow-soft ${stage.dot}`}
                  >
                    {idx + 1}
                  </span>
                  <div className="min-w-0 flex-1 md:mt-2">
                    <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${stage.badge}`}>
                      {stage.step}
                    </span>
                    <p className="font-heading mt-2 text-base font-bold text-espresso">{stage.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted sm:text-[13px]">{stage.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PITA JANGKAUAN LUAR DAERAH JAMBI */}
      <div className="overflow-hidden border-b border-line bg-white/95 py-4">
        <div className="marquee-reverse flex w-max items-center">
          {[0, 1].map((g) => (
            <div key={g} className="flex shrink-0 items-center">
              {reachCities.map((city) => (
                <span
                  key={`${g}-${city}`}
                  className="mx-3 inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-cream px-4 py-1.5 text-sm font-semibold text-espresso shadow-soft"
                >
                  <MapPin size={14} className="text-gold-dark" /> {city}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* TESTIMONI */}
      <section className="section">
        <div>
          <span className="kicker">Dipercaya Pelanggan Nusantara</span>
          <h2 className="font-heading mt-1.5 text-3xl font-bold text-espresso sm:text-4xl">
            Cerita dari <span className="italic text-teak">luar Jambi</span>
          </h2>
          <p className="mt-2 text-muted">Pengalaman nyata pembeli furnitur jati Meuble Le'Koyo dari berbagai kota.</p>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {testimonials
            .filter((t) => t.showOnHome !== false)
            .map((t, i) => {
              const stars = Math.min(5, Math.max(1, Number(t.rating) || 5));
              return (
                <Reveal key={t.id} delay={(i % 3) * 0.08}>
                  <figure className="card-alive relative flex h-full flex-col p-6">
                    <Quote size={36} className="pointer-events-none absolute right-5 top-5 text-gold/25" />
                    <div className="flex gap-1 text-gold">
                      {[...Array(5)].map((_, k) => (
                        <Star
                          key={k}
                          size={16}
                          fill={k < stars ? 'currentColor' : 'none'}
                          className={k < stars ? 'text-gold' : 'text-line'}
                        />
                      ))}
                    </div>

                    {t.productName && (
                      <div className="mt-3">
                        {t.productId ? (
                          <Link
                            to={`/product/${t.productId}`}
                            className="inline-flex items-center gap-1.5 rounded-full border border-gold/35 bg-sand/70 px-3 py-1 text-xs font-semibold text-teak transition hover:border-teak hover:bg-sand"
                          >
                            <Package size={12} /> {t.productName}
                          </Link>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/35 bg-sand/70 px-3 py-1 text-xs font-semibold text-teak">
                            <Package size={12} /> {t.productName}
                          </span>
                        )}
                      </div>
                    )}

                    <blockquote className="relative mt-3.5 flex-1 text-[16px] leading-relaxed text-bark">
                      "{t.text}"
                    </blockquote>
                    <figcaption className="mt-5 flex items-center justify-between gap-3 border-t border-line/70 pt-4">
                      <div className="flex items-center gap-3">
                        <span className="grid h-11 w-11 place-items-center rounded-full border border-gold/35 bg-gradient-to-br from-sand to-cream font-heading text-lg font-bold text-espresso">
                          {t.name.split(' ').pop()[0]}
                        </span>
                        <div>
                          <span className="block font-semibold text-espresso">{t.name}</span>
                          <span className="flex items-center gap-1 text-xs font-medium text-muted">
                            <MapPin size={12} className="text-gold-dark" /> {t.city}
                          </span>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full border border-sage/25 bg-sage/10 px-2.5 py-1 text-[11px] font-semibold text-sage">
                        <CheckCircle2 size={12} /> {t.source === 'customer' ? 'Pembeli Asli' : 'Terverifikasi'}
                      </span>
                    </figcaption>
                  </figure>
                </Reveal>
              );
            })}
        </div>
      </section>

      {/* FAQ */}
      {faqs.length > 0 && (
        <section className="section !pt-2">
          <div className="grid gap-8 lg:grid-cols-[1fr_1.6fr]">
            <div>
              <span className="kicker">Pusat Informasi</span>
              <h2 className="font-heading mt-1.5 text-3xl font-bold text-espresso sm:text-4xl">
                Pertanyaan yang sering diajukan
              </h2>
              <p className="mt-3 text-muted">
                Masih ada pertanyaan khusus? Ngobrol langsung dengan Koyo, atau hubungi Pak Nanang lewat WhatsApp.
              </p>
              <div className="mt-6 flex flex-wrap gap-2.5">
                <button type="button" onClick={() => openKoyoWith()} className="btn-primary btn-shimmer">
                  <Sparkles size={17} className="text-gold-light" /> Ngobrol dengan Koyo
                </button>
                <a href={WA_BASE} target="_blank" rel="noreferrer" className="btn-outline">
                  <MessageCircle size={17} /> WhatsApp Owner
                </a>
              </div>
            </div>
            <FaqList items={faqs.slice(0, 6)} />
          </div>
        </section>
      )}

      {/* LOKASI SHOWROOM & GOOGLE MAPS */}
      <section className="section !pt-2" id="lokasi">
        <div className="luxury-panel overflow-hidden p-5 sm:p-8">
          <div className="grid items-stretch gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:gap-8">
            <div className="flex flex-col justify-between">
              <div>
                <span className="kicker">
                  <MapPin size={13} className="text-gold-dark" /> Kunjungi Showroom Kami
                </span>
                <h2 className="font-heading mt-1.5 text-3xl font-bold text-espresso sm:text-4xl">
                  Lokasi <span className="italic text-teak">{STORE.name}</span> Jambi
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted sm:text-[15px]">
                  Ingin lihat langsung kualitas serat kayu jati solid, pilih warna pelitur, atau konsultasi pesanan custom? Silakan mampir ke showroom kami atau hubungi via WhatsApp.
                </p>

                <dl className="mt-6 space-y-4 text-sm sm:text-[15px]">
                  <div className="flex items-start gap-3.5 rounded-2xl border border-line/80 bg-cream/70 p-4">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-teak shadow-soft">
                      <MapPin size={18} />
                    </span>
                    <div>
                      <dt className="text-xs font-bold uppercase tracking-wider text-gold-dark">Alamat Lengkap</dt>
                      <dd className="mt-0.5 font-semibold leading-relaxed text-espresso">{STORE.address}</dd>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="flex items-start gap-3 rounded-2xl border border-line/80 bg-cream/70 p-4">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-teak shadow-soft">
                        <Phone size={16} />
                      </span>
                      <div className="min-w-0">
                        <dt className="text-[11px] font-bold uppercase tracking-wider text-gold-dark">WhatsApp / HP</dt>
                        <dd className="mt-0.5 font-bold text-espresso">
                          <a href={WA_BASE} target="_blank" rel="noreferrer" className="hover:text-teak hover:underline">
                            {STORE.phoneDisplay}
                          </a>
                        </dd>
                        <p className="text-xs text-muted">{STORE.owner}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 rounded-2xl border border-line/80 bg-cream/70 p-4">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-teak shadow-soft">
                        <Clock size={16} />
                      </span>
                      <div>
                        <dt className="text-[11px] font-bold uppercase tracking-wider text-gold-dark">Jam Buka</dt>
                        <dd className="mt-0.5 text-xs font-semibold leading-relaxed text-espresso">
                          {STORE.hoursWeekday}
                          <br />
                          <span className="font-normal text-muted">{STORE.hoursSunday}</span>
                        </dd>
                      </div>
                    </div>
                  </div>
                </dl>
              </div>

              <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
                <a
                  href={STORE.mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary btn-shimmer flex-1 text-sm"
                >
                  <Navigation size={16} className="text-gold-light" /> Buka di Google Maps <ExternalLink size={14} />
                </a>
                <a
                  href={WA_BASE}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-outline flex-1 text-sm"
                >
                  <MessageCircle size={17} /> Chat {STORE.phoneDisplay}
                </a>
              </div>
            </div>

            {/* Peta Google Maps Interaktif */}
            <div className="relative min-h-[280px] overflow-hidden rounded-2xl border-2 border-gold/30 bg-sand shadow-soft sm:min-h-[360px]">
              <iframe
                title="Peta Lokasi Meuble Le'Koyo Jambi"
                src={STORE.mapsEmbedUrl}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-full min-h-[280px] w-full border-0 sm:min-h-[360px]"
                allowFullScreen
              />
              <a
                href={STORE.mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-white/95 px-3.5 py-1.5 text-xs font-bold text-espresso shadow-lift backdrop-blur-md transition hover:bg-espresso hover:text-cream"
              >
                <MapPin size={13} className="text-teak" /> Arahkan Rute <ExternalLink size={12} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA CUSTOM BESPOKE */}
      <section className="mx-auto max-w-6xl px-4 pb-6 pt-4 sm:px-6">
        <div className="luxury-dark relative overflow-hidden rounded-[2rem] border border-gold/40 px-6 py-14 text-center text-cream shadow-lift sm:px-14">
          <div className="pointer-events-none absolute inset-3 rounded-[1.5rem] border border-gold/20" aria-hidden="true" />
          <div className="relative">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-gold/40 bg-gold/15 text-gold-light backdrop-blur-sm">
              <Clock size={26} />
            </span>
            <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.24em] text-gold-light">Bespoke Teak Craftsmanship</p>
            <h2 className="font-heading mx-auto mt-2 max-w-2xl text-3xl font-bold sm:text-4xl">
              Punya ukuran atau model sendiri? <span className="italic text-gold-light">Kami buatkan.</span>
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-cream/75">
              Dari Kitchen Set, Meja, Lemari, Kamar Set, Buffet TV, Pintu/Partisi hingga model khusus lainnya — rancang di Studio Custom atau lihat koleksi yang pernah dicustom di Katalog.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to="/custom" className="btn-gold !px-6">
                <Ruler size={18} /> Rancang Furniturmu
              </Link>
              <button
                type="button"
                onClick={() => openKoyoWith('Saya mau pesan custom')}
                className="btn border border-gold/45 bg-white/10 text-cream backdrop-blur-sm hover:bg-white/20"
              >
                <Sparkles size={17} className="text-gold-light" /> Diskusi dengan Koyo
              </button>
              <a
                href={WA_BASE}
                target="_blank"
                rel="noreferrer"
                className="btn border border-white/25 text-cream/90 hover:border-gold/50 hover:bg-white/10"
              >
                <MessageCircle size={17} /> Chat Pak Nanang
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
