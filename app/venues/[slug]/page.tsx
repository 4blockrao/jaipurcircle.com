import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase";
import EventSectionGrid from "@/components/events/EventSectionGrid";
import {
  getPastEventsForVenue,
  getUpcomingEventsForVenue,
} from "@/lib/events/queries";

export const dynamic = "force-dynamic";

export async function generateMetadata(
  props: { params: Promise<{ slug: string }> }
) {
  const { slug } = await props.params;
  const supabase = createServerSupabaseClient();

  const { data: venue } = await supabase
    .from("venues")
    .select("name, meta_title, meta_description")
    .eq("slug", slug)
    .single();

  if (!venue) {
    return {
      title: "Venue not found | JaipurCircle",
    };
  }

  return {
    title: venue.meta_title || `${venue.name}, Jaipur | JaipurCircle`,
    description:
      venue.meta_description ||
      `Explore upcoming events, past event history, and venue details for ${venue.name} in Jaipur on JaipurCircle.`,
    alternates: {
      canonical: `https://www.jaipurcircle.com/venues/${slug}`,
    },
  };
}

export default async function VenuePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = createServerSupabaseClient();

  const { data: venue, error } = await supabase
    .from("venues")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!venue || error) return notFound();

  const { data: locality } = venue.locality_id
    ? await supabase
        .from("localities")
        .select("*")
        .eq("id", venue.locality_id)
        .maybeSingle()
    : { data: null };

  const [upcomingEvents, pastEvents] = await Promise.all([
    getUpcomingEventsForVenue(supabase, {
      venueId: venue.id,
      venueName: venue.name,
      limit: 6,
    }),
    getPastEventsForVenue(supabase, {
      venueId: venue.id,
      venueName: venue.name,
      limit: 6,
    }),
  ]);

  return (
    <main className="max-w-7xl mx-auto px-4 py-10">
      <nav className="text-sm text-gray-500">
        <a href="/" className="hover:text-black">Home</a>
        <span> &gt; </span>
        <span className="text-black">Venues</span>
        <span> &gt; </span>
        <span className="text-black">{venue.name}</span>
      </nav>

      <header className="mt-6">
        <h1 className="text-3xl md:text-4xl font-bold">
          {venue.h1_override || `${venue.name}, Jaipur`}
        </h1>

        <p className="mt-4 max-w-3xl text-gray-700 leading-7">
          {venue.description ||
            venue.seo_blurb ||
            `${venue.name} is a venue in Jaipur. Explore upcoming events, past event history, and locality context on JaipurCircle.`}
        </p>

        <div className="mt-5 flex flex-wrap gap-3 text-sm">
          <span className="rounded-full bg-gray-100 px-4 py-2">
            Venue: {venue.name}
          </span>

          {venue.address ? (
            <span className="rounded-full bg-gray-100 px-4 py-2">
              Address: {venue.address}
            </span>
          ) : null}

          {locality?.slug ? (
            <a
              href={`/jaipur/${locality.slug}`}
              className="rounded-full bg-gray-100 px-4 py-2 hover:bg-gray-200"
            >
              Explore {locality.name}
            </a>
          ) : null}
        </div>
      </header>

      <EventSectionGrid
        title={`Upcoming events at ${venue.name}`}
        description={`Discover upcoming events scheduled at ${venue.name} in Jaipur.`}
        events={upcomingEvents}
        emptyText={`No upcoming events are currently linked to ${venue.name}.`}
      />

      <EventSectionGrid
        title={`Past events at ${venue.name}`}
        description={`JaipurCircle keeps event pages live after they end, helping build a permanent event history for ${venue.name}.`}
        events={pastEvents}
        emptyText={`No past event archive is currently available for ${venue.name}.`}
      />

      <section className="mt-12">
        <h2 className="text-xl font-semibold">Venue context</h2>
        <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-6">
          <div className="space-y-3 text-gray-700">
            <p>
              <strong>Name:</strong> {venue.name}
            </p>

            {venue.address ? (
              <p>
                <strong>Address:</strong> {venue.address}
              </p>
            ) : null}

            {locality?.name ? (
              <p>
                <strong>Locality:</strong>{" "}
                <a
                  href={`/jaipur/${locality.slug}`}
                  className="text-blue-600 hover:underline"
                >
                  {locality.name}
                </a>
              </p>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}
