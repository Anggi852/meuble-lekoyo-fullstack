import { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  ShoppingBag,
  MapPin,
  Wallet,
  History,
  Phone,
  MessageCircle,
  Tag,
  CheckCircle2,
  Mail,
  User,
  Image as ImageIcon,
  ZoomIn,
  X,
  Camera,
  Star,
  Globe,
  EyeOff,
  Receipt,
  Plus,
  Trash2,
  Building2,
  QrCode,
  Settings2,
  XCircle,
  Upload,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
} from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '../../context/AppContext';
import { PageHeader, confirmDelete } from '../../components/admin/ui';
import Modal from '../../components/Modal';
import PhotoUploader from '../../components/admin/PhotoUploader';
import FurniturePreview from '../../components/FurniturePreview';
import PaymentReceiptModal from '../../components/PaymentReceiptModal';
import { CUSTOM_CATEGORIES, CUSTOM_TYPE_KEYS, TYPES } from '../../data/custom';
import { formatRupiah } from '../../utils/format';
import { compressImageFile } from '../../utils/image';
import { getPaymentSummary } from '../../utils/payment';
import { customKey } from '../../utils/sales';
import { buildCustomerWhatsAppReplyLink } from '../../utils/phone';

const statuses = [
  'Menunggu Harga Owner',
  'Harga Ditetapkan',
  'Menunggu Konfirmasi WA',
  'Diproses',
  'Selesai',
  'Dibatalkan',
];

const CATEGORY_OPTIONS = CUSTOM_CATEGORIES.filter((c) => c !== 'Semua');
const normalizeStatus = (s) => (s === 'Baru' ? 'Menunggu Harga Owner' : s);

const statusStyle = {
  'Menunggu Harga Owner': 'bg-amber-50 text-amber-800 border-amber-200',
  'Harga Ditetapkan': 'bg-sand text-teak border-gold/40',
  'Menunggu Konfirmasi WA': 'bg-amber-50 text-amber-800 border-amber-200',
  Diproses: 'bg-espresso/10 text-espresso border-espresso/20',
  Selesai: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  Dibatalkan: 'bg-red-50 text-red-700 border-red-200',
};

function guessCategoryForOrder(order) {
  const fromType = order?.custom?.design?.type && TYPES[order.custom.design.type]?.label;
  if (fromType && CATEGORY_OPTIONS.includes(fromType)) return fromType;
  const fromLabel = order?.custom?.categoryLabel;
  if (fromLabel && CATEGORY_OPTIONS.includes(fromLabel)) return fromLabel;
  return 'Bebas Request';
}

function guessCityFromAddress(address = '') {
  const parts = String(address).split(',').map((s) => s.trim()).filter(Boolean);
  return parts[parts.length - 1] || 'Kota Jambi';
}

