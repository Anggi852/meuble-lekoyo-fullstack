import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '../../context/AppContext';
import FormModal from '../../components/FormModal';
import { AddButton, PageHeader, RowActions, confirmDelete } from '../../components/admin/ui';

const fields = [
  { name: 'name', label: 'Nama pelanggan', required: true },
  { name: 'city', label: 'Kota asal', required: true },
  { name: 'text', label: 'Isi testimoni', type: 'textarea', required: true },
];

export default function Testimonials() {
  const { testimonials, saveTestimonial, removeTestimonial } = useApp();
  const [modal, setModal] = useState(null);
  const submit = (v) => { saveTestimonial(v); setModal(null); toast.success(v.id ? 'Perubahan disimpan' : 'Testimoni ditambahkan'); };

  return (
    <div>
      <PageHeader title="Testimoni" desc="Tampil di beranda untuk membangun kepercayaan pembeli luar daerah. Disarankan minimal 5." action={<AddButton onClick={() => setModal({ name: '', city: '', text: '' })}>Tambah testimoni</AddButton>} />
      {testimonials.length < 5 && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-gold/50 bg-white p-4"><AlertTriangle size={20} className="mt-0.5 shrink-0 text-gold" /><p className="text-[15px]">Saat ini baru {testimonials.length} testimoni. Tambahkan {5 - testimonials.length} lagi agar mencapai 5.</p></div>
      )}
      <div className="space-y-3">
        {testimonials.map((t) => (
          <div key={t.id} className="luxury-panel flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
            <div><p className="font-semibold">{t.name} <span className="font-normal text-muted">· {t.city}</span></p><p className="mt-1 text-[15px] text-muted">"{t.text}"</p></div>
            <RowActions name={t.name} onEdit={() => setModal(t)} onDelete={() => confirmDelete(t.name, () => removeTestimonial(t.id))} />
          </div>
        ))}
      </div>
      <AnimatePresence>{modal && <FormModal title={modal.id ? 'Ubah testimoni' : 'Tambah testimoni'} fields={fields} initial={modal} onClose={() => setModal(null)} onSubmit={submit} />}</AnimatePresence>
    </div>
  );
}
