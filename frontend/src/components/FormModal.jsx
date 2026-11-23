import { useState } from 'react';
import Modal from './Modal';
import PhotoUploader from './admin/PhotoUploader';

// Formulir tambah/ubah data yang dipakai di Dashboard Owner.
// fields: [{ name, label, type: 'text'|'number'|'textarea'|'select'|'checkbox'|'photos', required, options, hint, placeholder, max }]
export default function FormModal({ title, fields, initial, onSubmit, onClose }) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState({});

  const set = (name, value) => {
    setValues((v) => ({ ...v, [name]: value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: undefined }));
  };

  const submit = (e) => {
    e.preventDefault();
    const next = {};
    fields.forEach((f) => {
      const v = values[f.name];
      if (f.type === 'photos') {
        if (f.required && (!Array.isArray(v) || v.length === 0)) {
          next[f.name] = 'Unggah minimal 1 foto produk';
        }
      } else if (f.required && (v === undefined || v === null || String(v).trim() === '')) {
        next[f.name] = `${f.label} wajib diisi`;
      } else if (f.type === 'number' && v !== '' && Number(v) <= 0) {
        next[f.name] = `${f.label} harus lebih dari 0`;
      }
    });
    setErrors(next);
    if (Object.keys(next).length) return;
    const clean = { ...values };
    fields.forEach((f) => {
      if (f.type === 'number') clean[f.name] = Number(clean[f.name]);
      if (typeof clean[f.name] === 'string') clean[f.name] = clean[f.name].trim();
    });
    onSubmit(clean);
  };

  return (
    <Modal title={title} onClose={onClose} maxWidth="max-w-lg">
      <form onSubmit={submit} className="space-y-4" noValidate>
        {fields.map((f) => (
          <div key={f.name}>
            {f.type === 'checkbox' ? (
              <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-cream p-3.5">
                <input
                  type="checkbox"
                  checked={!!values[f.name]}
                  onChange={(e) => set(f.name, e.target.checked)}
                  className="h-5 w-5 accent-teak"
                />
                <span className="text-[15px] font-medium">{f.label}</span>
              </label>
            ) : f.type === 'photos' ? (
              <>
                <p className="mb-2 text-[15px] font-semibold text-espresso">
                  {f.label}
                  {f.required && <span className="text-red-600"> *</span>}
                </p>
                <PhotoUploader
                  value={values[f.name] || []}
                  onChange={(nextList) => set(f.name, nextList)}
                  max={f.max || 4}
                />
                {f.hint && <p className="mt-1.5 text-xs text-muted">{f.hint}</p>}
              </>
            ) : (
              <>
                <label htmlFor={`f-${f.name}`} className="mb-1.5 block text-[15px] font-medium">
                  {f.label}
                  {f.required && <span className="text-red-600"> *</span>}
                </label>
                {f.type === 'textarea' ? (
                  <textarea
                    id={`f-${f.name}`}
                    rows={4}
                    value={values[f.name] ?? ''}
                    onChange={(e) => set(f.name, e.target.value)}
                    placeholder={f.placeholder}
                    className="field"
                  />
                ) : f.type === 'select' ? (
                  <select
                    id={`f-${f.name}`}
                    value={values[f.name] ?? ''}
                    onChange={(e) => set(f.name, e.target.value)}
                    className="field"
                  >
                    {f.options.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    id={`f-${f.name}`}
                    type={f.type || 'text'}
                    min={f.type === 'number' ? 1 : undefined}
                    value={values[f.name] ?? ''}
                    onChange={(e) => set(f.name, e.target.value)}
                    placeholder={f.placeholder}
                    className="field"
                  />
                )}
                {f.hint && <p className="mt-1.5 text-sm text-muted">{f.hint}</p>}
              </>
            )}
            {errors[f.name] && (
              <p className="mt-1.5 text-sm font-medium text-red-600" role="alert">
                {errors[f.name]}
              </p>
            )}
          </div>
        ))}
        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="btn-outline">
            Batal
          </button>
          <button type="submit" className="btn-primary">
            Simpan
          </button>
        </div>
      </form>
    </Modal>
  );
}
