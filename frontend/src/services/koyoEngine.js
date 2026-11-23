import { formatRupiah } from '../utils/format';
import { STORE } from '../data/store';

export const INTENT_LABELS = {
  info_produk: 'Info Produk',
  rekomendasi: 'Rekomendasi',
  sistem_tabung: 'Sistem Tabung',
  custom_order: 'Custom Order',
  estimasi_waktu: 'Estimasi Waktu',
  pengiriman: 'Pengiriman',
  garansi: 'Garansi & Servis',
  pemesanan: 'Pemesanan',
  faq_owner: 'FAQ Toko',
  sapaan: 'Sapaan',
  out_of_scope: 'Di Luar Topik',
  lainnya: 'Lainnya',
};

const STOP_WORDS = new Set([
  'yang', 'dan', 'apa', 'apakah', 'bisa', 'untuk', 'dengan', 'ada', 'ini', 'itu',
  'saya', 'aku', 'mau', 'ingin', 'tanya', 'bagaimana', 'gimana', 'berapa', 'dari',
  'atau', 'kah', 'dong', 'kak', 'min', 'koyo', 'pak', 'tolong', 'dong', 'ya', 'yah',
  'di', 'ke', 'nya', 'buat', 'cari', 'carikan', 'lihat', 'punya', 'toko',
]);

const OUT_OF_SCOPE_PATTERNS = [
  /\b(cuaca|hujan|suhu|iklim|ramalan)\b/i,
  /\b(politik|presiden|pemilu|partai|dpr|menteri|pilkada)\b/i,
  /\b(resep|masak|makanan|minuman|nasi goreng|rendang|soto|kue)\b/i,
  /\b(coding|kode|python|javascript|react|html|css|java|sql|algoritma|programming)\b/i,
  /\b(saham|kripto|crypto|bitcoin|forex|judol|slot|togel)\b/i,
  /\b(sepak\s?bola|liga|timnas|pertandingan|skor|film|drakor|anime|lagu|lirik)\b/i,
  /\b(tugas sekolah|pr matematika|hitung integral|turunan|biologi|fisika|kimia)\b/i,
];

const CATEGORY_KEYWORDS = {
  Meja: ['meja', 'makan', 'kerja', 'wfh', 'belajar', 'tamu meja', 'konsol'],
  Kursi: ['kursi', 'sofa', 'tamu', 'duduk', 'bangku'],
  Lemari: ['lemari', 'almari', 'pakaian', 'baju', 'hias', 'pajangan', 'bufet'],
  Cermin: ['cermin', 'kaca', 'rias', 'dinding', 'frame'],
  'Kamar Set': ['kamar set', 'kamar tidur', 'tempat tidur', 'ranjang', 'dipan', 'nakas', 'kasur'],
};

function parseBudget(text) {
  const lower = text.toLowerCase().replace(/\./g, '').replace(/,/g, '.');
  // Contoh: "di bawah 5 juta", "maksimal 3.5jt", "budget 2000000", "< 4 jt"
  const jtMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:jt|juta)/);
  if (jtMatch) return Math.round(parseFloat(jtMatch[1]) * 1_000_000);
  const rbMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:rb|ribu)/);
  if (rbMatch) return Math.round(parseFloat(rbMatch[1]) * 1_000);
  const rawMatch = lower.match(/\b([1-9]\d{5,7})\b/);
  if (rawMatch) return parseInt(rawMatch[1], 10);
  return null;
}

function detectCategory(text) {
  const lower = text.toLowerCase();
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) return cat;
  }
  return null;
}

