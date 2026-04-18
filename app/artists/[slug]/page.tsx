import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase";
import EventSectionGrid from "@/components/events/EventSectionGrid";
import {
  getUpcomingEventsForArtist,
  getPastEventsForArtist,
  getVenueClusterForArtist,
  getLocalityClusterForArtist,
} from "@/lib/events/queries";

export const dynamic = "force-dynamic";

export async function generateMetadata(
  props: { params: Promise<{ slug: string }> }
) {
  const { slug } = await props.params;
  const supabase = createServerSupabaseClient();

  const { data: artist } = await supabase
    .from("artists")
    .select("name, meta_title, meta_description")
    .eq("slug", slug)
    .single();

  if (!artist) {
    return {
      title: "Artist not found | JaipurCircle",
    };
  }

  return {
    title: artist.meta_title || `${artist.name} in Jaipur | JaipurCircle`,
    description:
      artist.meta_description ||
      `Explore upcoming Jaipur events, past appearances, venues, and localities connected to ${artist.name} on JaipurCircle.`,
    alternates: {
      canonical: `https://www.jaipurcircle.com/artists/${slug}`,
    },
  };
}

export default async function ArtistPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = createServerSupabaseClient();

  const { data: artist, error } = await supabase
    .from("artists")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!artist || error) return notFound();

  const [upcomingEvents, pastEvents, venues, localities] = await Promise.all([
    getUpcomingEventsForArtist(supabase, {
      artistId: artist.id,
      limit: 6,
    }),
    getPastEventsForArtist(supabase, {
      artistId: artist.id,
      limit: 6,
    }),
    getVenueClusterForArtist(supabase, {
      artistId: artist.id,
      limit: 6,
    }),
    getLocalityClusterForArtist(supabase, {
      artistId: artist.id,
      limit: 6,
    }),
  ]);

  return (
    <main className="max-w-7xl mx-auto px-4 py-10">
      <nav className="text-sm text-gray-500">
        <a href="/" className="hover:text-black">Home</a>
        <span> &gt; </span>
        <span className="text-black">Artists</span>
        <span> &gt; </span>
        <span className="text-black">{artist.name}</span>
      </nav>

      <header className="mt-6">
        <h1 className="text-3xl md:text-4xl font-bold">
          {artist.h1_override || `${artist.name} in Jaipur`}
        </h1>

        <p className="mt-4 max-w-3xl text-gray-700 leading-7">
          {artist.description ||
            artist.bio ||
            artist.seo_blurb ||
            `${artist.name} has an event footprint in Jaipur. Explore upcoming appearances, past event history, venues, and localities connected to this artist on JaipurCircle.`}
        </p>

        <div className="mt-5 flex flex-wrap gap-3 text-sm">
          <span className="rounded-full bg-gray-100 px-4 py-2">
            Artist: {artist.name}
          </span>
        </div>
      </header>

      <EventSectionGrid
        title={`Upcoming Jaipur events by ${artist.name}`}
        description={`Discover upcoming events in Jaipur connected to ${artist.name}.`}
        events={upcomingEvents}
        emptyText={`No upcoming Jaipur events are currently linked to ${artist.name}.`}
      />

      <EventSectionGrid
        title={`Past Jaipur appearances by ${artist.name}`}
        description={`JaipurCircle keeps event pages live after they end, helping build a permanent Jaipur appearance history for ${artist.name}.`}
        events={pastEvents}
        emptyText={`No past Jaipur event archive is currently available for ${artist.name}.`}
      />

      <section className="mt-12">
        <h2 className="text-xl font-semibold">Venues connected to {artist.name}</h2>
        <p className="mt-2 text-sm text-gray-600">
          Explore venues where this artist has appeared in Jaipur.
        </p>

        {venues.length > 0 ? (
          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {venues.map((venue: any) => (
              <a
                key={venue.id}
                href={`/venues/${venue.slug}`}
                className="block rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <h3 className="text-lg font-semibold text-gray-900">{venue.name}</h3>
                <p className="mt-2 text-sm text-gray-600 line-clamp-3">
                  {venue.description ||
                    venue.seo_blurb ||
                    `${venue.name} is a venue in Jaipur connected to ${artist.name}.`}
                </p>
                <div className="mt-4 text-sm font-medium text-blue-600">
                  View venue page →
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-600">
            No venue cluster is available for this artist yet.
          </div>
        )}
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold">Localities connected to {artist.name}</h2>
        <p className="mt-2 text-sm text-gray-600">
          Explore Jaipur localities where this artist has had event activity.
        </p>

        {localities.length > 0 ? (
          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {localities.map((locality: any) => (
              <a
                key={locality.id}
                href={`/jaipur/${locality.slug}`}
                className="block rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <h3 className="text-lg font-semibold text-gray-900">{locality.name}</h3>
                <p className="mt-2 text-sm text-gray-600 line-clamp-3">
                  {locality.description ||
                    locality.seo_blurb ||
                    `${locality.name} is a Jaipur locality connected to ${artist.name}'s event history.`}
                </p>
                <div className="mt-4 text-sm font-medium text-blue-600">
                  Explore locality →
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-600">
            No locality cluster is available for this artist yet.
          </div>
        )}
      </section>
    </main>
  );
}
