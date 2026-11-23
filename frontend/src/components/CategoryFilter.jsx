import { categories } from '../data/products';

export default function CategoryFilter({ selected, onSelect }) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filter kategori">
      {categories.map((cat) => {
        const active = selected === cat;
        return (
          <button
            key={cat}
            onClick={() => onSelect(cat)}
            aria-pressed={active}
            className={`min-h-[42px] rounded-full px-5 text-[14.5px] font-semibold transition ${
              active
                ? 'border border-gold/40 bg-espresso text-gold-light shadow-soft'
                : 'border border-line bg-white text-muted hover:border-gold hover:text-espresso'
            }`}
          >
            {cat}
          </button>
        );
      })}
    </div>
  );
}
