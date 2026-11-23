import { useState } from 'react';
import { ImagePlus, Star, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ANGLE_PRESETS, compressImageFile } from '../../utils/image';

export default function PhotoUploader({ value = [], onChange, max = 4 }) {
  const [busy, setBusy] = useState(false);
  const list = Array.isArray(value) ? value : [];

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;

    const remaining = max - list.length;
    if (remaining <= 0) {
      toast.error(`Maksimal ${max} foto per produk.`);
      return;
    }

    setBusy(true);
    const added = [];
    for (const file of files.slice(0, remaining)) {
      if (!file.type.startsWith('image/')) {
        toast.error(`"${file.name}" bukan file gambar.`);
        continue;
      }
      if (file.size > 12 * 1024 * 1024) {
        toast.error(`"${file.name}" terlalu besar (maks. 12 MB).`);
        continue;
      }
      try {
        const dataUrl = await compressImageFile(file);
        const nextIdx = list.length + added.length;
        added.push({
          url: dataUrl,
          label: ANGLE_PRESETS[nextIdx] || `Foto ${nextIdx + 1}`,
        });
      } catch (err) {
        toast.error(err.message || `Gagal memproses "${file.name}"`);
      }
    }
    setBusy(false);

    if (added.length > 0) {
      onChange([...list, ...added]);
      toast.success(`${added.length} foto berhasil ditambahkan`);
    }
  };

  const removeAt = (idx) => {
    onChange(list.filter((_, i) => i !== idx));
  };

  const makePrimary = (idx) => {
    if (idx === 0) return;
    const picked = list[idx];
    const rest = list.filter((_, i) => i !== idx);
    onChange([picked, ...rest]);
    toast.success('Dijadikan foto utama');
  };

  const updateLabel = (idx, label) => {
    onChange(list.map((item, i) => (i === idx ? { ...item, label } : item)));
  };

  return (
    <div className="space-y-3">
      {/* Grid pratinjau foto yang sudah diunggah */}
      {list.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {list.map((item, idx) => (
            <div
              key={`${idx}-${item.url.slice(0, 32)}`}
              className={`overflow-hidden rounded-2xl border bg-cream/60 ${
                idx === 0 ? 'border-gold ring-1 ring-gold/40' : 'border-line'
              }`}
            >
              <div className="relative aspect-[4/3] bg-sand">
                <img src={item.url} alt={item.label} className="h-full w-full object-cover" />
                {idx === 0 ? (
                  <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-espresso/85 px-2.5 py-0.5 text-[10px] font-bold text-gold-light backdrop-blur-sm">
                    <Star size={10} fill="currentColor" /> Foto Utama
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => makePrimary(idx)}
                    className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-espresso shadow-soft transition hover:bg-gold"
                    title="Jadikan foto sampul utama"
                  >
                    <Star size={10} /> Jadikan Utama
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeAt(idx)}
                  aria-label={`Hapus ${item.label}`}
                  className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-espresso/80 text-white transition hover:bg-red-600"
                >
                  <X size={13} />
                </button>
              </div>
              <div className="p-2">
                <select
                  aria-label={`Sudut foto ${idx + 1}`}
                  value={ANGLE_PRESETS.includes(item.label) ? item.label : ANGLE_PRESETS[0]}
                  onChange={(e) => updateLabel(idx, e.target.value)}
                  className="w-full rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs font-semibold text-bark focus:border-gold focus:outline-none"
                >
                  {ANGLE_PRESETS.map((preset) => (
                    <option key={preset} value={preset}>
                      {preset}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tombol Input / Upload Foto Langsung dari Galeri HP atau Laptop */}
      {list.length < max && (
        <label
          className={`flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-gold/45 bg-cream/70 px-4 py-5 text-center transition hover:border-teak hover:bg-sand/50 ${
            busy ? 'pointer-events-none opacity-65' : ''
          }`}
        >
          {busy ? (
            <Loader2 size={22} className="animate-spin text-teak" />
          ) : (
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-teak shadow-soft">
              <ImagePlus size={20} />
            </span>
          )}
          <span className="text-sm font-bold text-espresso">
            {busy ? 'Memproses foto...' : list.length === 0 ? 'Upload Foto Produk dari Galeri / Perangkat' : `Tambah Foto Lainnya (${list.length}/${max})`}
          </span>
          <span className="text-xs text-muted">
            Bisa pilih langsung 1–{max} foto (tampak depan, samping, belakang, detail kayu)
          </span>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFiles}
            className="sr-only"
          />
        </label>
      )}
    </div>
  );
}
