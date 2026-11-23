import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useApp } from '../../context/AppContext';
import FormModal from '../../components/FormModal';
import { AddButton, PageHeader, RowActions, confirmDelete } from '../../components/admin/ui';

const fields = [
  { name: 'title', label: 'Judul singkat (tombol di chat)', required: true, placeholder: 'Contoh: Sistem tabung' },
  { name: 'question', label: 'Pertanyaan', required: true },
  { name: 'answer', label: 'Jawaban', type: 'textarea', required: true },
];

export default function Faqs() {
  const { faqs, saveFaq, removeFaq } = useApp();
  const [modal, setModal] = useState(null);
  const submit = (v) => { saveFaq(v); setModal(null); toast.success(v.id ? 'Perubahan disimpan' : 'FAQ ditambahkan'); };

  return (
    <div>
      <PageHeader title="FAQ" desc="Jawaban di sini dipakai chat asisten dan ditampilkan di beranda website." action={<AddButton onClick={() => setModal({ title: '', question: '', answer: '' })}>Tambah FAQ</AddButton>} />
      <div className="space-y-3">
        {faqs.map((f) => (
          <div key={f.id} className="luxury-panel flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
            <div><p className="text-sm font-semibold text-wood">{f.title}</p><p className="mt-0.5 font-semibold">{f.question}</p><p className="mt-1 text-[15px] text-muted">{f.answer}</p></div>
            <RowActions name={f.title} onEdit={() => setModal(f)} onDelete={() => confirmDelete(f.title, () => removeFaq(f.id))} />
          </div>
        ))}
      </div>
      <AnimatePresence>{modal && <FormModal title={modal.id ? 'Ubah FAQ' : 'Tambah FAQ'} fields={fields} initial={modal} onClose={() => setModal(null)} onSubmit={submit} />}</AnimatePresence>
    </div>
  );
}
