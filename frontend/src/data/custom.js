// Konfigurasi Custom Studio Meuble Le'Koyo (bisa membuat jenis furnitur kayu jati apa saja).
// Aturan bisnis Pak Nanang Suryadi:
// - Bahan utama: Kayu Jati Solid asli
// - Estimasi pembuatan: ± 2 bulan (minimal 60 hari, tidak menerima pesanan mendadak)
// - Harga final disepakati langsung bersama owner lewat WhatsApp
export const MIN_DAYS = 60;

export const FINISHES = [
  { key: 'natural', label: 'Natural Jati', color: '#C8995F', grain: '#9E6E3B' },
  { key: 'salak', label: 'Salak Brown', color: '#8A4F2B', grain: '#5C3016' },
  { key: 'walnut', label: 'Walnut Tua', color: '#5E3820', grain: '#3B2010' },
  { key: 'putih', label: 'Putih Duco', color: '#EDE6D6', grain: '#D3C9B4' },
  { key: 'hitam', label: 'Hitam Charcoal', color: '#2F2823', grain: '#1A1512' },
];

export const SHEENS = [
  { key: 'doff', label: 'Doff / Natural' },
  { key: 'glossy', label: 'Glossy Mengkilap' },
];

export const CUSHION_COLORS = [
  { key: 'krem', label: 'Krem', hex: '#EBE0CC' },
  { key: 'cokelat', label: 'Cokelat', hex: '#7A4B31' },
  { key: 'sage', label: 'Hijau Sage', hex: '#738A72' },
  { key: 'abu', label: 'Abu Tua', hex: '#575552' },
];

