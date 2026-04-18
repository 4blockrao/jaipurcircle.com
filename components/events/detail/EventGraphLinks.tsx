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
  return (
    <section className="mt-8 rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-semibold text-gray-900">Explore connected pages</h2>

      {artists?.length > 0 ? (
        <div className="mt-5">
          <div className="mb-2 text-sm font-medium text-gray-700">Artists / Performers</div>
          <div className="flex flex-wrap gap-2">
            {artists.map((artist: any) => (
              <a
                key={artist.id}
                href={`/artists/${artist.slug}`}
                className="rounded-full bg-gray-100 px-4 py-2 text-sm hover:bg-gray-200"
              >
                {artist.name}
              </a>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-3">
        {(event?.locality || locality?.slug) ? (
          <a
            href={`/jaipur/${locality?.slug || event?.locality}`}
            className="rounded-full bg-gray-100 px-4 py-2 text-sm hover:bg-gray-200"
          >
            Explore {event?.locality || locality?.name || "this locality"}
          </a>
        ) : null}

        {(venue?.slug || event?.venue_name) ? (
          <a
            href={`/venues/${venue?.slug || String(event?.venue_name).toLowerCase().replace(/\s+/g, "-")}`}
            className="rounded-full bg-gray-100 px-4 py-2 text-sm hover:bg-gray-200"
          >
            View venue page
          </a>
        ) : null}
      </div>
    </section>
  );
}
