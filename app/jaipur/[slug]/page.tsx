// app/jaipur/[slug]/page.tsx

import { getLocalityBySlug } from "@/lib/localities/queries";
import { getEventsForLocality } from "@/lib/events/queries";
import { getVenuesForLocality } from "@/lib/venues/queries";
import Link from "next/link";

export const dynamic = "force-dynamic";

function splitArchive(events: any[]) {
  const now = new Date();
  const recent: any[] = [];
  const older: any[] = [];

  events.forEach((e) => {
    if (!e.start_time) return;

    const eventDate = new Date(e.start_time);
    const diffDays = (now.getTime() - eventDate.getTime()) / (1000 * 60 * 60 * 24);

    if (diffDays <= 60) {
      recent.push(e);
    } else {
      older.push(e);
    }
  });

  return { recent, older };
}

function getStrongHubEditorialBlock({
  localityName,
  exactUpcomingCount,
  exactVenueCount,
  exactPastCount,
}: {
  localityName: string;
  exactUpcomingCount: number;
  exactVenueCount: number;
  exactPastCount: number;
}) {
  const isStrongHub =
    exactUpcomingCount >= 3 ||
    exactVenueCount >= 3 ||
    exactPastCount >= 5;

  if (!isStrongHub) return null;

  return {
    heading: `${localityName} as a Jaipur activity hub`,
    body: `${localityName} is emerging as one of Jaipur’s more active zones with ${exactUpcomingCount} upcoming event${exactUpcomingCount === 1 ? "" : "s"}, ${exactVenueCount} active venue${exactVenueCount === 1 ? "" : "s"}, and ${exactPastCount} archived event${exactPastCount === 1 ? "" : "s"}. Over time, this locality is building a stronger identity across events, venues, and community activity, making it increasingly relevant for discovering what’s happening nearby.`,
  };
}

export default async function LocalityPage({
  params,
}: {
  params: { slug: string };
}) {
  const locality = await getLocalityBySlug(params.slug);

  if (!locality) {
    return <div>Locality not found</div>;
  }

  const { exact, nearby } = await getEventsForLocality(locality.id);
  const venues = await getVenuesForLocality(locality.id);

  const upcomingExact = exact.filter((e) => !e.is_past);
  const pastExact = exact.filter((e) => e.is_past);

  const { recent, older } = splitArchive(pastExact);

  const editorial = getStrongHubEditorialBlock({
    localityName: locality.name,
    exactUpcomingCount: upcomingExact.length,
    exactVenueCount: venues.length,
    exactPastCount: pastExact.length,
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">

      {/* Header */}
      <h1 className="text-3xl font-bold mb-4">
        {locality.name} — Jaipur
      </h1>

      {locality.seo_blurb && (
        <p className="text-gray-600 mb-6">{locality.seo_blurb}</p>
      )}

      {/* Strong Hub Editorial */}
      {editorial && (
        <div className="bg-gray-50 border p-4 rounded-lg mb-8">
          <h2 className="text-xl font-semibold mb-2">
            {editorial.heading}
          </h2>
          <p className="text-gray-700">{editorial.body}</p>
        </div>
      )}

      {/* Upcoming Events */}
      {upcomingExact.length > 0 && (
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">
            Upcoming Events in {locality.name}
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {upcomingExact.map((event) => (
              <Link key={event.id} href={`/events/${event.slug}`}>
                <div className="border rounded-lg p-4 hover:shadow">
                  <h3 className="font-semibold">{event.title}</h3>
                  <p className="text-sm text-gray-500">
                    {event.venue_name}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Nearby fallback */}
      {upcomingExact.length === 0 && nearby.length > 0 && (
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">
            Popular upcoming events near {locality.name}
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {nearby.map((event) => (
              <Link key={event.id} href={`/events/${event.slug}`}>
                <div className="border rounded-lg p-4 hover:shadow">
                  <h3 className="font-semibold">{event.title}</h3>
                  <p className="text-sm text-gray-500">
                    {event.venue_name}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Venues */}
      {venues.length > 0 && (
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">
            Venues in {locality.name}
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {venues.map((venue) => (
              <Link key={venue.id} href={`/venues/${venue.slug}`}>
                <div className="border rounded-lg p-4 hover:shadow">
                  <h3 className="font-semibold">{venue.name}</h3>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Recent Archive */}
      {recent.length > 0 && (
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">
            Recent Events in {locality.name}
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {recent.map((event) => (
              <Link key={event.id} href={`/events/${event.slug}`}>
                <div className="border rounded-lg p-4 hover:shadow">
                  <h3 className="font-semibold">{event.title}</h3>
                  <p className="text-sm text-gray-500">
                    {event.venue_name}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Older Archive */}
      {older.length > 0 && (
        <section>
          <h2 className="text-2xl font-semibold mb-4">
            Event History in {locality.name}
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {older.map((event) => (
              <Link key={event.id} href={`/events/${event.slug}`}>
                <div className="border rounded-lg p-4 hover:shadow">
                  <h3 className="font-semibold">{event.title}</h3>
                  <p className="text-sm text-gray-500">
                    {event.venue_name}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
