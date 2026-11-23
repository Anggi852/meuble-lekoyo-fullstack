import { ChevronDown } from 'lucide-react';

// Daftar tanya-jawab bergaya butik elegan
export default function FaqList({ items }) {
  return (
    <div className="space-y-3">
      {items.map((f) => (
        <details
          key={f.id}
          className="card group px-5 py-4 transition hover:border-gold/50 open:border-gold/60 open:shadow-lift"
        >
          <summary className="flex cursor-pointer items-center justify-between gap-4 text-[16.5px] font-semibold text-espresso">
            {f.question}
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-sand/80 text-teak transition group-open:rotate-180 group-open:bg-espresso group-open:text-gold-light">
              <ChevronDown size={17} />
            </span>
          </summary>
          <p className="mt-3.5 border-t border-line/70 pt-3 leading-relaxed text-muted">{f.answer}</p>
        </details>
      ))}
    </div>
  );
}
