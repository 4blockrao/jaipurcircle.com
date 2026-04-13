import { TOP_LOCALITIES } from '@/lib/localities';

export default function LocalitySelector({
  selectedLocality = 'jaipur',
}: {
  selectedLocality?: string;
}) {
  const selected =
    TOP_LOCALITIES.find((l) => l.slug === selectedLocality) || TOP_LOCALITIES[0];

  return (
    <details className="relative">
      <summary className="list-none cursor-pointer">
        <div className="inline-flex items-center gap-2 rounded-full bg-pink-50 border border-pink-100 px-4 py-2 text-sm text-pink-700 hover:bg-pink-100 transition">
          <span>📍</span>
          <span>{selected.name}</span>
          <span>▾</span>
        </div>
      </summary>

      <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-gray-200 bg-white shadow-xl p-2 z-50">
        {TOP_LOCALITIES.map((locality) => (
          <a
            key={locality.slug}
            href={`/?locality=${locality.slug}`}
            className={`block rounded-xl px-3 py-2 text-sm transition ${
              locality.slug === selected.slug
                ? 'bg-pink-50 text-pink-700'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            {locality.name}
          </a>
        ))}
      </div>
    </details>
  );
}