export const TYPES = {
  kitchen: {
    label: 'Kitchen Set',
    name: 'Kitchen Set Jati',
    group: 'Dapur & Ruang Keluarga',
    tagline: 'Kitchen set kayu jati solid tahan lembap — model lurus, huruf L, hingga minibar.',
    dims: [
      ['w', 'Panjang Total', 150, 450, 260],
      ['h', 'Tinggi Keseluruhan', 190, 260, 225],
      ['d', 'Kedalaman Meja', 55, 75, 60],
    ],
    presets: [
      {
        name: 'Kitchen Set Lurus 2,4 m',
        dims: { w: 240, h: 220, d: 60 },
        opts: { bentuk: 'Lurus (I)', kabinetAtas: true, minibar: false, gaya: 'Minimalis Modern' },
      },
      {
        name: 'Kitchen Set L + Minibar',
        dims: { w: 320, h: 235, d: 62 },
        opts: { bentuk: 'Sudut (L)', kabinetAtas: true, minibar: true, gaya: 'Klasik Profil' },
      },
      {
        name: 'Kitchen Set Ukir Klasik',
        dims: { w: 300, h: 240, d: 62 },
        opts: { bentuk: 'Sudut (L)', kabinetAtas: true, minibar: false, gaya: 'Ukiran Jepara' },
      },
    ],
    opts: [
      { key: 'bentuk', label: 'Tata Letak Dapur', kind: 'choice', choices: ['Lurus (I)', 'Sudut (L)', 'Huruf U'], def: 'Lurus (I)' },
      { key: 'gaya', label: 'Gaya Pintu Kabinet', kind: 'choice', choices: ['Minimalis Modern', 'Klasik Profil', 'Ukiran Jepara'], def: 'Minimalis Modern' },
      { key: 'kabinetAtas', label: 'Sertakan kabinet gantung atas', kind: 'toggle', def: true },
      { key: 'minibar', label: 'Tambahkan meja island / minibar', kind: 'toggle', def: false },
    ],
  },

  meja: {
    label: 'Meja',
    name: 'Meja Jati',
    group: 'Ruang Makan & Kerja',
    tagline: 'Meja makan keluarga, meja kerja, meja tamu, hingga meja konsol.',
    dims: [
      ['w', 'Panjang', 80, 260, 160],
      ['d', 'Lebar', 50, 110, 85],
      ['h', 'Tinggi', 45, 95, 75],
    ],
    presets: [
      {
        name: 'Meja Makan 4–6 Org',
        dims: { w: 160, d: 85, h: 75 },
        opts: { kaki: 'Minimalis Kotak', ukiran: 'Polos', laci: 'Tanpa Laci', rakBawah: false },
      },
      {
        name: 'Meja Makan Ukir Jepara',
        dims: { w: 200, d: 95, h: 76 },
        opts: { kaki: 'Ukir Klasik', ukiran: 'Ukiran Jepara', laci: 'Tanpa Laci', rakBawah: false },
      },
      {
        name: 'Meja Kerja / Belajar',
        dims: { w: 135, d: 65, h: 75 },
        opts: { kaki: 'Minimalis Kotak', ukiran: 'Polos', laci: '2 Laci', rakBawah: false },
      },
    ],
    opts: [
      { key: 'kaki', label: 'Model Kaki', kind: 'choice', choices: ['Minimalis Kotak', 'Silang (X)', 'Ukir Klasik'], def: 'Minimalis Kotak' },
      { key: 'ukiran', label: 'Gaya Ukiran', kind: 'choice', choices: ['Polos', 'Ukiran Jepara'], def: 'Polos' },
      { key: 'laci', label: 'Laci Meja', kind: 'choice', choices: ['Tanpa Laci', '2 Laci'], def: 'Tanpa Laci' },
      { key: 'rakBawah', label: 'Tambahkan rak di bagian bawah', kind: 'toggle', def: false },
    ],
  },

  kursi: {
    label: 'Kursi & Sofa',
    name: 'Kursi / Sofa Jati',
    group: 'Ruang Tamu & Makan',
    tagline: 'Kursi makan, kursi tamu ukir, sofa sudut L, hingga kursi teras santai.',
    dims: [
      ['w', 'Lebar Dudukan', 44, 180, 56],
      ['h', 'Tinggi Total', 78, 120, 96],
    ],
    presets: [
      {
        name: 'Kursi Makan Minimalis',
        dims: { w: 48, h: 92 },
        opts: { sandaran: 'Jeruji', ukiran: 'Polos', bantalan: 'Pakai Jok', warnaKain: 'krem', armrest: false },
      },
      {
        name: 'Kursi Tamu Ukir Jepara',
        dims: { w: 64, h: 108 },
        opts: { sandaran: 'Panel Solid', ukiran: 'Ukiran Jepara', bantalan: 'Pakai Jok', warnaKain: 'cokelat', armrest: true },
      },
      {
        name: 'Sofa Bangku 3 Dudukan',
        dims: { w: 165, h: 92 },
        opts: { sandaran: 'Panel Solid', ukiran: 'Polos', bantalan: 'Pakai Jok', warnaKain: 'sage', armrest: true },
      },
    ],
    opts: [
      { key: 'sandaran', label: 'Model Sandaran', kind: 'choice', choices: ['Jeruji', 'Panel Solid', 'Anyaman Rotan'], def: 'Jeruji' },
      { key: 'ukiran', label: 'Gaya Ukiran', kind: 'choice', choices: ['Polos', 'Ukiran Jepara'], def: 'Polos' },
      { key: 'bantalan', label: 'Bantalan / Jok Busa', kind: 'choice', choices: ['Tanpa Jok', 'Pakai Jok'], def: 'Pakai Jok' },
      { key: 'warnaKain', label: 'Warna Kain Jok', kind: 'swatch', choices: CUSHION_COLORS, def: 'krem', showIf: (o) => o.bantalan === 'Pakai Jok' },
      { key: 'armrest', label: 'Pakai sandaran tangan (Armrest)', kind: 'toggle', def: false },
    ],
  },

  lemari: {
    label: 'Lemari',
    name: 'Lemari Jati',
    group: 'Kamar & Penyimpanan',
    tagline: 'Lemari pakaian, lemari hias kaca, hingga lemari bawah tangga.',
    dims: [
      ['w', 'Lebar Total', 90, 260, 155],
      ['h', 'Tinggi Total', 160, 240, 205],
      ['d', 'Kedalaman', 45, 70, 58],
    ],
    presets: [
      {
        name: 'Lemari 2 Pintu Minimalis',
        dims: { w: 110, h: 200, d: 55 },
        opts: { pintu: '2', mekanisme: 'Buka Biasa', ukiran: 'Minimalis', cermin: false, laci: true },
      },
      {
        name: 'Lemari 3 Pintu Sliding',
        dims: { w: 180, h: 215, d: 60 },
        opts: { pintu: '3', mekanisme: 'Geser (Sliding)', ukiran: 'Minimalis', cermin: true, laci: false },
      },
      {
        name: 'Lemari 3 Pintu Ukir Jepara',
        dims: { w: 175, h: 220, d: 60 },
        opts: { pintu: '3', mekanisme: 'Buka Biasa', ukiran: 'Ukiran Jepara', cermin: true, laci: true },
      },
    ],
    opts: [
      { key: 'pintu', label: 'Jumlah Pintu', kind: 'choice', choices: ['2', '3', '4'], def: '3', suffix: ' Pintu' },
      { key: 'mekanisme', label: 'Tipe Pintu', kind: 'choice', choices: ['Buka Biasa', 'Geser (Sliding)'], def: 'Buka Biasa' },
      { key: 'ukiran', label: 'Gaya & Ukiran', kind: 'choice', choices: ['Minimalis', 'Ukiran Jepara'], def: 'Minimalis' },
      { key: 'cermin', label: 'Pasang cermin di pintu tengah', kind: 'toggle', def: true },
      { key: 'laci', label: 'Tambahkan laci di bagian bawah', kind: 'toggle', def: true },
    ],
  },

  kamar: {
    label: 'Kamar Set',
    name: 'Set Kamar Tidur Jati',
    group: 'Kamar & Penyimpanan',
    tagline: 'Pilih ukuran kasur, gaya kepala ranjang, dan kelengkapan kamar.',
    dims: [],
    presets: [
      {
        name: 'Kamar Minimalis (Queen)',
        dims: {},
        opts: { kasur: '160', headboard: 'Minimalis', nakas: true, lemari: true, rias: false, laciDipan: false },
      },
      {
        name: 'Kamar Utama Ukir Jepara',
        dims: {},
        opts: { kasur: '180', headboard: 'Ukiran Jepara', nakas: true, lemari: true, rias: true, laciDipan: true },
      },
      {
        name: 'Kamar Anak / Tamu',
        dims: {},
        opts: { kasur: '120', headboard: 'Busa Jok', nakas: true, lemari: false, rias: false, laciDipan: true },
      },
    ],
    opts: [
      { key: 'kasur', label: 'Ukuran Kasur', kind: 'choice', choices: ['120', '160', '180', '200'], def: '160', suffix: ' × 200 cm' },
      { key: 'headboard', label: 'Gaya Kepala Ranjang', kind: 'choice', choices: ['Minimalis', 'Busa Jok', 'Ukiran Jepara'], def: 'Minimalis' },
      { key: 'nakas', label: 'Nakas kanan & kiri (2 × 45 cm)', kind: 'toggle', def: true },
      { key: 'lemari', label: 'Sertakan Lemari Pakaian Jati (±120 cm)', kind: 'toggle', def: true },
      { key: 'rias', label: 'Sertakan Meja Rias + Cermin (±90 cm)', kind: 'toggle', def: false },
      { key: 'laciDipan', label: 'Tambahkan laci penyimpanan di bawah dipan', kind: 'toggle', def: false },
    ],
  },

  buffet: {
    label: 'Buffet & Rak TV',
    name: 'Buffet / Backdrop TV Jati',
    group: 'Dapur & Ruang Keluarga',
    tagline: 'Meja TV minimalis, backdrop dinding ruang keluarga, hingga buffet pajangan.',
    dims: [
      ['w', 'Panjang Buffet', 120, 300, 180],
      ['h', 'Tinggi Total', 50, 210, 68],
      ['d', 'Kedalaman', 38, 60, 45],
    ],
    presets: [
      {
        name: 'Meja TV Minimalis 180 cm',
        dims: { w: 180, h: 60, d: 45 },
        opts: { model: 'Buffet TV Rendah', ukiran: 'Minimalis', rakPajang: false },
      },
      {
        name: 'Backdrop TV + Kisi Jati',
        dims: { w: 240, h: 200, d: 45 },
        opts: { model: 'Backdrop TV + Rak', ukiran: 'Minimalis', rakPajang: true },
      },
      {
        name: 'Buffet Ukir Jepara Klasik',
        dims: { w: 200, h: 85, d: 50 },
        opts: { model: 'Buffet TV Rendah', ukiran: 'Ukiran Jepara', rakPajang: false },
      },
    ],
    opts: [
      { key: 'model', label: 'Model Buffet', kind: 'choice', choices: ['Buffet TV Rendah', 'Backdrop TV + Rak'], def: 'Buffet TV Rendah' },
      { key: 'ukiran', label: 'Gaya & Ukiran', kind: 'choice', choices: ['Minimalis', 'Ukiran Jepara'], def: 'Minimalis' },
      { key: 'rakPajang', label: 'Tambahkan rak pajangan samping', kind: 'toggle', def: false },
    ],
  },

  partisi: {
    label: 'Pintu & Partisi',
    name: 'Pintu / Partisi Jati',
    group: 'Interior & Bangunan',
    tagline: 'Pintu utama rumah kupu tarung, kusen jati, atau penyekat ruangan kisi-kisi.',
    dims: [
      ['w', 'Lebar Total', 80, 320, 160],
      ['h', 'Tinggi Total', 200, 280, 225],
    ],
    presets: [
      {
        name: 'Pintu Utama 2 Daun Ukir',
        dims: { w: 160, h: 225 },
        opts: { model: 'Pintu 2 Daun', ukiran: 'Ukiran Jepara', kisi: false },
      },
      {
        name: 'Partisi Kisi-Kisi Ruang',
        dims: { w: 220, h: 240 },
        opts: { model: 'Partisi Penyekat', ukiran: 'Minimalis', kisi: true },
      },
      {
        name: 'Pintu Kamar Minimalis',
        dims: { w: 90, h: 215 },
        opts: { model: 'Pintu 1 Daun', ukiran: 'Minimalis', kisi: false },
      },
    ],
    opts: [
      { key: 'model', label: 'Jenis Konstruksi', kind: 'choice', choices: ['Pintu 2 Daun', 'Pintu 1 Daun', 'Partisi Penyekat'], def: 'Pintu 2 Daun' },
      { key: 'ukiran', label: 'Gaya & Ukiran', kind: 'choice', choices: ['Minimalis', 'Ukiran Jepara'], def: 'Ukiran Jepara' },
      { key: 'kisi', label: 'Kombinasi kisi-kisi / rak pajang', kind: 'toggle', def: false },
    ],
  },

  cermin: {
    label: 'Cermin & Rias',
    name: 'Cermin / Meja Rias Jati',
    group: 'Kamar & Penyimpanan',
    tagline: 'Cermin dinding, cermin berdiri full-body, atau meja rias jati.',
    dims: [
      ['w', 'Lebar', 45, 140, 75],
      ['h', 'Tinggi', 60, 200, 160],
    ],
    presets: [
      {
        name: 'Standing Full Body',
        dims: { w: 68, h: 175 },
        opts: { pemasangan: 'Berdiri (Standing)', bentuk: 'Lengkung (Arch)', ukiran: 'Polos Minimalis', led: true },
      },
      {
        name: 'Cermin Dinding Ukir Jepara',
        dims: { w: 85, h: 115 },
        opts: { pemasangan: 'Dinding', bentuk: 'Oval', ukiran: 'Ukiran Jepara', led: false },
      },
      {
        name: 'Meja Rias + Cermin',
        dims: { w: 90, h: 145 },
        opts: { pemasangan: 'Meja Rias', bentuk: 'Lengkung (Arch)', ukiran: 'Ukiran Jepara', led: true },
      },
    ],
    opts: [
      { key: 'pemasangan', label: 'Model Pemasangan', kind: 'choice', choices: ['Dinding', 'Berdiri (Standing)', 'Meja Rias'], def: 'Berdiri (Standing)' },
      { key: 'bentuk', label: 'Bentuk Bingkai', kind: 'choice', choices: ['Persegi', 'Lengkung (Arch)', 'Oval'], def: 'Lengkung (Arch)' },
      { key: 'ukiran', label: 'Gaya Bingkai', kind: 'choice', choices: ['Polos Minimalis', 'Ukiran Jepara'], def: 'Ukiran Jepara' },
      { key: 'led', label: 'Lampu LED hangat di belakang cermin', kind: 'toggle', def: false },
    ],
  },

  lainnya: {
    label: 'Bebas Request',
    name: 'Custom Khusus (Apa Saja)',
    group: 'Bebas Request',
    tagline: 'Mimbar/podium, gazebo, meja kafe/kasir, rak buku, dipan tingkat, tangga jati, atau model apa saja — pratinjau otomatis menyesuaikan replikanya!',
    dims: [
      ['w', 'Panjang / Lebar', 45, 450, 110],
      ['d', 'Kedalaman', 35, 300, 95],
      ['h', 'Tinggi', 50, 320, 145],
    ],
    presets: [
      {
        name: 'Mimbar / Podium Jati',
        dims: { w: 110, d: 95, h: 145 },
        opts: { jenisBebas: 'Mimbar Masjid / Podium Jati', gaya: 'Ukiran Jepara' },
      },
      {
        name: 'Meja Kasir / Bar Kafe',
        dims: { w: 200, d: 68, h: 108 },
        opts: { jenisBebas: 'Meja Kasir / Bar Kafe', gaya: 'Minimalis Modern' },
      },
      {
        name: 'Gazebo Taman Jati',
        dims: { w: 260, d: 260, h: 280 },
        opts: { jenisBebas: 'Gazebo Taman Kayu Jati', gaya: 'Ukiran Jepara' },
      },
      {
        name: 'Rak Buku / Display Tinggi',
        dims: { w: 140, d: 42, h: 205 },
        opts: { jenisBebas: 'Rak Buku & Display Jati', gaya: 'Minimalis Modern' },
      },
      {
        name: 'Dipan Tingkat Jati',
        dims: { w: 205, d: 105, h: 185 },
        opts: { jenisBebas: 'Dipan Tingkat / Ranjang Susun Jati', gaya: 'Minimalis Modern' },
      },
      {
        name: 'Tangga & Railing Jati',
        dims: { w: 240, d: 100, h: 220 },
        opts: { jenisBebas: 'Tangga & Railing Kayu Jati', gaya: 'Klasik Profil' },
      },
    ],
    opts: [
      {
        key: 'jenisBebas',
        label: 'Nama furnitur yang ingin dibuat',
        kind: 'text',
        placeholder: 'Contoh: Mimbar Podium, Gazebo 2x2m, Meja Kasir Kafe, Rak Buku, Dipan Tingkat, Tangga Jati...',
        def: 'Mimbar Masjid / Podium Jati',
      },
      { key: 'gaya', label: 'Gaya Pengerjaan', kind: 'choice', choices: ['Minimalis Modern', 'Klasik Profil', 'Ukiran Jepara'], def: 'Ukiran Jepara' },
    ],
  },
};

