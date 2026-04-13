export default function Footer() {
  const topCategories = [
    { name: 'Comedy Shows', slug: 'comedy-shows' },
    { name: 'Music Events', slug: 'music-events' },
    { name: 'Workshops', slug: 'workshops' },
  ];

  const topLocalities = [
    { name: 'C-Scheme', slug: 'c-scheme' },
    { name: 'Malviya Nagar', slug: 'malviya-nagar' },
    { name: 'Vaishali Nagar', slug: 'vaishali-nagar' },
  ];

  return (
    <footer className="mt-20 border-t bg-white">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-12">
        <div className="grid md:grid-cols-3 gap-10">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              JaipurCircle
            </h3>
            <p className="mt-3 text-sm text-gray-600 leading-relaxed max-w-sm">
              Discover events, nightlife, comedy shows, workshops, and things to do
              across Jaipur by category and locality.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Top Categories
            </h3>
            <div className="space-y-3 text-sm">
              {topCategories.map((c) => (
                <div key={c.slug}>
                  <a
                    href={`/categories/${c.slug}`}
                    className="text-gray-600 hover:text-black transition"
                  >
                    {c.name}
                  </a>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Popular Localities
            </h3>
            <div className="space-y-3 text-sm">
              {topLocalities.map((l) => (
                <div key={l.slug}>
                  <a
                    href={`/jaipur/${l.slug}`}
                    className="text-gray-600 hover:text-black transition"
                  >
                    {l.name}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t text-xs text-gray-500 flex flex-col md:flex-row gap-2 md:items-center md:justify-between">
          <span>© JaipurCircle</span>
          <span>Discover Jaipur by events, categories, and localities.</span>
        </div>
      </div>
    </footer>
  );
}
