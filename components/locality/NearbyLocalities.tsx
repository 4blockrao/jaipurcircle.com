type Props = {
  currentSlug: string;
  nearbyLocalities?: string[] | null;
};

function formatName(slug: string) {
  return slug
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

export default function NearbyLocalities({
  currentSlug,
  nearbyLocalities,
}: Props) {
  const items = (nearbyLocalities || []).filter(Boolean).filter((x) => x !== currentSlug);

  if (items.length === 0) return null;

  return (
    <section className="mt-12">
      <h2 className="text-xl font-semibold mb-4">Nearby localities</h2>
      <p className="text-sm text-gray-600 mb-4">
        Explore nearby Jaipur localities connected to {formatName(currentSlug)}.
      </p>

      <div className="flex flex-wrap gap-3">
        {items.map((slug) => (
          <a
            key={slug}
            href={`/jaipur/${slug}`}
            className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            {formatName(slug)}
          </a>
        ))}
      </div>
    </section>
  );
}