export const CUSTOM_TYPE_KEYS = Object.keys(TYPES);

export const CUSTOM_CATEGORIES = [
  'Semua',
  ...CUSTOM_TYPE_KEYS.map((k) => TYPES[k].label),
];

export const defaultsFor = (type) => ({
  dims: Object.fromEntries(TYPES[type].dims.map(([k, , , , def]) => [k, def])),
  opts: Object.fromEntries(TYPES[type].opts.map((o) => [o.key, o.def])),
});

export function getKamarLayout(opts) {
  const bw = Number(opts?.kasur || 160);
  const headH = opts?.headboard === 'Ukiran Jepara' ? 132 : 114;
  const items = [];
  if (opts?.rias) items.push({ k: 'rias', label: 'Rias', w: 90, h: 155 });
  if (opts?.nakas) items.push({ k: 'nakas', label: 'Nakas', w: 45, h: 54 });
  items.push({ k: 'bed', label: 'Ranjang', w: bw + 14, h: headH });
  if (opts?.nakas) items.push({ k: 'nakas', label: 'Nakas', w: 45, h: 54 });
  if (opts?.lemari) items.push({ k: 'lemari', label: 'Lemari', w: 120, h: 195 });
  const gap = 8;
  const totalWidth = items.reduce((sum, it) => sum + it.w, 0) + gap * Math.max(0, items.length - 1);
  const maxHeight = Math.max(...items.map((it) => it.h));
  return { bw, headH, items, gap, totalWidth, maxHeight };
}