function matchProducts(text, products) {
  const lower = text.toLowerCase();
  const category = detectCategory(lower);
  const budget = parseBudget(lower);
  const wantsCheap = /\b(murah|termurah|terjangkau|hemat|ekonomis)\b/i.test(lower);
  const wantsFeatured = /\b(terlaris|unggulan|favorit|best\s?seller|rekomendasi|bagus|populer)\b/i.test(lower);

  let list = [...products];
  if (category) {
    list = list.filter((p) => p.category === category);
  } else {
    const words = lower.split(/[^a-z0-9]+/).filter((w) => w.length > 2 && !STOP_WORDS.has(w));
    const scored = list
      .map((p) => {
        const hay = `${p.name} ${p.category} ${p.description} ${p.material}`.toLowerCase();
        const score = words.reduce((s, w) => s + (hay.includes(w) ? 1 : 0), 0);
        return { p, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score);
    if (scored.length > 0) list = scored.map((x) => x.p);
  }

  if (budget) {
    const under = list.filter((p) => p.price <= budget);
    if (under.length > 0) {
      list = under.sort((a, b) => b.price - a.price);
    } else {
      list = [...list].sort((a, b) => Math.abs(a.price - budget) - Math.abs(b.price - budget));
      return { items: list.slice(0, 3), category, budget, exactBudgetMatch: false };
    }
  } else if (wantsCheap) {
    list.sort((a, b) => a.price - b.price);
  } else if (wantsFeatured) {
    list.sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)));
  }

  return { items: list.slice(0, 3), category, budget, exactBudgetMatch: true };
}

function matchOwnerFaq(text, faqs) {
  const lower = text.toLowerCase();
  const words = lower.split(/[^a-z0-9]+/).filter((w) => w.length > 2 && !STOP_WORDS.has(w));
  if (!words.length) return null;
  let best = null;
  let bestScore = 0;
  faqs.forEach((f) => {
    const hay = `${f.title} ${f.question} ${f.answer}`.toLowerCase();
    const score =
      words.reduce((s, w) => s + (hay.includes(w) ? 1 : 0), 0) +
      (f.title.toLowerCase() === lower ? 5 : 0);
    if (score > bestScore) {
      best = f;
      bestScore = score;
    }
  });
  return bestScore >= 2 ? best : null;
}

/**
 * Mesin percakapan lokal Koyo (siap diganti / dihubungkan ke endpoint FastAPI RAG tim Gen AI).
 * Mengembalikan: { intent, text, speakText?, products?, actions?, quickReplies?, startOrder?, wa? }
 */
