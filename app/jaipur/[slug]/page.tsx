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

export default async function LocalityPage({ params }: any) {
  const { slug } = await params;
  const data = await getLocality(slug);

  if (!data || !data.locality) return notFound();

  const locality = data.locality;
  const exactEvents = data.events_exact || [];
  const nearbyEvents = data.events_nearby || [];
  const venues = data.venues || [];
  const nearbyLocalities = locality.nearby_localities || [];

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">

      {/* HERO */}
      <h1 className="text-3xl font-bold mb-2">
        {locality.name}
      </h1>

      <p className="text-gray-600 mb-6">
        {locality.seo_blurb}
      </p>

      {/* WHY THIS LOCALITY */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3">
          Why explore {locality.name}?
        </h2>

        <p className="text-gray-700 leading-relaxed">
          {locality.name} is known for{" "}
          <strong>{locality.known_for?.join(", ")}</strong>.  
          It is especially popular for{" "}
          <strong>{locality.best_for?.join(", ")}</strong>, with a vibe that feels{" "}
          <strong>{locality.vibe_tags?.join(", ")}</strong>.  
          Whether you’re exploring Jaipur for events, food, shopping, or local experiences,
          this area plays an important role in the city’s everyday and cultural life.
        </p>
      </section>

      {/* EXACT EVENTS */}
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
                className="border rounded-lg p-4 hover:shadow-md transition"
              >
                <h3 className="font-semibold">{event.title}</h3>
                <p className="text-sm text-gray-500">{event.start_time}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* NEARBY EVENTS */}
      {nearbyEvents.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">
            More Events Near {locality.name}
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            {nearbyEvents.map((event: any) => (
              <Link
                key={event.slug}
                href={`/events/${event.slug}`}
                className="border rounded-lg p-4 hover:shadow-md transition"
              >
                <h3 className="font-semibold">{event.title}</h3>
                <p className="text-sm text-gray-500">
                  {event.locality_name}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* VENUES */}
      {venues.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">
            Popular Venues in {locality.name}
          </h2>

          <div className="grid md:grid-cols-3 gap-4">
            {venues.map((venue: any) => (
              <Link
                key={venue.slug}
                href={`/venues/${venue.slug}`}
                className="border rounded-lg p-4 hover:shadow-md transition"
              >
                <h3 className="font-semibold">{venue.name}</h3>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* DISCOVERY ROUTES */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">
          Explore more from {locality.name}
        </h2>

        <div className="grid md:grid-cols-3 gap-4">

          <Link href="/events" className="border p-4 rounded-lg hover:shadow">
            All Jaipur Events
          </Link>

          <Link href={`/jaipur/${slug}`} className="border p-4 rounded-lg hover:shadow">
            More in {locality.name}
          </Link>

          <Link href="/venues" className="border p-4 rounded-lg hover:shadow">
            Browse Venues
          </Link>

        </div>
      </section>

      {/* NEARBY LOCALITIES */}
      {nearbyLocalities.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">
            Nearby Localities
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

      {/* ARCHIVE CONTINUITY */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3">
          Events history in {locality.name}
        </h2>

        <p className="text-gray-700">
          Events in {locality.name} remain part of JaipurCircle’s archive.
          Even after events conclude, their pages stay live and continue to
          connect you with similar upcoming events, venues, and experiences
          across Jaipur.
        </p>
      </section>

    </main>
  );
}