export function getKoyoDesignTip({ type, dims, opts, finish }) {
  const finName = FINISHES.find((f) => f.key === finish)?.label ?? 'Natural Jati';

  if (type === 'kitchen') {
    return `Kitchen set jati solid sepanjang ${dims.w} cm (${opts.bentuk}) tahan rayap & lembap bertahun-tahun! Jangan lupa siapkan foto/denah dapurmu untuk dikirim ke Pak Nanang ya.`;
  }
  if (type === 'meja') {
    const seats = dims.w >= 210 ? '8 orang' : dims.w >= 170 ? '6 orang' : dims.w >= 120 ? '4 orang' : '2 orang';
    return opts.ukiran === 'Ukiran Jepara'
      ? `Meja ${dims.w} cm ini muat sekitar ${seats} — ukiran Jepara dengan warna ${finName} bakal bikin ruang makan terlihat mewah banget!`
      : `Ukuran ${dims.w} × ${dims.d} cm pas untuk ${seats}. Simpel, rapi, dan awet dipakai bertahun-tahun.`;
  }
  if (type === 'kursi') {
    return opts.ukiran === 'Ukiran Jepara'
      ? `Ukiran Jepara di mahkota & sandaran kursi bikin ruang tamu terasa elegan khas kayu jati solid.`
      : `Model ${opts.sandaran.toLowerCase()}${opts.armrest ? ' dengan sandaran tangan' : ''} nyaman untuk duduk lama.`;
  }
  if (type === 'lemari') {
    return opts.mekanisme === 'Geser (Sliding)'
      ? `Pintu geser (sliding) hemat tempat buat kamar yang tidak terlalu luas! Klik tab "Tata Dalam" untuk cek isi lemarinya.`
      : `Lemari ${opts.pintu} pintu lebar ${dims.w} cm ini lega buat baju gantung & lipat. Klik tab "Tata Dalam" untuk lihat sekatnya.`;
  }
  if (type === 'buffet') {
    return opts.model === 'Backdrop TV + Rak'
      ? `Backdrop TV panjang ${dims.w} cm warna ${finName} bikin ruang keluarga langsung rapi dan berkelas — kabel TV juga bisa disembunyikan di belakang panel!`
      : `Buffet panjang ${dims.w} cm kokoh menopang TV ukuran besar dan punya ruang simpan rapi di bawah.`;
  }
  if (type === 'partisi') {
    return opts.model === 'Partisi Penyekat'
      ? `Partisi kisi-kisi jati lebar ${dims.w} cm memisahkan ruangan tetap terang dan sirkulasi udara lancar!`
      : `Pintu kayu jati solid warna ${finName} anti muai-susut berlebihan dan memberi kesan megah di fasad rumah.`;
  }
  if (type === 'cermin') {
    return opts.ukiran === 'Ukiran Jepara'
      ? `Bingkai ukiran Jepara${opts.led ? ' + lampu LED hangat' : ''} langsung bikin dinding kamar jadi pusat perhatian!`
      : `Model ${opts.bentuk.toLowerCase()} warna ${finName} simpel tapi tetap berkelas.`;
  }
  if (type === 'lainnya') {
    const nama = (opts.jenisBebas || 'furnitur khususmu').trim();
    return `Apa pun modelnya—termasuk ${nama}—bisa kami kerjakan dari kayu jati solid! Lampirkan foto atau sketsa contoh agar Pak Nanang bisa hitung detailnya ya.`;
  }
  const labelKasur = { '120': 'Single', '160': 'Queen', '180': 'King', '200': 'Super King' }[opts.kasur] || '';
  const { totalWidth, items } = getKamarLayout(opts);
  const meter = (totalWidth / 100).toFixed(1).replace('.', ',');
  return items.length > 1
    ? `Set kamar ${labelKasur} warna ${finName} ini total lebar jejerannya ±${totalWidth} cm (${meter} m). Kalau kamarmu lebih ringkas, lemari atau meja rias bisa diletakkan di sisi dinding lain!`
    : `Dipan ${labelKasur} (kasur ${opts.kasur}×200 cm, rangka ±${totalWidth} cm) warna ${finName} — kokoh dari jati solid, bisa pakai sistem tabung juga!`;
}

