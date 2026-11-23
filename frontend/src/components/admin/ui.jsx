import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export const AddButton = ({ onClick, children }) => (
  <button onClick={onClick} className="btn-primary btn-shimmer !min-h-[44px] text-sm">
    <Plus size={17} className="text-gold-light" /> {children}
  </button>
);

export function RowActions({ onEdit, onDelete, name }) {
  return (
    <div className="flex gap-2">
      {onEdit && (
        <button
          onClick={onEdit}
          className="btn-soft !min-h-[40px] !px-3.5 !py-2 text-sm"
          aria-label={`Ubah ${name}`}
        >
          <Pencil size={15} /> Ubah
        </button>
      )}
      <button
        onClick={onDelete}
        className="btn !min-h-[40px] border border-red-200 !bg-red-50/90 !px-3.5 !py-2 text-sm text-red-700 hover:!bg-red-100"
        aria-label={`Hapus ${name}`}
      >
        <Trash2 size={15} /> Hapus
      </button>
    </div>
  );
}

export function PageHeader({ title, desc, action, kicker = 'Manajemen Galeri' }) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4 border-b border-gold/25 pb-5">
      <div>
        <span className="kicker">{kicker}</span>
        <h1 className="font-heading mt-1 text-3xl font-bold text-espresso">{title}</h1>
        {desc && <p className="mt-1.5 max-w-2xl text-[15px] text-muted">{desc}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({ icon: Icon, value, label, small = false, accent = false }) {
  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border p-4 sm:p-5 transition duration-300 hover:-translate-y-0.5 hover:shadow-lift ${
        accent
          ? 'luxury-dark border-gold/45 text-cream shadow-lift'
          : 'border-line/90 bg-white/95 text-espresso shadow-soft hover:border-gold/55'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={`grid h-11 w-11 place-items-center rounded-xl border ${
            accent
              ? 'border-gold/40 bg-gold/15 text-gold-light'
              : 'border-gold/25 bg-sand/80 text-teak transition group-hover:bg-espresso group-hover:text-gold-light'
          }`}
        >
          <Icon size={21} />
        </span>
      </div>
      <p
        className={`font-heading mt-4 break-words font-bold leading-tight ${
          small ? 'text-lg sm:text-2xl' : 'text-2xl sm:text-3xl'
        } ${accent ? 'text-gold-light' : 'text-espresso'}`}
      >
        {value}
      </p>
      <p className={`mt-1.5 text-sm font-medium ${accent ? 'text-cream/75' : 'text-muted'}`}>{label}</p>
    </div>
  );
}

export const confirmDelete = (label, fn) => {
  if (window.confirm(`Hapus "${label}"? Tindakan ini tidak bisa dibatalkan.`)) {
    fn();
    toast.success('Berhasil dihapus');
  }
};
