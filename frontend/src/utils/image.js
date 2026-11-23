// Helper gambar adaptif lintas perangkat & manajemen multi-foto produk.
// Mendukung URL eksternal (Unsplash multi-resolusi) maupun foto upload langsung (data URL).

const UNSPLASH_RE = /images\.unsplash\.com/i;

export const ANGLE_PRESETS = [
  'Tampak Depan',
  'Tampak Samping',
  'Tampak Belakang',
  'Detail Kayu / Ukiran',
];

export function resizeImageUrl(url, width = 800, quality = 80) {
  if (!url || typeof url !== 'string') return '';
  if (url.startsWith('data:') || url.startsWith('blob:') || !UNSPLASH_RE.test(url)) return url;
  try {
    const u = new URL(url);
    u.searchParams.set('w', String(width));
    u.searchParams.set('q', String(quality));
    u.searchParams.set('auto', 'format');
    u.searchParams.set('fit', 'crop');
    return u.toString();
  } catch {
    return url;
  }
}

export function buildImageSrcSet(url, widths = [400, 640, 960, 1280]) {
  if (!url || typeof url !== 'string') return undefined;
  if (url.startsWith('data:') || url.startsWith('blob:') || !UNSPLASH_RE.test(url)) return undefined;
  return widths.map((w) => `${resizeImageUrl(url, w)} ${w}w`).join(', ');
}

// Normalisasi daftar foto produk (mendukung format baru `images: [{url, label}]` maupun lama `image: string`)
export function getProductImages(product) {
  if (!product) return [];
  if (Array.isArray(product.images) && product.images.length > 0) {
    return product.images
      .map((item, idx) =>
        typeof item === 'string'
          ? { url: item, label: ANGLE_PRESETS[idx] || `Foto ${idx + 1}` }
          : { url: item?.url || '', label: item?.label || ANGLE_PRESETS[idx] || `Foto ${idx + 1}` },
      )
      .filter((x) => Boolean(x.url));
  }
  if (product.image) {
    return [{ url: product.image, label: 'Tampak Depan' }];
  }
  return [];
}

export function getPrimaryImage(product) {
  return getProductImages(product)[0]?.url || '/toko-mobile.jpg';
}

// Kompresi foto langsung di browser saat owner mengunggah dari galeri HP/laptop
// agar hemat memori & tersimpan mulus di penyimpanan lokal maupun saat dikirim ke backend nanti.
export function compressImageFile(file, { maxWidth = 960, maxHeight = 960, quality = 0.78 } = {}) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type?.startsWith('image/')) {
      reject(new Error('File harus berupa gambar (JPG, PNG, atau WebP).'));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca file gambar.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Format gambar tidak dapat diproses.'));
      img.onload = () => {
        let { width, height } = img;
        const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#FAF6F0';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
