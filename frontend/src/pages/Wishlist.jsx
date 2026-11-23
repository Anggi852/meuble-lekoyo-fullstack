import { Link } from 'react-router-dom';
import { Heart, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import ProductCard from '../components/ProductCard';

export default function Wishlist() {
  const { wishlist } = useApp();

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
