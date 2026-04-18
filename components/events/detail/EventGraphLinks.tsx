function GraphChip({
  href,
  icon,
  label,
}: {
  href: string;
  icon: string;
  label: string;
}) {
  return (
    <a
      href={href}
      className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:border-gray-300 hover:bg-gray-50"
    >
      <span>{icon}</span>
      <span>{label}</span>
    </a>
  );
}

export default function EventGraphLinks({
  event,
  artists,
  venue,
  locality,
}: {
  event: any;
  artists: any[];
  venue: any;
  locality: any;
}) {
  const localitySlug =
    locality?.slug ||
    (event?.locality
      ? String(event.locality)
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .trim()
          .replace(/\s+/g, "-")
      : null);

  const venueSlug =
    venue?.slug ||
    (event?.venue_name
      ? String(event.venue_name)
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .trim()
          .replace(/\s+/g, "-")
      : null);

  const validArtists =
    artists?.filter((artist: any) => artist?.slug && artist?.name) || [];

  return (
    <section className="mt-10 rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm">
      <div className="max-w-4xl">
        <h2 className="text-2xl font-semibold tracking-tight text-gray-900">
          Explore connected pages
        </h2>
        <p className="mt-2 text-sm leading-6 text-gray-600">
          This event is connected to JaipurCircle’s location, venue, and performer graph.
          Use these paths to keep exploring related context.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          {localitySlug ? (
            <GraphChip
              href={`/jaipur/${localitySlug}`}
              icon="📍"
              label={`Explore ${locality?.name || event?.locality || "this locality"}`}
            />
          ) : null}

          {venueSlug ? (
            <GraphChip
              href={`/venues/${venueSlug}`}
              icon="🏛"
              label={venue?.name || event?.venue_name || "Venue page"}
            />
          ) : null}

          {validArtists.map((artist: any) => (
            <GraphChip
              key={artist.id}
              href={`/artists/${artist.slug}`}
              icon="🎤"
              label={artist.name}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