/* ==================== MODAL PENGATURAN REKENING & QRIS ==================== */
function PaymentSettingsModal({ settings, onSave, onClose }) {
  const [accounts, setAccounts] = useState(settings?.accounts || []);
  const [qrisImage, setQrisImage] = useState(settings?.qrisImage || '');
  const [cashNote, setCashNote] = useState(settings?.cashNote || '');
  const [tabungNote, setTabungNote] = useState(settings?.tabungNote || '');
  const [saving, setSaving] = useState(false);
  const [uploadingQris, setUploadingQris] = useState(false);

  const addAccountRow = () => {
    setAccounts((prev) => [
      ...prev,
      { id: `acc-${Date.now()}`, bankName: '', accountNumber: '', accountHolder: '' },
    ]);
  };

  const updateAccountRow = (idx, field, val) => {
    setAccounts((prev) => prev.map((a, i) => (i === idx ? { ...a, [field]: val } : a)));
  };

  const removeAccountRow = (idx) => {
    setAccounts((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleQrisUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploadingQris(true);
    try {
      const dataUrl = await compressImageFile(file);
      setQrisImage(dataUrl);
      toast.success('Gambar QRIS siap disimpan.');
    } catch (err) {
      toast.error(err.message || 'Gagal memproses gambar QRIS.');
    } finally {
      setUploadingQris(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const validAccounts = accounts.filter(
      (a) => a.bankName.trim() && a.accountNumber.trim() && a.accountHolder.trim(),
    );
    setSaving(true);
    try {
      await onSave({
        accounts: validAccounts,
        qrisImage,
        cashNote: cashNote.trim(),
        tabungNote: tabungNote.trim(),
      });
      toast.success('Rekening & info pembayaran disimpan.');
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Pengaturan Rekening Bank & QRIS" onClose={onClose}>
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-teak">
              <Building2 size={14} /> Rekening Bank Toko
            </p>
            <button
              type="button"
              onClick={addAccountRow}
              className="inline-flex items-center gap-1 rounded-full border border-gold/45 bg-cream px-3 py-1 text-xs font-bold text-teak hover:bg-espresso hover:text-gold-light"
            >
              <Plus size={13} /> Tambah Rekening
            </button>
          </div>

          {accounts.length === 0 ? (
            <p className="rounded-xl border border-dashed border-line bg-cream/60 p-4 text-center text-xs text-muted">
              Belum ada rekening. Klik <strong>+ Tambah Rekening</strong> agar otomatis tampil ke pelanggan saat membayar.
            </p>
          ) : (
            <div className="space-y-2.5">
              {accounts.map((acc, idx) => (
                <div key={acc.id || idx} className="space-y-2 rounded-xl border border-line bg-cream/50 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-muted">Rekening #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeAccountRow(idx)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:underline"
                    >
                      <Trash2 size={12} /> Hapus
                    </button>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-3">
                    <input
                      type="text"
                      value={acc.bankName}
                      onChange={(e) => updateAccountRow(idx, 'bankName', e.target.value)}
                      placeholder="Nama Bank (BRI / BCA)"
                      className="field !py-2 text-xs"
                      required
                    />
                    <input
                      type="text"
                      value={acc.accountNumber}
                      onChange={(e) => updateAccountRow(idx, 'accountNumber', e.target.value)}
                      placeholder="No. Rekening"
                      className="field !py-2 font-mono text-xs"
                      required
                    />
                    <input
                      type="text"
                      value={acc.accountHolder}
                      onChange={(e) => updateAccountRow(idx, 'accountHolder', e.target.value)}
                      placeholder="Atas Nama"
                      className="field !py-2 text-xs"
                      required
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-teak">
            <QrCode size={14} /> Gambar QRIS Toko (Opsional)
          </p>
          {qrisImage ? (
            <div className="relative inline-block rounded-xl border border-gold/40 bg-cream p-2">
              <img src={qrisImage} alt="QRIS Toko" className="max-h-40 rounded-lg object-contain" />
              <button
                type="button"
                onClick={() => setQrisImage('')}
                className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-espresso text-white hover:bg-red-600"
                aria-label="Hapus QRIS"
              >
                <X size={12} />
              </button>
            </div>
          ) : (
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-gold/50 bg-cream/60 px-4 py-3.5 text-xs font-semibold text-teak hover:bg-sand/40">
              <Upload size={15} />
              <span>{uploadingQris ? 'Memproses...' : 'Upload Foto QRIS'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleQrisUpload}
                disabled={uploadingQris}
                className="sr-only"
              />
            </label>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-bark">Catatan Pembayaran Tunai</label>
            <textarea
              rows={2}
              value={cashNote}
              onChange={(e) => setCashNote(e.target.value)}
              className="field !py-2 text-xs"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-bark">Catatan Sistem Tabung</label>
            <textarea
              rows={2}
              value={tabungNote}
              onChange={(e) => setTabungNote(e.target.value)}
              className="field !py-2 text-xs"
            />
          </div>
        </div>

        <button type="submit" disabled={saving} className="btn-primary w-full text-sm">
          {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
        </button>
      </form>
    </Modal>
  );
}

/* ==================== TAB 1: DETAIL DESAIN & HARGA FINAL ==================== */
function CustomDesignPanel({ custom, onOpenPhoto }) {
  const [view, setView] = useState('front');
  const [showScale, setShowScale] = useState(true);

  const design = custom?.design;
  const photos = Array.isArray(custom?.referencePhotos) ? custom.referencePhotos : [];
  if (!design && photos.length === 0) return null;

  return (
    <div className="mt-3 grid gap-3 lg:grid-cols-2">
      {design?.type && design?.dims && (
        <div className="overflow-hidden rounded-xl border border-line bg-white">
          <div className="luxury-dark flex items-center justify-between gap-2 px-3 py-2">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setView('front')}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                  view === 'front' ? 'bg-gold text-espresso' : 'text-cream/75 hover:bg-white/10'
                }`}
              >
                Tampak Depan
              </button>
              <button
                type="button"
                onClick={() => setView('side')}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                  view === 'side' ? 'bg-gold text-espresso' : 'text-cream/75 hover:bg-white/10'
                }`}
              >
                Tampak Samping
              </button>
              {design.type === 'lemari' && (
                <button
                  type="button"
                  onClick={() => setView('inside')}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                    view === 'inside' ? 'bg-gold text-espresso' : 'text-cream/75 hover:bg-white/10'
                  }`}
                >
                  Tata Dalam
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowScale((v) => !v)}
              className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-semibold ${
                showScale
                  ? 'border-gold/50 bg-gold/20 text-gold-light'
                  : 'border-white/20 text-cream/70'
              }`}
            >
              <User size={11} /> 170cm
            </button>
          </div>
          <div className="mx-auto max-w-[340px]">
            <FurniturePreview
              type={design.type}
              dims={design.dims}
              opts={design.opts || {}}
              finish={design.finish || 'natural'}
              sheen={design.sheen || 'doff'}
              view={view}
              showScale={showScale}
            />
          </div>
        </div>
      )}

      {photos.length > 0 && (
        <div className="rounded-xl border border-line bg-white p-3.5">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted">
            <ImageIcon size={13} /> Referensi Pelanggan ({photos.length})
          </p>
          <div className="grid grid-cols-3 gap-2">
            {photos.map((ph, idx) => {
              const src = ph?.dataUrl || ph?.url || ph;
              const name = ph?.name || `Referensi ${idx + 1}`;
              return (
                <button
                  key={`${name}-${idx}`}
                  type="button"
                  onClick={() => onOpenPhoto({ src, name })}
                  className="group relative overflow-hidden rounded-lg border border-line bg-cream"
                >
                  <img src={src} alt={name} className="aspect-square w-full object-cover" />
                  <span className="absolute inset-0 grid place-items-center bg-espresso/0 text-white opacity-0 transition group-hover:bg-espresso/45 group-hover:opacity-100">
                    <ZoomIn size={16} />
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function OwnerPricingForm({ order, onSave }) {
  const [priceInput, setPriceInput] = useState(
    order.finalPrice != null ? String(order.finalPrice) : String(order.estimatedPrice || order.total || ''),
  );
  const [noteInput, setNoteInput] = useState(order.ownerNote || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    const numericPrice = Number(String(priceInput).replace(/[^\d]/g, ''));
    if (!numericPrice || numericPrice <= 0) {
      toast.error('Masukkan nominal harga final yang valid.');
      return;
    }
    setSaving(true);
    try {
      await onSave(order.id, {
        finalPrice: numericPrice,
        ownerNote: noteInput.trim(),
      });
      toast.success(`Harga final ${order.orderCode || `#${order.id}`} disimpan.`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="mt-4 rounded-xl border border-line bg-cream/60 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-espresso">
          <Tag size={13} className="text-gold-dark" /> Harga Final Owner
        </p>
        {order.finalPrice != null && (
          <span className="text-xs font-semibold text-emerald-700">
            Aktif: {formatRupiah(order.finalPrice)}
          </span>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-12">
        <div className="sm:col-span-4">
          <label className="mb-1 block text-xs text-muted">Harga Final (Rp)</label>
          <input
            type="number"
            min="0"
            step="50000"
            value={priceInput}
            onChange={(e) => setPriceInput(e.target.value)}
            placeholder="Contoh: 5000000"
            className="field !py-2 text-sm font-semibold"
          />
        </div>
        <div className="sm:col-span-6">
          <label className="mb-1 block text-xs text-muted">Catatan untuk Pelanggan</label>
          <input
            type="text"
            value={noteInput}
            onChange={(e) => setNoteInput(e.target.value)}
            placeholder="Mis. Sudah termasuk ongkir Kota Jambi"
            className="field !py-2 text-sm"
          />
        </div>
        <div className="flex items-end sm:col-span-2">
          <button type="submit" disabled={saving} className="btn-primary !min-h-[40px] w-full text-xs">
            {saving ? '...' : 'Simpan'}
          </button>
        </div>
      </div>
    </form>
  );
}

/* ==================== TAB 2: BUKU TABUNGAN & VERIFIKASI PEMBAYARAN ==================== */
function PaymentTabPanel({
  order,
  onRecordPayment,
  onVerifyPayment,
  onDeletePayment,
  onOpenReceipt,
  onOpenPhoto,
}) {
  const summary = getPaymentSummary(order);
  const [showAdd, setShowAdd] = useState(false);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('Tunai di Toko');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  if (summary.bill <= 0) {
    return (
      <div className="rounded-xl border border-dashed border-line bg-cream/60 p-5 text-center text-sm text-muted">
        Tetapkan <strong>Harga Final</strong> terlebih dahulu pada tab <strong>Detail &amp; Harga</strong> untuk mulai mencatat atau memverifikasi pembayaran.
      </div>
    );
  }

  const handleManualAdd = async (e) => {
    e.preventDefault();
    const numeric = Number(String(amount).replace(/[^\d]/g, ''));
    if (!numeric || numeric < 1000) {
      toast.error('Masukkan nominal minimal Rp 1.000.');
      return;
    }
    setSaving(true);
    try {
      await onRecordPayment(order.id, {
        amount: numeric,
        date,
        method,
        note:
          note.trim() ||
          (summary.isTabung
            ? `Setoran ke-${summary.verifiedRecords.length + 1}`
            : 'Pembayaran Tunai'),
      });
      toast.success('Pembayaran dicatat & langsung mengurangi sisa tagihan.');
      setAmount('');
      setNote('');
      setShowAdd(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Ringkasan 3 Angka Utama + Progress */}
      <div className="rounded-xl border border-line bg-cream/60 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="grid flex-1 grid-cols-3 gap-3">
            <div>
              <p className="text-[11px] font-medium text-muted">Harga Barang</p>
              <p className="text-sm font-bold text-espresso sm:text-base">{formatRupiah(summary.bill)}</p>
            </div>
            <div>
              <p className="text-[11px] font-medium text-muted">Sudah Masuk</p>
              <p className="text-sm font-bold text-emerald-700 sm:text-base">{formatRupiah(summary.paidAmount)}</p>
            </div>
            <div>
              <p className="text-[11px] font-medium text-muted">Sisa Tagihan</p>
              <p className={`text-sm font-extrabold sm:text-base ${summary.isPaidOff ? 'text-emerald-700' : 'text-teak'}`}>
                {summary.isPaidOff ? 'LUNAS' : formatRupiah(summary.remaining)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {!summary.isPaidOff && (
              <button
                type="button"
                onClick={() => {
                  setShowAdd((v) => !v);
                  if (!amount && summary.remaining > 0) {
                    setAmount(summary.isTabung ? '' : String(summary.remaining));
                  }
                }}
                className="btn-primary !min-h-[36px] !px-3.5 text-xs"
              >
                <Plus size={13} className="text-gold-light" />
                {summary.isTabung ? 'Catat Setoran' : 'Catat Bayar'}
              </button>
            )}
            <button
              type="button"
              onClick={() => onOpenReceipt(order)}
              className="btn-soft !min-h-[36px] !px-3.5 text-xs"
            >
              <Receipt size={13} className="text-gold-dark" />
              {summary.isPaidOff ? 'Bukti Pelunasan' : 'Kwitansi'}
            </button>
          </div>
        </div>

        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-sand">
          <div
            className={`h-full rounded-full transition-all ${summary.isPaidOff ? 'bg-emerald-600' : 'bg-espresso'}`}
            style={{ width: `${summary.percent}%` }}
          />
        </div>
      </div>

      {/* Form Catat Setoran / Pembayaran Langsung oleh Owner */}
      {showAdd && (
        <form onSubmit={handleManualAdd} className="rounded-xl border border-gold/40 bg-white p-3.5">
          <p className="mb-2.5 text-xs font-bold text-espresso">
            Catat Pembayaran Baru (langsung terverifikasi)
          </p>
          <div className="grid gap-2.5 sm:grid-cols-12">
            <div className="sm:col-span-3">
              <input
                type="number"
                min="1000"
                step="1000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Nominal (mis. 500000)"
                className="field !py-2 text-xs font-bold"
                required
              />
            </div>
            <div className="sm:col-span-3">
              <select value={method} onChange={(e) => setMethod(e.target.value)} className="field !py-2 text-xs">
                <option value="Tunai di Toko">Tunai di Toko</option>
                <option value="Transfer Bank">Transfer Bank</option>
                <option value="QRIS">QRIS</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="field !py-2 text-xs" required />
            </div>
            <div className="flex gap-2 sm:col-span-4">
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Catatan (opsional)"
                className="field flex-1 !py-2 text-xs"
              />
              <button type="submit" disabled={saving} className="btn-primary !min-h-[36px] !px-3.5 text-xs">
                {saving ? '...' : 'Simpan'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Buku Tabungan / Riwayat Setoran dengan Sisa Berjalan */}
      {summary.ledger.length === 0 ? (
        <p className="py-3 text-center text-xs text-muted">Belum ada setoran atau pembayaran tercatat.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-line bg-white">
          <div className="hidden grid-cols-12 bg-sand/60 px-3.5 py-2 text-[11px] font-bold uppercase tracking-wider text-muted sm:grid">
            <span className="col-span-4">Setoran &amp; Metode</span>
            <span className="col-span-2 text-right">Nominal</span>
            <span className="col-span-3 text-right">Sisa Setelah Bayar</span>
            <span className="col-span-3 text-right">Aksi</span>
          </div>

          <div className="divide-y divide-line/70">
            {summary.ledger.map((rec, idx) => (
              <div key={rec.id || idx} className="px-3.5 py-3 text-xs">
                <div className="grid items-center gap-2 sm:grid-cols-12">
                  <div className="sm:col-span-4">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-bold text-espresso">
                        {rec.stepNumber ? `Setoran #${rec.stepNumber}` : 'Pengajuan Bayar'}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          rec.status === 'Terverifikasi'
                            ? 'bg-emerald-50 text-emerald-700'
                            : rec.status === 'Ditolak'
                              ? 'bg-red-50 text-red-700'
                              : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {rec.status}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-muted">
                      {rec.date || (rec.createdAt || '').slice(0, 10)} · {rec.method}
                      {rec.note ? ` · ${rec.note}` : ''}
                    </p>
                  </div>

                  <div className="flex justify-between sm:col-span-2 sm:block sm:text-right">
                    <span className="text-muted sm:hidden">Bayar:</span>
                    <span className="font-bold text-emerald-700">{formatRupiah(rec.amount)}</span>
                  </div>

                  <div className="flex justify-between sm:col-span-3 sm:block sm:text-right">
                    <span className="text-muted sm:hidden">Sisa Tagihan:</span>
                    {rec.status === 'Terverifikasi' ? (
                      <span className={`font-bold ${rec.balanceAfter === 0 ? 'text-emerald-700' : 'text-espresso'}`}>
                        {rec.balanceAfter === 0 ? 'Rp 0 (LUNAS)' : `Tinggal ${formatRupiah(rec.balanceAfter)}`}
                      </span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-1.5 sm:col-span-3">
                    {rec.proofImage && (
                      <button
                        type="button"
                        onClick={() =>
                          onOpenPhoto({
                            src: rec.proofImage,
                            name: `Bukti Bayar ${order.name} — ${formatRupiah(rec.amount)}`,
                          })
                        }
                        className="inline-flex items-center gap-1 rounded-lg border border-line bg-cream px-2 py-1 font-semibold text-teak hover:border-gold"
                      >
                        <ZoomIn size={12} /> Bukti
                      </button>
                    )}

                    {rec.status === 'Menunggu Verifikasi' && (
                      <>
                        <button
                          type="button"
                          onClick={async () => {
                            await onVerifyPayment(order.id, rec.id, { status: 'Terverifikasi' });
                            toast.success('Setoran diverifikasi & sisa tagihan diperbarui.');
                          }}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 font-bold text-white hover:bg-emerald-700"
                        >
                          <CheckCircle2 size={12} /> Terima
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setRejectingId(rec.id);
                            setRejectReason('');
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2 py-1 font-semibold text-red-700 hover:bg-red-100"
                        >
                          <XCircle size={12} /> Tolak
                        </button>
                      </>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        confirmDelete(`setoran ${formatRupiah(rec.amount)}`, () =>
                          onDeletePayment(order.id, rec.id),
                        )
                      }
                      aria-label="Hapus setoran"
                      className="rounded-lg p-1.5 text-muted hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {rec.status === 'Ditolak' && rec.rejectReason && (
                  <p className="mt-1.5 text-[11px] font-medium text-red-600">
                    Alasan ditolak: {rec.rejectReason}
                  </p>
                )}

                {rejectingId === rec.id && (
                  <div className="mt-2 flex gap-1.5 border-t border-line pt-2">
                    <input
                      type="text"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Alasan penolakan (mis. Foto buram / nominal beda)"
                      className="field flex-1 !py-1.5 text-xs"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        await onVerifyPayment(order.id, rec.id, {
                          status: 'Ditolak',
                          rejectReason: rejectReason.trim() || 'Bukti transfer tidak sesuai',
                        });
                        setRejectingId(null);
                        toast.info('Bukti pembayaran ditolak.');
                      }}
                      className="rounded-lg bg-red-600 px-3 py-1 text-xs font-bold text-white"
                    >
                      Tolak
                    </button>
                    <button
                      type="button"
                      onClick={() => setRejectingId(null)}
                      className="rounded-lg border border-line px-2.5 py-1 text-xs"
                    >
                      Batal
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ==================== TAB 3: FOTO HASIL JADI & PUBLIKASI KARYA ==================== */
function FinishedTabPanel({
  order,
  review,
  linkedPortfolio,
  onSaveFinishedPhotos,
  onPublishOrder,
  onTogglePublish,
}) {
  const isCustom = Boolean(order.custom);
  const [photos, setPhotos] = useState(
    Array.isArray(order.finishedPhotos) && order.finishedPhotos.length > 0
      ? order.finishedPhotos
      : linkedPortfolio?.images || [],
  );
  const [title, setTitle] = useState(linkedPortfolio?.name || order.custom?.title || order.product);
  const [category, setCategory] = useState(linkedPortfolio?.category || guessCategoryForOrder(order));
  const [city, setCity] = useState(linkedPortfolio?.city || review?.city || guessCityFromAddress(order.address));
  const [description, setDescription] = useState(
    linkedPortfolio?.description ||
      [order.custom?.options, order.custom?.note ? `Catatan: ${order.custom.note}` : '']
        .filter(Boolean)
        .join(' · ') ||
      `Hasil pengerjaan custom ${order.custom?.title || order.product} kayu jati solid.`,
  );
  const [showFeedback, setShowFeedback] = useState(
    linkedPortfolio ? linkedPortfolio.showFeedback !== false : true,
  );
  const [savingPhotos, setSavingPhotos] = useState(false);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    if (Array.isArray(order.finishedPhotos) && order.finishedPhotos.length > 0) {
      setPhotos(order.finishedPhotos);
    }
  }, [order.finishedPhotos]);

  const isPublished = Boolean(linkedPortfolio && linkedPortfolio.isPublished !== false);

  const handleSavePhotosOnly = async () => {
    if (photos.length === 0) {
      toast.error('Upload minimal 1 foto produk jadi.');
      return;
    }
    setSavingPhotos(true);
    try {
      await onSaveFinishedPhotos(order.id, { finishedPhotos: photos });
      toast.success('Foto produk hasil jadi disimpan.');
    } finally {
      setSavingPhotos(false);
    }
  };

  const handleApproveAndPublish = async () => {
    if (photos.length === 0) {
      toast.error('Upload minimal 1 foto produk jadi sebelum publikasi.');
      return;
    }
    setPublishing(true);
    try {
      const typeKey =
        order.custom?.design?.type ||
        CUSTOM_TYPE_KEYS.find((k) => TYPES[k].label === category) ||
        'lainnya';
      const preset = order.custom?.design
        ? {
            dims: order.custom.design.dims,
            opts: order.custom.design.opts,
            finish: order.custom.design.finish,
          }
        : undefined;

      await onPublishOrder(order, {
        name: title.trim() || order.custom?.title || order.product,
        typeKey,
        category,
        size: order.custom?.size || 'Sesuai pesanan',
        finish: order.custom?.finish || 'Natural Jati (Doff)',
        city: city.trim() || 'Kota Jambi',
        year: String(new Date().getFullYear()),
        description: description.trim(),
        images: photos,
        image: photos[0]?.url || '',
        preset,
        customerName: order.name,
        customerFeedback: review?.text || linkedPortfolio?.customerFeedback || '',
        customerRating: review?.rating || linkedPortfolio?.customerRating || null,
        showFeedback,
        price: order.finalPrice ?? order.total ?? null,
        isPublished: true,
      });
      toast.success('Disetujui & tayang di Karya Pernah Dicustom.');
    } finally {
      setPublishing(false);
    }
  };

  const handleUnpublish = async () => {
    if (!linkedPortfolio) return;
    setPublishing(true);
    try {
      await onTogglePublish(linkedPortfolio, false);
      toast.info('Karya disembunyikan dari publik.');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-line bg-cream/60 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-bold uppercase tracking-wider text-espresso">
            Foto Produk Hasil Jadi (tampil ke pelanggan)
          </p>
          {isCustom && (
            <span
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                isPublished ? 'bg-emerald-600 text-white' : 'bg-white text-muted border border-line'
              }`}
            >
              {isPublished ? 'Tayang di Galeri Custom' : 'Belum Tayang Publik'}
            </span>
          )}
        </div>

        <PhotoUploader value={photos} onChange={setPhotos} max={4} />

        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={handleSavePhotosOnly}
            disabled={savingPhotos || photos.length === 0}
            className="btn-soft !min-h-[36px] !px-4 text-xs disabled:opacity-50"
          >
            {savingPhotos ? 'Menyimpan...' : 'Simpan Foto Saja'}
          </button>
        </div>
      </div>

      {review && (
        <div className="rounded-xl border border-line bg-white p-3.5 text-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="font-bold text-espresso">
              Feedback {review.name || order.name} ({review.city || city})
            </span>
            <span className="flex gap-0.5 text-gold">
              {[...Array(5)].map((_, k) => (
                <Star
                  key={k}
                  size={12}
                  fill={k < (Number(review.rating) || 5) ? 'currentColor' : 'none'}
                  className={k < (Number(review.rating) || 5) ? 'text-gold' : 'text-line'}
                />
              ))}
            </span>
          </div>
          <p className="mt-1 italic text-bark">"{review.text}"</p>
        </div>
      )}

      {isCustom && (
        <div className="space-y-3 rounded-xl border border-line bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-teak">
            Publikasi ke Karya Pernah Dicustom
          </p>
          <div className="grid gap-2.5 sm:grid-cols-3">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nama karya"
              className="field !py-2 text-xs sm:col-span-2"
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="field !py-2 text-xs"
            >
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Kota pemesan"
              className="field !py-2 text-xs"
            />
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Deskripsi singkat"
              className="field !py-2 text-xs sm:col-span-2"
            />
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-xs text-bark">
            <input
              type="checkbox"
              checked={showFeedback}
              onChange={(e) => setShowFeedback(e.target.checked)}
              className="h-4 w-4 accent-teak"
            />
            Tampilkan nama &amp; feedback pemesan di galeri publik
          </label>

          <div className="flex flex-wrap justify-end gap-2 pt-1">
            {isPublished && (
              <button
                type="button"
                onClick={handleUnpublish}
                disabled={publishing}
                className="btn-soft !min-h-[36px] !px-3.5 text-xs text-red-700"
              >
                <EyeOff size={13} /> Sembunyikan
              </button>
            )}
            <button
              type="button"
              onClick={handleApproveAndPublish}
              disabled={publishing || photos.length === 0}
              className="btn-primary !min-h-[36px] !px-4 text-xs disabled:opacity-50"
            >
              <Globe size={13} className="text-gold-light" />
              {publishing ? 'Memproses...' : isPublished ? 'Perbarui Publikasi' : 'Setujui & Publikasikan'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ==================== KARTU PESANAN RINGKAS DENGAN TAB BERSIH ==================== */
function OrderCard({
  order,
  orders,
  review,
  linkedPortfolio,
  onUpdateStatus,
  onUpdateOrder,
  onRemoveOrder,
  onPublishOrder,
  onTogglePublish,
  onRecordPayment,
  onVerifyPayment,
  onDeletePayment,
  onOpenReceipt,
  onOpenPhoto,
}) {
  const displayStatus = normalizeStatus(order.status);
  const paySummary = getPaymentSummary(order);
  const pendingPayCount = paySummary.pendingRecords.length;
  const customerWaLink = buildCustomerWhatsAppReplyLink(order);

  // Otomatis buka tab Pembayaran kalau ada bukti transfer yang menunggu verifikasi
  const [activeTab, setActiveTab] = useState(pendingPayCount > 0 ? 'payment' : null);

  const toggleTab = (tab) => setActiveTab((prev) => (prev === tab ? null : tab));

  const same = order.custom
    ? orders.filter((x) => x.id !== order.id && customKey(x) === customKey(order))
    : [];
  const sameDone = same.filter((x) => x.status === 'Selesai' || x.madeBefore).length;

  return (
    <article className="overflow-hidden rounded-2xl border border-line bg-white shadow-soft transition hover:border-gold/50">
      {/* BARIS RINGKASAN UTAMA (Rapi & Mudah Dipindai Mata) */}
      <div className="p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {order.orderCode && (
                <span className="rounded-md bg-espresso px-2 py-0.5 font-mono text-[11px] font-bold tracking-wider text-gold-light">
                  {order.orderCode}
                </span>
              )}
              {order.custom && (
                <span className="rounded-full bg-sand px-2.5 py-0.5 text-[11px] font-bold text-teak">
                  Custom
                </span>
              )}
              <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${statusStyle[displayStatus] || 'bg-sand text-bark border-line'}`}>
                {displayStatus}
              </span>
              {pendingPayCount > 0 && (
                <span className="rounded-full bg-amber-500 px-2.5 py-0.5 text-[11px] font-bold text-white">
                  {pendingPayCount} Bukti Bayar Perlu Dicek
                </span>
              )}
            </div>

            <h2 className="mt-2 text-base font-bold text-espresso sm:text-lg">
              {order.product} <span className="font-normal text-muted">×{order.quantity}</span>
            </h2>

            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
              <span className="font-semibold text-bark">{order.name}</span>
              <span>{order.phone || 'Tanpa WA'}</span>
              <span>
                {new Date(order.createdAt).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>

          {/* Kanan: Nominal Harga & Status Bayar */}
          <div className="text-left sm:text-right">
            <p className="font-heading text-lg font-bold text-espresso">
              {order.finalPrice != null
                ? formatRupiah(order.finalPrice)
                : order.total > 0
                  ? `Est. ${formatRupiah(order.total)}`
                  : 'Belum ada harga'}
            </p>
            <p className="mt-0.5 text-xs font-semibold">
              <span className="text-muted">{order.payment} · </span>
              {paySummary.bill <= 0 ? (
                <span className="text-amber-700">Menunggu Harga</span>
              ) : paySummary.isPaidOff ? (
                <span className="text-emerald-700">LUNAS</span>
              ) : (
                <span className="text-teak">Sisa {formatRupiah(paySummary.remaining)}</span>
              )}
            </p>
          </div>
        </div>

        {/* BARIS AKSI & TAB RINGKAS */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line/80 pt-3.5">
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => toggleTab('detail')}
              className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition ${
                activeTab === 'detail'
                  ? 'border-espresso bg-espresso text-gold-light'
                  : 'border-line bg-cream/70 text-bark hover:border-gold'
              }`}
            >
              <SlidersHorizontal size={13} />
              Detail &amp; Harga
              {activeTab === 'detail' ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>

            <button
              type="button"
              onClick={() => toggleTab('payment')}
              className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition ${
                activeTab === 'payment'
                  ? 'border-espresso bg-espresso text-gold-light'
                  : pendingPayCount > 0
                    ? 'border-amber-400 bg-amber-50 text-amber-900'
                    : 'border-line bg-cream/70 text-bark hover:border-gold'
              }`}
            >
              <Wallet size={13} />
              {paySummary.isTabung ? 'Buku Tabungan' : 'Pembayaran'}
              {pendingPayCount > 0 && (
                <span className="rounded-full bg-amber-500 px-1.5 py-0.2 text-[10px] font-bold text-white">
                  {pendingPayCount}
                </span>
              )}
              {activeTab === 'payment' ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>

            {displayStatus === 'Selesai' && (
              <button
                type="button"
                onClick={() => toggleTab('finished')}
                className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition ${
                  activeTab === 'finished'
                    ? 'border-espresso bg-espresso text-gold-light'
                    : 'border-line bg-cream/70 text-bark hover:border-gold'
                }`}
              >
                <Camera size={13} />
                Foto Jadi {order.custom ? '& Galeri' : ''}
                {activeTab === 'finished' ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>
            )}
          </div>

          {/* Kontrol Status + WA + Hapus */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Ubah status pesanan"
              value={displayStatus}
              onChange={(e) => {
                const nextStatus = e.target.value;
                if ((nextStatus === 'Diproses' || nextStatus === 'Selesai') && order.finalPrice == null) {
                  toast.error('Tetapkan Harga Final dulu di tab Detail & Harga.');
                  setActiveTab('detail');
                  return;
                }
                onUpdateStatus(order.id, nextStatus);
                toast.success(`Status diubah ke ${nextStatus}`);
              }}
              className="field !min-h-[36px] !w-auto !py-1.5 text-xs font-semibold"
            >
              {statuses.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>

            {customerWaLink && (
              <a
                href={customerWaLink}
                target="_blank"
                rel="noreferrer"
                title="Hubungi pemesan lewat WhatsApp"
                className="inline-flex min-h-[36px] items-center gap-1 rounded-xl bg-sage px-3 text-xs font-semibold text-white transition hover:opacity-90"
              >
                <MessageCircle size={13} /> WA
              </a>
            )}

            <button
              type="button"
              onClick={() => confirmDelete(`pesanan ${order.name}`, () => onRemoveOrder(order.id))}
              title="Hapus pesanan"
              className="grid h-9 w-9 place-items-center rounded-xl border border-line text-muted transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* PANEL ISI TAB (Hanya muncul 1 tab yang sedang dipilih) */}
      {activeTab && (
        <div className="border-t border-line bg-cream/35 p-4 sm:p-5">
          {activeTab === 'detail' && (
            <div>
              <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <dt className="text-xs text-muted">Pemesan</dt>
                  <dd className="font-semibold text-espresso">{order.name}</dd>
                  {order.customerEmail && (
                    <dd className="mt-0.5 flex items-center gap-1 text-xs text-muted">
                      <Mail size={11} /> {order.customerEmail}
                    </dd>
                  )}
                </div>
                <div>
                  <dt className="text-xs text-muted">WhatsApp</dt>
                  <dd className="flex items-center gap-1 font-semibold text-espresso">
                    <Phone size={12} className="text-muted" /> {order.phone || '-'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Alamat Pengiriman</dt>
                  <dd className="font-medium text-espresso">{order.address}</dd>
                  {order.latitude != null && order.longitude != null && (
                    <a
                      href={`https://www.google.com/maps?q=${order.latitude},${order.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-0.5 inline-flex items-center gap-1 text-xs font-semibold text-teak underline"
                    >
                      <MapPin size={11} /> Buka Titik Maps
                    </a>
                  )}
                </div>
              </dl>

              {order.custom && (
                <div className="mt-4 space-y-1 rounded-xl border border-line bg-white p-3.5 text-xs text-bark">
                  <p>
                    <b>Finishing:</b> {order.custom.finish}
                    {order.custom.wood ? <> · <b>Konstruksi:</b> {order.custom.wood}</> : null}
                  </p>
                  <p><b>Spesifikasi:</b> {order.custom.options}</p>
                  {order.custom.needBy && <p><b>Target selesai:</b> {order.custom.needBy}</p>}
                  {order.custom.note && <p><b>Catatan pemesan:</b> {order.custom.note}</p>}
                </div>
              )}

              {order.custom && <CustomDesignPanel custom={order.custom} onOpenPhoto={onOpenPhoto} />}

              {order.custom && same.length > 0 && (
                <p className="mt-3 flex items-center gap-2 rounded-xl bg-sand/70 px-3.5 py-2.5 text-xs text-bark">
                  <History size={14} className="shrink-0 text-teak" />
                  Rancangan serupa sudah pernah dipesan <b>{same.length}×</b>
                  {sameDone > 0 && <> ({sameDone}× selesai)</>}.
                </p>
              )}

              <OwnerPricingForm order={order} onSave={onUpdateOrder} />
            </div>
          )}

          {activeTab === 'payment' && (
            <PaymentTabPanel
              order={order}
              onRecordPayment={onRecordPayment}
              onVerifyPayment={onVerifyPayment}
              onDeletePayment={onDeletePayment}
              onOpenReceipt={onOpenReceipt}
              onOpenPhoto={onOpenPhoto}
            />
          )}

          {activeTab === 'finished' && (
            <FinishedTabPanel
              order={order}
              review={review}
              linkedPortfolio={linkedPortfolio}
              onSaveFinishedPhotos={onUpdateOrder}
              onPublishOrder={onPublishOrder}
              onTogglePublish={onTogglePublish}
            />
          )}
        </div>
      )}
    </article>
  );
}

export default function Orders() {
  const {
    orders,
    testimonials,
    customPortfolio,
    updateOrderStatus,
    updateOrder,
    removeOrder,
    publishCustomOrder,
    togglePortfolioPublish,
    submitOrderPayment,
    verifyOrderPayment,
    deleteOrderPayment,
    paymentSettings,
    savePaymentSettings,
  } = useApp();

  const [filter, setFilter] = useState('Semua');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState(null);
  const [receiptOrder, setReceiptOrder] = useState(null);

  const list =
    filter === 'Semua'
      ? orders
      : orders.filter((o) => normalizeStatus(o.status) === filter);

  const bankCount = paymentSettings?.accounts?.length || 0;

  return (
    <div>
      <PageHeader
        title="Pesanan Masuk"
        desc="Klik tab pada tiap pesanan untuk mengatur harga, memverifikasi setoran tabungan, atau mengunggah foto hasil jadi."
        action={
          <button
            type="button"
            onClick={() => setShowSettingsModal(true)}
            className="btn-soft !min-h-[42px] text-xs sm:text-sm"
          >
            <Settings2 size={15} className="text-gold-dark" />
            Atur Rekening &amp; QRIS ({bankCount})
          </button>
        }
      />

      {/* Filter Status */}
      <div className="no-scrollbar mb-5 flex gap-2 overflow-x-auto pb-1 sm:flex-wrap">
        {['Semua', ...statuses].map((s) => {
          const count =
            s === 'Semua'
              ? orders.length
              : orders.filter((o) => normalizeStatus(o.status) === s).length;
          return (
            <button
              key={s}
              onClick={() => setFilter(s)}
              aria-pressed={filter === s}
              className={`min-h-[38px] shrink-0 rounded-full px-3.5 text-xs font-semibold transition sm:text-sm ${
                filter === s
                  ? 'border border-gold/40 bg-espresso text-gold-light shadow-soft'
                  : 'border border-line bg-white text-muted hover:border-gold hover:text-espresso'
              }`}
            >
              {s} ({count})
            </button>
          );
        })}
      </div>

      {list.length === 0 ? (
        <div className="card px-6 py-14 text-center">
          <ShoppingBag size={36} className="mx-auto text-wood" />
          <p className="mt-3 text-base font-semibold text-espresso">
            {orders.length === 0 ? 'Belum ada pesanan masuk' : 'Tidak ada pesanan pada status ini'}
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {list.map((o) => {
            const orderReview = testimonials.find((t) => Number(t.orderId) === Number(o.id));
            const linkedPortfolio =
              customPortfolio.find((c) => Number(c.id) === Number(o.publishedPortfolioId)) ||
              customPortfolio.find((c) => Number(c.orderId) === Number(o.id)) ||
              null;

            return (
              <OrderCard
                key={o.id}
                order={o}
                orders={orders}
                review={orderReview}
                linkedPortfolio={linkedPortfolio}
                onUpdateStatus={updateOrderStatus}
                onUpdateOrder={updateOrder}
                onRemoveOrder={removeOrder}
                onPublishOrder={publishCustomOrder}
                onTogglePublish={togglePortfolioPublish}
                onRecordPayment={submitOrderPayment}
                onVerifyPayment={verifyOrderPayment}
                onDeletePayment={deleteOrderPayment}
                onOpenReceipt={setReceiptOrder}
                onOpenPhoto={setLightboxPhoto}
              />
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {showSettingsModal && (
          <PaymentSettingsModal
            settings={paymentSettings}
            onSave={savePaymentSettings}
            onClose={() => setShowSettingsModal(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {receiptOrder && (
          <PaymentReceiptModal order={receiptOrder} onClose={() => setReceiptOrder(null)} />
        )}
      </AnimatePresence>

      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-espresso/85 p-4 backdrop-blur-sm"
          onClick={() => setLightboxPhoto(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-3xl overflow-hidden rounded-2xl border border-gold/40 bg-cream p-3 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 flex items-center justify-between gap-4 px-1">
              <p className="truncate text-sm font-bold text-espresso">{lightboxPhoto.name}</p>
              <button
                type="button"
                onClick={() => setLightboxPhoto(null)}
                className="grid h-8 w-8 place-items-center rounded-full bg-sand text-espresso hover:bg-espresso hover:text-gold-light"
                aria-label="Tutup pratinjau"
              >
                <X size={16} />
              </button>
            </div>
            <img
              src={lightboxPhoto.src}
              alt={lightboxPhoto.name}
              className="max-h-[78vh] w-auto rounded-xl object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}