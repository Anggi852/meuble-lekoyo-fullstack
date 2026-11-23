import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { CheckCircle2, Images, RotateCcw, ShoppingBag } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { categories } from '../../data/products';
import { formatRupiah } from '../../utils/format';
import { getProductImages } from '../../utils/image';
import FormModal from '../../components/FormModal';
import ResponsiveImage from '../../components/ResponsiveImage';
import { AddButton, PageHeader, RowActions, confirmDelete } from '../../components/admin/ui';
import { todayISO } from '../../utils/sales';

const fields = [
  { name: 'name', label: 'Nama produk', required: true, placeholder: 'Contoh: Meja Makan Jati Minimalis' },
  { name: 'category', label: 'Kategori', type: 'select', options: categories.filter((c) => c !== 'Semua') },
  { name: 'price', label: 'Harga (Rp)', type: 'number', required: true, placeholder: '4500000' },
  { name: 'description', label: 'Deskripsi', type: 'textarea', required: true },
  { name: 'material', label: 'Bahan', required: true, placeholder: 'Kayu Jati Solid' },
  { name: 'productionTime', label: 'Estimasi pembuatan', required: true, placeholder: '2 bulan' },
  {
    name: 'images',
    label: 'Foto produk (maks. 4 foto)',
    type: 'photos',
    max: 4,
    required: true,
    hint: 'Pilih langsung foto dari galeri HP atau laptop. Anda dapat mengatur sudut (Tampak Depan, Samping, Belakang, Detail) dan memilih foto utama.',
  },
  {
    name: 'stockStatus',
    label: 'Status stok',
    type: 'select',
    options: ['Tersedia', 'Terjual'],
    hint: 'Pilih "Terjual" jika unit ini sudah laku. Pelanggan tetap bisa memesan ulang.',
  },
  { name: 'featured', label: 'Tampilkan di Produk Unggulan (beranda)', type: 'checkbox' },
];

const saleFields = [
  { name: 'quantity', label: 'Jumlah terjual', type: 'number', required: true },
  { name: 'date', label: 'Tanggal', type: 'date', required: true },
  { name: 'note', label: 'Catatan (opsional)', placeholder: 'Contoh: dibeli tunai di toko' },
  { name: 'markSold', label: 'Tandai stok produk ini sebagai Terjual', type: 'checkbox' },
];

const blank = {
  name: '',
  category: 'Meja',
  price: '',
  description: '',
  material: 'Kayu Jati Solid',
  productionTime: '2 bulan',
  images: [],
  stockStatus: 'Tersedia',
  featured: false,
};