export function generateKoyoReply(rawText, { products = [], faqs = [], activeProduct = null } = {}) {
  const text = (rawText || '').trim();
  const lower = text.toLowerCase();

  // 1. Guardrail Anti Out-of-Scope (100% menolak sopan topik di luar furnitur jati)
  const mentionsLocation = /\b(alamat|lokasi|dimana|di mana|maps|peta|toko|showroom|telanaipura|sumantri|nomor|wa|whatsapp|hp|telepon|kontak)\b/i.test(lower);
  const mentionsFurniture =
    /\b(jati|kayu|mebel|meubel|furnitur|furniture|meja|kursi|lemari|cermin|kamar|nakas|tabung|custom|pesan|order|kirim|jambi|garansi|nanang|koyo|harga|stok)\b/i.test(lower);
  if (!mentionsFurniture && !mentionsLocation && OUT_OF_SCOPE_PATTERNS.some((rx) => rx.test(lower))) {
    return {
      intent: 'out_of_scope',
      text: "Wah, maaf ya! Koyo khusus membantu seputar furnitur kayu jati dan pemesanan di Meuble Le'Koyo saja. Kalau ada pertanyaan soal meja, kursi, lemari, sistem tabung, atau pengiriman luar Jambi, Koyo siap bantu!",
      quickReplies: ['Lihat produk unggulan', 'Cara sistem tabung', 'Pesan custom', 'Kirim luar Jambi'],
      wa: true,
    };
  }

  // 2. Sapaan hangat
  if (/^(halo|hai|hi|hello|selamat\s*(pagi|siang|sore|malam)|assalamu|permisi|p|tes|test)\b/i.test(lower) && text.length < 40) {
    return {
      intent: 'sapaan',
      text: "Halo! Senang bisa ngobrol denganmu. Aku Koyo, asisten Meuble Le'Koyo Jambi. Lagi cari furnitur kayu jati untuk ruangan apa, atau mau tanya-tanya soal sistem tabung dan pesanan custom dulu?",
      quickReplies: ['Cari meja jati', 'Produk unggulan', 'Sistem tabung', 'Pesan custom'],
    };
  }

  // 3. Terima kasih
  if (/\b(terima\s?kasih|makasih|thanks|thank you|oke\s?sip|siap\s?makasih)\b/i.test(lower) && text.length < 45) {
    return {
      intent: 'sapaan',
      text: "Sama-sama! Kalau nanti sudah nemu model yang cocok atau mau lanjut pesan ke Pak Nanang, tinggal panggil Koyo lagi ya.",
      quickReplies: ['Lihat katalog', 'Mulai pesan lewat chat', 'Chat Pak Nanang'],
    };
  }

  // 3b. Lokasi Showroom, Google Maps & Nomor WhatsApp Asli
  if (/\b(alamat|lokasi|dimana|di mana|maps|peta|jalan|telanaipura|sumantri|nomor\s?(hp|wa|telepon)|kontak|buka\s?jam)\b/i.test(lower)) {
    return {
      intent: 'info_produk',
      text: `Showroom **${STORE.name}** berlokasi di:\n**${STORE.address}**\n\n• **Jam Buka:** ${STORE.hoursWeekday} (${STORE.hoursSunday})\n• **WhatsApp / HP Pak Nanang:** ${STORE.phoneDisplay}\n• **Google Maps:** ${STORE.mapsUrl}\n\nKamu bisa langsung berkunjung ke toko atau hubungi Pak Nanang lewat tombol WhatsApp di bawah ya!`,
      quickReplies: ['Lihat produk unggulan', 'Pesan custom (Kitchen Set dll)', 'Kirim luar Jambi bisa?'],
      wa: true,
    };
  }

  // 4. Sistem Tabung (detail lengkap sesuai wawancara Pak Nanang)
  if (/\b(tabung|menabung|cicil|nyicil|angsur|dp|uang muka|bertahap)\b/i.test(lower)) {
    return {
      intent: 'sistem_tabung',
      text: "Di Meuble Le'Koyo tersedia **Sistem Tabung**! Begitu kamu mulai menabung (berapa pun nominal awal yang disepakati dengan Pak Nanang), bahan kayu jati langsung kami beli dan furnitur mulai dibuat.\n\n**Catatan penting:** Jika barang sudah selesai dibuat tetapi pembayaran belum lunas dan ada pembeli tunai yang berminat, barang akan diberikan ke pembeli tunai terlebih dahulu—lalu kami buatkan unit baru lagi untuk pesanan tabunganmu. Transparan dan tetap diproses!",
      speakText: "Di Meuble Le Koyo tersedia sistem tabung. Bahan langsung dibeli dan barang mulai dibuat. Jika barang sudah jadi namun belum lunas lalu ada pembeli tunai, barang diberikan ke pembeli tunai dulu dan kami buatkan unit baru untuk pesanan tabunganmu.",
      quickReplies: ['Mulai pesan sistem tabung', 'Lama pembuatan berapa?', 'Lihat produk unggulan'],
      wa: true,
    };
  }

  // 5. Estimasi waktu & pesanan mendadak
  if (/\b(lama|berapa\s?(lama|bulan|minggu|hari)|estimasi|pengerjaan|mendadak|buru-buru|cepat|segera|1\s?minggu|1\s?bulan|seminggu|sebulan|kapan\s?jadi)\b/i.test(lower)) {
    const isUrgent = /\b(mendadak|buru-buru|cepat|segera|1\s?minggu|1\s?bulan|seminggu|sebulan)\b/i.test(lower);
    return {
      intent: 'estimasi_waktu',
      text: isUrgent
        ? "Mohon maaf sebelumnya, Pak Nanang **tidak menerima pesanan mendadak** (misalnya 1 minggu atau 1 bulan) demi menjaga kualitas kayu jati solid dan kerapian pengerjaan.\n\nProses pembuatan normal sekitar **± 2 bulan** (bahan baku dipesan dari Jakarta tiba ±1 minggu, sisanya pengerjaan). Kalau butuh cepat, kamu bisa tanyakan **stok siap jual (ready stock)** yang sedang ada di toko!"
        : "Proses pembuatan furnitur di Meuble Le'Koyo sekitar **± 2 bulan**. Bahan baku kayu jati dipesan dari Jakarta (±1 minggu perjalanan), lalu dikerjakan dengan teliti oleh tukang kami.\n\nKarena pesanan mendadak (1 minggu atau 1 bulan) tidak dapat kami terima, sebaiknya pesan jauh hari ya—atau cek stok siap jual yang tersedia di toko.",
      speakText: "Proses pembuatan furnitur sekitar dua bulan, karena bahan baku dipesan dari Jakarta sekitar satu minggu dan sisanya proses pengerjaan. Pesanan mendadak tidak dapat kami terima, jadi mohon pesan jauh hari ya.",
      quickReplies: ['Cek produk siap jual', 'Cara sistem tabung', 'Mulai pesan sekarang'],
      actions: [{ label: 'Lihat Katalog', to: '/catalog' }],
    };
  }

  // 6. Custom order
  if (/\b(custom|kostum|request|ukuran\s?khusus|model\s?sendiri|desain\s?sendiri|rancang|sketsa|kitchen\s?set|dapur|buffet|rak\s?tv|backdrop|partisi|pintu|kusen|gazebo|mimbar|pernah\s?dicustom)\b/i.test(lower)) {
    return {
      intent: 'custom_order',
      text: "Bisa banget! Meuble Le'Koyo bisa membuat **jenis furnitur kayu jati apa saja** — mulai dari **Kitchen Set**, **Meja**, **Kursi & Sofa**, **Lemari**, **Kamar Set**, **Buffet/Backdrop TV**, **Pintu & Partisi**, hingga **Gazebo, Meja Kafe, atau model bebas lainnya**!\n\nDi halaman **Katalog** juga sudah menyatu galeri **Yang Pernah Dicustom** yang dipisah per jenis sebagai inspirasi. Estimasi pengerjaan ±2 bulan, bisa tunai maupun sistem tabung.",
      actions: [{ label: 'Buka Studio Custom', to: '/custom' }],
      quickReplies: ['Cara sistem tabung', 'Kirim luar Jambi bisa?', 'Lihat produk unggulan'],
      wa: true,
    };
  }

  // 7. Pengiriman luar daerah Jambi
  if (/\b(kirim|pengiriman|luar\s?(daerah|jambi|kota|provinsi)|ongkir|ekspedisi|palembang|padang|pekanbaru|batam|medan|jakarta|sumatera|lampung|bengkulu|riau)\b/i.test(lower)) {
    return {
      intent: 'pengiriman',
      text: "Tentu bisa! Kami memang melayani pengiriman furnitur kayu jati ke **luar daerah Jambi** (seperti Palembang, Padang, Pekanbaru, Batam, Medan, dan kota lainnya).\n\nCukup pilih produk dan tulis kota/alamat tujuanmu saat memesan, nanti Pak Nanang akan mengonfirmasi detail ekspedisi, pengemasan aman, serta total biayanya lewat WhatsApp.",
      quickReplies: ['Mulai pesan lewat chat', 'Lihat produk unggulan', 'Lama pembuatan?'],
      wa: true,
    };
  }

  // 8. Garansi & servis
  if (/\b(garansi|rusak|servis|service|perbaikan|tukang|keluhan|komplain|cacat)\b/i.test(lower)) {
    return {
      intent: 'garansi',
      text: "Tenang, kualitas kayu jati adalah prioritas utama kami. Jika ada keluhan atau kerusakan saat produk masih dalam **masa garansi**, Meuble Le'Koyo dapat mengirimkan tukang untuk melakukan perbaikan **tanpa dikenakan biaya**.\n\nSilakan hubungi Pak Nanang lewat WhatsApp dengan menyertakan foto bagian yang dikeluhkan ya.",
      quickReplies: ['Bahan kayu jati asli?', 'Lihat produk unggulan'],
      wa: true,
    };
  }

  // 9. Bahan kayu jati & kualitas
  if (/\b(bahan|jati\s?asli|kualitas|awet|tahan\s?lama|solid|kayu\s?apa)\b/i.test(lower)) {
    return {
      intent: 'info_produk',
      text: "Semua furnitur Meuble Le'Koyo dibuat dari **kayu jati solid asli**. Pak Nanang selalu mengutamakan ketahanan jangka panjang dan kerapian finishing dibanding sekadar harga murah, karena furnitur adalah investasi rumah untuk bertahun-tahun.",
      quickReplies: ['Lihat produk unggulan', 'Bisa pesan custom?', 'Sistem tabung'],
    };
  }

  // 10. Mulai alur pemesanan langsung di chat
  if (/\b(mulai\s?pesan|mau\s?pesan|mau\s?beli|cara\s?pesan|pesan\s?sekarang|pesan\s?lewat\s?chat|order\s?sekarang|beli\s?ini)\b/i.test(lower)) {
    return {
      intent: 'pemesanan',
      text: activeProduct
        ? `Siap! Kita langsung buat pesanan untuk **${activeProduct.name}** (${formatRupiah(activeProduct.price)}) ya. Boleh tahu **nama lengkapmu**?`
        : "Siap! Koyo bantu susun pesanannya supaya nanti tinggal kirim rapi ke WhatsApp Pak Nanang.\n\nPertama, **furnitur apa** yang ingin kamu pesan? (Kamu bisa ketik nama produknya atau pilih dari daftar di bawah)",
      startOrder: true,
      product: activeProduct || null,
      quickReplies: activeProduct ? ['Batal pesan'] : products.slice(0, 4).map((p) => p.name),
    };
  }

  // 11. Cek rekomendasi / pencarian produk (kategori, budget, unggulan, stok siap jual)
  const asksProduct =
    Boolean(detectCategory(lower)) ||
    Boolean(parseBudget(lower)) ||
    /\b(produk|katalog|unggulan|rekomendasi|murah|harga|stok|ready|siap\s?jual|koleksi|jual\s?apa)\b/i.test(lower);

  if (asksProduct && products.length > 0) {
    const { items, category, budget, exactBudgetMatch } = matchProducts(lower, products);
    let intro = '';
    if (category && budget) {
      intro = exactBudgetMatch
        ? `Ini pilihan **${category}** kayu jati dengan budget maksimal **${formatRupiah(budget)}** yang paling cocok:`
        : `Saat ini belum ada **${category}** di bawah **${formatRupiah(budget)}**, tapi ini pilihan terdekat yang bisa kamu pertimbangkan (bisa juga pakai **Sistem Tabung**!):`;
    } else if (category) {
      intro = `Ini beberapa koleksi **${category}** kayu jati dari Meuble Le'Koyo. Klik **Lihat** untuk detail lengkap atau **Pesan ini** untuk langsung dibantu Koyo:`;
    } else if (budget) {
      intro = exactBudgetMatch
        ? `Dengan budget sekitar **${formatRupiah(budget)}**, ini rekomendasi furnitur jati yang cocok untukmu:`
        : `Ini pilihan furnitur jati terdekat dengan budget **${formatRupiah(budget)}** (tersedia juga opsi **Sistem Tabung**):`;
    } else {
      intro = `Ini beberapa koleksi unggulan **Meuble Le'Koyo** yang paling sering diminati pelanggan dari dalam maupun luar Jambi:`;
    }

    return {
      intent: category || budget ? 'rekomendasi' : 'info_produk',
      text: intro,
      products: items,
      actions: [{ label: category ? `Semua ${category}` : 'Buka Semua Katalog', to: category ? `/catalog?category=${encodeURIComponent(category)}` : '/catalog' }],
      quickReplies: ['Bisa pakai sistem tabung?', 'Kirim ke luar Jambi', 'Mau pesan custom'],
    };
  }

  // 12. Cocokkan dengan FAQ dinamis yang dikelola owner di Dashboard
  const matchedFaq = matchOwnerFaq(text, faqs);
  if (matchedFaq) {
    return {
      intent: 'faq_owner',
      text: matchedFaq.answer,
      quickReplies: ['Lihat produk unggulan', 'Mulai pesan lewat chat', 'Chat Pak Nanang'],
    };
  }

  // 13. Fallback sopan + arahkan ke WhatsApp owner
  return {
    intent: 'out_of_scope',
    text: "Maaf, Koyo belum menemukan jawaban pasti untuk pertanyaan itu. Koyo paling jago bantu soal **katalog kayu jati**, **sistem tabung**, **estimasi pembuatan (±2 bulan)**, **custom order**, dan **pengiriman luar Jambi**.\n\nKalau ada kebutuhan khusus, kamu bisa langsung chat Pak Nanang lewat WhatsApp di bawah ya!",
    quickReplies: ['Lihat produk unggulan', 'Cara sistem tabung', 'Pesan custom', 'Kirim luar Jambi'],
    wa: true,
  };
}
