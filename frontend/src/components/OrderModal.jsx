import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Loader2, MessageCircle, ShieldCheck } from 'lucide-react';
import Modal from './Modal';
import { buildWhatsAppLink } from '../services/whatsapp';
import { formatRupiah } from '../utils/format';
import { getPrimaryImage } from '../utils/image';
import { ID_PHONE_REGEX, normalizePhone } from '../utils/phone';
import { toast } from 'sonner';
import { useApp } from '../context/AppContext';

const schema = yup.object({
  name: yup.string().trim().min(2, 'Nama minimal 2 huruf').required('Nama wajib diisi'),
  phone: yup
    .string()
    .trim()
    .matches(ID_PHONE_REGEX, 'Gunakan nomor WhatsApp Indonesia yang valid (contoh: 081234567890)')
    .required('Nomor WhatsApp aktif wajib diisi'),
  address: yup.string().trim().min(4, 'Tuliskan kota & alamat lebih lengkap').required('Alamat wajib diisi'),
  quantity: yup.number().typeError('Jumlah harus angka').min(1, 'Minimal 1').max(50, 'Maksimal 50 unit').required('Jumlah wajib diisi'),
  payment: yup.string().oneOf(['Tunai', 'Tabung'], 'Pilih metode pembayaran').required('Pilih metode pembayaran'),
  agreedToTerms: yup
    .boolean()
    .oneOf([true], 'Centang persetujuan konfirmasi WhatsApp terlebih dahulu')
    .required(),
}).required();

const Label = ({ htmlFor, children }) => <label htmlFor={htmlFor} className="mb-1.5 block text-[15px] font-medium text-bark">{children}</label>;
const Err = ({ e }) => (e ? <p className="mt-1.5 text-sm font-medium text-red-600" role="alert">{e.message}</p> : null);

export default function OrderModal({ product, onClose }) {
  const { addOrder } = useApp();
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, control, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { quantity: 1, payment: 'Tunai', agreedToTerms: false },
  });
  const [watchedQty, payment] = useWatch({ control, name: ['quantity', 'payment'] });
  const total = product.price * Math.max(Number(watchedQty) || 0, 0);

  const onSubmit = async (data) => {
    if (submitting) return;
    setSubmitting(true);
    const cleanPhone = normalizePhone(data.phone);
    try {
      await addOrder({
        name: data.name.trim(),
        phone: cleanPhone,
        address: data.address.trim(),
        quantity: Number(data.quantity),
        payment: data.payment,
        agreedToTerms: true,
        productId: product.id,
        product: product.name,
        total: product.price * Number(data.quantity),
      });
      window.open(buildWhatsAppLink({ ...data, phone: cleanPhone, product: product.name }), '_blank');
      toast.success('Pengajuan pesanan tercatat (Menunggu Konfirmasi WA). Membuka WhatsApp Pak Nanang...');
      onClose();
    } catch {
      // Error validasi/rate limit sudah ditampilkan oleh AppContext
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title="Ajukan Pemesanan" onClose={onClose}>
      <div className="flex items-center gap-3 rounded-xl bg-cream p-3">
        <img src={getPrimaryImage(product)} alt="" className="h-16 w-16 rounded-lg object-cover" />
        <div className="min-w-0">
          <p className="font-semibold text-bark">{product.name}</p>
          <p className="font-bold text-teak">{formatRupiah(product.price)}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-4" noValidate>
        <div>
          <Label htmlFor="o-name">Nama lengkap</Label>
          <input id="o-name" {...register('name')} className="field" placeholder="Nama kamu" autoComplete="name" disabled={submitting} />
          <Err e={errors.name} />
        </div>
        <div>
          <Label htmlFor="o-phone">Nomor WhatsApp aktif</Label>
          <input
            id="o-phone"
            type="tel"
            inputMode="tel"
            {...register('phone')}
            className="field"
            placeholder="Contoh: 081234567890"
            autoComplete="tel"
            disabled={submitting}
          />
          <p className="mt-1 text-xs text-muted">Dipakai Pak Nanang untuk memverifikasi pesanan agar terhindar dari pesanan palsu.</p>
          <Err e={errors.phone} />
        </div>
        <div>
          <Label htmlFor="o-address">Alamat pengiriman (Jambi / luar daerah)</Label>
          <input id="o-address" {...register('address')} className="field" placeholder="Kota, kecamatan, alamat lengkap" autoComplete="street-address" disabled={submitting} />
          <Err e={errors.address} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="o-qty">Jumlah</Label>
            <input id="o-qty" type="number" min="1" max="50" {...register('quantity')} className="field" disabled={submitting} />
            <Err e={errors.quantity} />
          </div>
          <div>
            <Label htmlFor="o-pay">Pembayaran</Label>
            <select id="o-pay" {...register('payment')} className="field" disabled={submitting}>
              <option value="Tunai">Tunai</option>
              <option value="Tabung">Tabung</option>
            </select>
          </div>
        </div>

        <div className="rounded-xl bg-sand p-4 text-[15px]">
          <div className="flex items-center justify-between">
            <span className="text-muted">Perkiraan harga</span>
            <span className="text-lg font-bold text-teak">{formatRupiah(total)}</span>
          </div>
          <p className="mt-2 text-sm text-muted">
            {payment === 'Tabung' ? 'Sistem tabung: uang muka dan jadwal pembayaran disepakati dengan owner lewat WhatsApp. ' : ''}
            Harga akhir dan jadwal pembuatan (±{product.productionTime}) dikonfirmasi owner.
          </p>
        </div>

        <div>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gold/40 bg-cream/85 p-3.5 text-sm leading-relaxed text-bark">
            <input
              type="checkbox"
              {...register('agreedToTerms')}
              disabled={submitting}
              className="mt-0.5 h-5 w-5 shrink-0 accent-[#6E3F22]"
            />
            <span>
              Saya mengisi data dengan benar dan memahami pesanan ini berstatus <strong>Menunggu Konfirmasi WA</strong> (baru mulai dikerjakan setelah kesepakatan harga &amp; DP dengan Pak Nanang di WhatsApp).
            </span>
          </label>
          <Err e={errors.agreedToTerms} />
        </div>

        <button type="submit" disabled={submitting} className="btn-primary w-full disabled:opacity-65">
          {submitting ? (
            <>
              <Loader2 size={18} className="animate-spin text-gold-light" /> Mengirim pengajuan...
            </>
          ) : (
            <>
              <MessageCircle size={19} /> Ajukan &amp; Konfirmasi via WhatsApp
            </>
          )}
        </button>

        <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted">
          <ShieldCheck size={13} className="text-sage" /> Dilindungi validasi nomor WA &amp; anti-spam otomatis
        </p>
      </form>
    </Modal>
  );
}