export default function Products() {
  const { products, saveProduct, removeProduct, soldOf, addSale, setStock } = useApp();
  const [modal, setModal] = useState(null);
  const [saleFor, setSaleFor] = useState(null);

  const submitSale = (v) => {
    if (!saleFor) return;
    addSale({ ...v, productId: saleFor?.id });
    toast.success(`Tercatat: ${saleFor?.name} terjual ${v.quantity}`);
    setSaleFor(null);
  };

  const submit = (v) => {
    const imgs = getProductImages(v);
    saveProduct({ ...v, images: imgs, image: imgs[0]?.url || '' });
    setModal(null);
    toast.success(v.id ? 'Perubahan produk disimpan' : 'Produk baru ditambahkan');
  };

  const openEdit = (p) => {
    setModal({ ...p, images: getProductImages(p) });
  };

  return (
    <div>
      <PageHeader
        title="Produk"
        desc="Upload langsung 1–4 foto per produk (depan, samping, belakang, detail), tandai stok terjual, dan catat penjualan."
        action={<AddButton onClick={() => setModal(blank)}>Tambah produk</AddButton>}
      />

      {products.length === 0 ? (
        <p className="luxury-panel p-10 text-center text-muted">Belum ada produk. Klik "Tambah produk" untuk memulai.</p>
      ) : (
        <>
          {/* Tampilan Kartu Rapi Khusus HP Android & iOS */}
          <div className="space-y-3.5 md:hidden">
            {products.map((p) => {
              const sold = soldOf(p.id);
              const isSold = p.stockStatus === 'Terjual';
              const photos = getProductImages(p);
              return (
                <article key={p.id} className="luxury-panel p-4">
                  <div className="flex gap-3.5">
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-sand">
                      <ResponsiveImage
                        src={photos[0]?.url || p.image}
                        alt={p.name}
                        widths={[160, 320]}
                        sizes="80px"
                        defaultWidth={240}
                        className="h-full w-full object-cover"
                      />
                      <span className="absolute bottom-1 right-1 inline-flex items-center gap-0.5 rounded-full bg-espresso/85 px-1.5 py-0.5 text-[10px] font-bold text-gold-light">
                        <Images size={9} /> {photos.length}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <span className="rounded-full bg-sand px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-teak">
                          {p.category}
                        </span>
                        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${isSold ? 'bg-bark/10 text-bark' : 'bg-green-100 text-green-800'}`}>
                          {isSold ? 'Terjual' : 'Tersedia'}
                        </span>
                      </div>
                      <h2 className="font-heading mt-1 truncate text-base font-bold text-espresso">{p.name}</h2>
                      <p className="font-bold text-teak">{formatRupiah(p.price)}</p>
                      <p className="mt-0.5 text-xs text-muted">
                        Terjual <strong className="text-espresso">{sold.total}×</strong> ({sold.online} online · {sold.offline} toko)
                      </p>
                    </div>
                  </div>

                  <div className="mt-3.5 grid grid-cols-2 gap-2 border-t border-line/70 pt-3">
                    <button onClick={() => setSaleFor({ ...p })} className="btn-primary !min-h-[40px] !px-3 !py-2 text-xs">
                      <ShoppingBag size={14} className="text-gold-light" /> Catat terjual
                    </button>
                    <button
                      onClick={() => {
                        setStock(p.id, isSold ? 'Tersedia' : 'Terjual');
                        toast.success(isSold ? 'Ditandai tersedia' : 'Ditandai terjual');
                      }}
                      className="btn-soft !min-h-[40px] !px-3 !py-2 text-xs"
                    >
                      {isSold ? <><RotateCcw size={14} /> Tersedia lagi</> : <><CheckCircle2 size={14} /> Tandai terjual</>}
                    </button>
                  </div>
                  <div className="mt-2 flex justify-end">
                    <RowActions name={p.name} onEdit={() => openEdit(p)} onDelete={() => confirmDelete(p.name, () => removeProduct(p.id))} />
                  </div>
                </article>
              );
            })}
          </div>

          {/* Tampilan Tabel Eksekutif Khusus Tablet & Laptop */}
          <div className="luxury-panel hidden overflow-x-auto md:block">
            <table className="w-full min-w-[760px] text-[15px]">
              <thead className="bg-espresso text-left text-xs uppercase tracking-wider text-gold-light">
                <tr>
                  <th className="p-4 font-semibold">Produk</th>
                  <th className="p-4 font-semibold">Kategori</th>
                  <th className="p-4 font-semibold">Harga</th>
                  <th className="p-4 font-semibold">Terjual</th>
                  <th className="p-4 font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const sold = soldOf(p.id);
                  const isSold = p.stockStatus === 'Terjual';
                  const photos = getProductImages(p);
                  return (
                    <tr key={p.id} className="border-t border-line/80 align-top transition hover:bg-cream/65">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-sand">
                            <ResponsiveImage
                              src={photos[0]?.url || p.image}
                              alt=""
                              widths={[120, 240]}
                              sizes="56px"
                              defaultWidth={160}
                              className="h-full w-full object-cover"
                            />
                            <span className="absolute bottom-0.5 right-0.5 rounded-full bg-espresso/85 px-1.5 text-[9.5px] font-bold text-gold-light">
                              {photos.length}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-espresso">{p.name}</p>
                            <div className="mt-1 flex flex-wrap items-center gap-1.5">
                              <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${isSold ? 'bg-bark/10 text-bark' : 'bg-green-100 text-green-800'}`}>
                                {isSold ? 'Terjual' : 'Tersedia'}
                              </span>
                              <span className="inline-flex items-center gap-1 rounded-full bg-cream px-2 py-0.5 text-[11px] font-semibold text-muted">
                                <Images size={11} className="text-teak" /> {photos.length} foto
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-muted">{p.category}</td>
                      <td className="p-4 font-semibold text-teak">{formatRupiah(p.price)}</td>
                      <td className="p-4">
                        <p className="font-heading text-xl font-bold leading-none text-espresso">{sold.total}×</p>
                        <p className="mt-1 text-xs text-muted">{sold.online} online · {sold.offline} di toko</p>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-2">
                          <button onClick={() => setSaleFor({ ...p })} className="btn-primary !min-h-[40px] !px-3.5 !py-2 text-sm">
                            <ShoppingBag size={15} className="text-gold-light" /> Catat terjual
                          </button>
                          <button
                            onClick={() => {
                              setStock(p.id, isSold ? 'Tersedia' : 'Terjual');
                              toast.success(isSold ? 'Ditandai tersedia' : 'Ditandai terjual');
                            }}
                            className="btn-soft !min-h-[40px] !px-3.5 !py-2 text-sm"
                          >
                            {isSold ? <><RotateCcw size={15} /> Tersedia lagi</> : <><CheckCircle2 size={15} /> Tandai terjual</>}
                          </button>
                          <RowActions name={p.name} onEdit={() => openEdit(p)} onDelete={() => confirmDelete(p.name, () => removeProduct(p.id))} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      <AnimatePresence>
        {saleFor && (
          <FormModal
            title={`Catat penjualan: ${saleFor.name}`}
            fields={saleFields}
            initial={{ quantity: 1, date: todayISO(), note: '', markSold: true }}
            onClose={() => setSaleFor(null)}
            onSubmit={submitSale}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {modal && (
          <FormModal
            title={modal.id ? 'Ubah produk' : 'Tambah produk'}
            fields={fields}
            initial={modal}
            onClose={() => setModal(null)}
            onSubmit={submit}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
