import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

export default function Modal({ title, onClose, children, maxWidth = 'max-w-md' }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[90] flex items-end justify-center bg-espresso/60 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      role="dialog" aria-modal="true" aria-label={title}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }}
        transition={{ duration: 0.25 }}
        className={`relative max-h-[90dvh] w-full ${maxWidth} overflow-y-auto rounded-t-3xl border border-gold/30 bg-white p-5 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] shadow-lift sm:rounded-3xl sm:p-6`}
      >
        <div className="gold-divider -mx-5 -mt-5 mb-5 sm:-mx-6 sm:-mt-6" aria-hidden="true" />
        <button onClick={onClose} className="absolute right-3.5 top-3.5 rounded-full p-2 text-muted transition hover:bg-sand hover:text-espresso" aria-label="Tutup">
          <X size={20} />
        </button>
        <h2 className="font-heading pr-8 text-2xl font-bold text-espresso">{title}</h2>
        <div className="mt-4">{children}</div>
      </motion.div>
    </motion.div>
  );
}