export function describeSpec({ type, dims, opts, finish, sheen = 'doff' }) {
  const t = TYPES[type] || TYPES.meja;
  const finObj = FINISHES.find((f) => f.key === finish);
  const sheenObj = SHEENS.find((s) => s.key === sheen);
  const fin = `${finObj?.label ?? finish} (${sheenObj?.label ?? sheen})`;

  let size = '';
  if (type === 'meja' || type === 'lainnya') size = `P ${dims.w} × L ${dims.d} × T ${dims.h} cm`;
  else if (type === 'kitchen' || type === 'buffet') size = `P ${dims.w} × T ${dims.h} × D ${dims.d} cm`;
  else if (type === 'kursi' || type === 'cermin' || type === 'partisi') size = `L ${dims.w} × T ${dims.h} cm`;
  else if (type === 'lemari') size = `L ${dims.w} × T ${dims.h} × D ${dims.d} cm`;
  else {
    const { totalWidth, items } = getKamarLayout(opts);
    size =
      items.length > 1
        ? `Kasur ${opts.kasur} × 200 cm · Total bentang ±${totalWidth} cm`
        : `Kasur ${opts.kasur} × 200 cm (rangka ±${totalWidth} × 210 cm)`;
  }

  const picks = [];
  t.opts.forEach((o) => {
    if (o.showIf && !o.showIf(opts)) return;
    if (o.kind === 'toggle') {
      if (opts[o.key]) {
        picks.push(
          o.label
            .replace(/^Sertakan\s+/i, '')
            .replace(/^Tambahkan\s+/i, '')
            .replace(/^Pakai\s+/i, '')
            .replace(/^Pasang\s+/i, ''),
        );
      }
    } else if (o.kind === 'swatch') {
      const sw = o.choices.find((c) => c.key === opts[o.key]);
      if (sw) picks.push(`Jok warna ${sw.label}`);
    } else if (o.kind === 'text') {
      if (opts[o.key]) picks.push(`${opts[o.key]}`);
    } else if (o.key !== 'kasur') {
      picks.push(`${o.label}: ${opts[o.key]}${o.suffix ?? ''}`);
    }
  });

  const title =
    type === 'lainnya' && opts.jenisBebas?.trim()
      ? opts.jenisBebas.trim()
      : t.name;

  return {
    title,
    categoryLabel: t.label,
    size,
    finish: fin,
    options: picks.length ? picks.join(' · ') : 'Standar',
    detailsList: picks,
  };
}

export const minDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + MIN_DAYS);
  return d.toISOString().slice(0, 10);
};
