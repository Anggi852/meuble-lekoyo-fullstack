import { Link } from 'react-router-dom';
import { Heart, ArrowRight, Crown } from 'lucide-react';
import { useApp } from '../context/AppContext';
import ProductCard from '../components/ProductCard';

export default function Wishlist() {
  const { wishlist, isOwner } = useApp();

  if (isOwner) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
        <div className="rounded-3xl border border-gold/35 bg-sand/60 p-8 shadow-soft">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-espresso text-gold-light">
            <Crown size={28} className="text-gold" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-espresso sm:text-3xl">
            Halaman Khusus Pelanggan
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Anda sedang login sebagai Owner. Fitur Favorit hanya digunakan oleh pelanggan untuk menyimpan produk pilihan mereka.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/admin" className="btn-primary text-sm">
              <Crown size={16} className="text-gold-light" /> Buka Dashboard Owner
            </Link>
            <Link to="/" className="btn-soft text-sm">
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="border-b border-gold/25 pb-6">
        <span className="kicker">Koleksi Pilihanmu</span>
        <h1 className="font-heading mt-1.5 text-4xl font-bold text-espresso">
          Favorit <span className="italic text-teak">kamu</span>
        </h1>
        <p className="mt-2 text-[17px] text-muted">Daftar furnitur jati yang kamu simpan untuk dipertimbangkan nanti.</p>
      </div>

      {wishlist.length === 0 ? (
        <div className="luxury-panel mt-8 px-6 py-16 text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-gold/35 bg-sand">
            <Heart className="text-teak" size={28} />
          </span>
          <p className="font-heading mt-5 text-2xl font-bold text-espresso">Belum ada produk favorit</p>
          <p className="mt-1.5 text-muted">Tekan ikon hati di produk mana pun untuk menyimpannya di sini.</p>
          <Link to="/catalog" className="btn-primary mt-7">
            Jelajahi katalog <ArrowRight size={17} className="text-gold-light" />
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {wishlist.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      )}
    </div>
  );
}