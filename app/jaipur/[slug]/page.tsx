import { notFound } from "next/navigation";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_BASE!;

async function getLocality(slug: string) {
  const res = await fetch(`${API}/locality-ssr?slug=${slug}`, {
    cache: "no-store",
  });

  if (!res.ok) return null;
  return res.json();
}

function getIntentClusters(locality: any) {
  return [
    {
      title: `Things to do in ${locality.name}`,
      items: locality.best_for || [],
    },
    {
      title: `What ${locality.name} is known for`,
      items: locality.known_for || [],
    },
    {
      title: `Vibe of ${locality.name}`,
      items: locality.vibe_tags || [],
    },
  ];
}

export default async function LocalityPage({ params }: any) {
  const { slug } = await params;
  const data = await getLocality(slug);

  if (!data || !data.locality) return notFound();

  const locality = data.locality;
  const exactEvents = data.events_exact ?? [];
  const nearbyEvents = data.events_nearby ?? [];
  const venues = data.venues ?? [];
  const nearbyLocalities = locality.nearby_localities ?? [];

  const intentClusters = getIntentClusters(locality);

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">

      {/* HERO */}
      <h1 className="text-3xl font-bold mb-2">
        Things to do in {locality.name}, Jaipur
      </h1>

      <p className="text-gray-600 mb-6">
        {locality.seo_blurb}
      </p>

      {/* INTENT CLUSTERS */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">
          Explore {locality.name}
        </h2>

        <div className="grid md:grid-cols-3 gap-4">
          {intentClusters.map((cluster, i) => (
            <div key={i} className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2">
                {cluster.title}
              </h3>

              <ul className="text-sm text-gray-700 space-y-1">
                {cluster.items.map((item: string, idx: number) => (
                  <li key={idx}>• {item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* EVENTS (PRIMARY INTENT DRIVER) */}
      {exactEvents.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">
            Upcoming Events in {locality.name}
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            {exactEvents.map((event: any) => (
              <Link
                key={event.slug}
                href={`/events/${event.slug}`}
                className="border rounded-lg p-4 hover:shadow transition"
              >
                <h3 className="font-semibold">{event.title}</h3>

                {event.start_time && (
                  <p className="text-sm text-gray-500">
                    {event.start_time}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* NEARBY EVENTS */}
      {nearbyEvents.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">
            More events near {locality.name}
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            {nearbyEvents.map((event: any) => (
              <Link
                key={event.slug}
                href={`/events/${event.slug}`}
                className="border rounded-lg p-4 hover:shadow transition"
              >
                <h3 className="font-semibold">{event.title}</h3>

                {event.locality_name && (
                  <p className="text-sm text-gray-500">
                    {event.locality_name}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* VENUES */}
      {venues.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">
            Popular places in {locality.name}
          </h2>

          <div className="grid md:grid-cols-3 gap-4">
            {venues.map((venue: any) => (
              <Link
                key={venue.slug}
                href={`/venues/${venue.slug}`}
                className="border rounded-lg p-4 hover:shadow transition"
              >
                <h3 className="font-semibold">{venue.name}</h3>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* NEARBY LOCALITIES */}
      {nearbyLocalities.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">
            Nearby areas to explore
          </h2>

          <div className="flex flex-wrap gap-2">
            {nearbyLocalities.map((slug: string) => (
              <Link
                key={slug}
                href={`/jaipur/${slug}`}
                className="px-3 py-1 border rounded-full text-sm hover:bg-gray-100"
              >
                {slug.replace(/-/g, " ")}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* DISCOVERY */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">
          Explore Jaipur
        </h2>

        <div className="grid md:grid-cols-3 gap-4">

          <Link href="/events" className="border p-4 rounded-lg hover:shadow">
            All Events in Jaipur
          </Link>

          <Link href="/venues" className="border p-4 rounded-lg hover:shadow">
            Browse Venues
          </Link>

          <Link href="/categories" className="border p-4 rounded-lg hover:shadow">
            Explore Categories
          </Link>

        </div>
      </section>

      {/* SEO PARAGRAPH */}
      <section className="mt-12">
        <h2 className="text-xl font-semibold mb-3">
          About {locality.name}
        </h2>

        <p className="text-gray-700 leading-relaxed">
          Looking for things to do in {locality.name}, Jaipur? This area is known for{" "}
          {locality.known_for?.join(", ")} and is ideal for{" "}
          {locality.best_for?.join(", ")}. Whether you’re exploring events,
          places, or everyday experiences, {locality.name} offers a mix of{" "}
          {locality.vibe_tags?.join(", ")} experiences that make it one of the
          key localities in Jaipur.
        </p>
      </section>

    </main>
  );
}
