import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase";
import EventSectionGrid from "@/components/events/EventSectionGrid";
import {
  getPastEventsForLocality,
  getUpcomingEventsForLocality,
  getVenuesForLocality,
} from "@/lib/events/queries";

export const dynamic = "force-dynamic";

export async function generateMetadata(
  props: { params: Promise<{ slug: string }> }
) {
  const { slug } = await props.params;
  const supabase = createServerSupabaseClient();

  const { data: locality } = await supabase
    .from("localities")
    .select("name, meta_title, meta_description")
    .eq("slug", slug)
    .single();

  if (!locality) {
    return {
    title:
      locality.meta_title ||
      `${locality.name} Jaipur – Events, Venues & Things to Do`,

    description:
      locality.meta_description ||
      `Discover events, venues, and things to do in ${locality.name}, Jaipur. Explore upcoming experiences and local discovery.`,

    alternates: {
      canonical: `https://www.jaipurcircle.com/jaipur/${slug}`,
    },

    openGraph: {
      title: locality.meta_title,
      description: locality.meta_description,
      url: `https://www.jaipurcircle.com/jaipur/${slug}`,
    },
  };
}

export default async function LocalityPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = createServerSupabaseClient();

  const { data: locality, error } = await supabase
    .from("localities")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!locality || error || !locality.should_index) return notFound();

  const [upcomingEvents, pastEvents, venues] = await Promise.all([
    getUpcomingEventsForLocality(supabase, {
      localityId: locality.id,
      localitySlug: locality.slug,
      limit: 6,
    }),
    getPastEventsForLocality(supabase, {
      localityId: locality.id,
      localitySlug: locality.slug,
      limit: 6,
    }),
    getVenuesForLocality(supabase, {
      localityId: locality.id,
      limit: 6,
    }),
  ]);

  return (
    <main className="max-w-7xl mx-auto px-4 py-10">
      <nav className="text-sm text-gray-500">
        <a href="/" className="hover:text-black">Home</a>
        <span> &gt; </span>
        <span className="text-black">Jaipur</span>
        <span> &gt; </span>
        <span className="text-black">{locality.name}</span>
      </nav>

      <header className="mt-6">
        <h1 className="text-3xl md:text-4xl font-bold">
          {locality.h1_override || `${locality.name}, Jaipur`}
        </h1>

        <p className="mt-4 max-w-3xl text-gray-700 leading-7">
          {locality.description ||
            locality.seo_blurb ||
            `${locality.name} is one of Jaipur’s important localities. Explore what is happening here, discover venues, and browse upcoming and past events connected to this area.`}
        </p>

        <div className="mt-5 flex flex-wrap gap-3 text-sm">
          <span className="rounded-full bg-gray-100 px-4 py-2">
            Locality: {locality.name}
          </span>
          {locality.zone ? (
            <span className="rounded-full bg-gray-100 px-4 py-2">
              Zone: {locality.zone}
            </span>
          ) : null}
          {locality.municipality ? (
            <span className="rounded-full bg-gray-100 px-4 py-2">
              Municipality:
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <a href={`/jaipur/${locality.slug}/events`} className="text-blue-600 text-sm">
          View all events in {locality.name} →
        </a>
      </div>

      <section className="mt-8 max-w-3xl text-sm text-gray-600 leading-7">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          About {locality.name}, Jaipur
        </h2>
        <p>
          {locality.name} is a key locality in Jaipur with active venues,
          local experiences, and ongoing events. This page helps you discover
          what’s happening in the area, explore venues, and browse both
          upcoming and past events.
        </p>
      </section>
     {locality.municipality}
            </span>
          ) : null}
        </div>
      </header>
      <section className="mt-8 max-w-3xl text-sm text-gray-600 leading-7">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          About {locality.name}, Jaipur
        </h2>
        <p>
          {locality.name} is a key locality in Jaipur with active venues,
          local experiences, and ongoing events. This page helps you discover
          what’s happening in the area, explore venues, and browse both
          upcoming and past events.
        </p>
      </section>

      <div className="mt-6 flex flex-wrap gap-3">
        <a href={`/jaipur/${locality.slug}/events`} className="text-blue-600 text-sm">
          View all events in {locality.name} →
        </a>
      </div>


      <EventSectionGrid
        title={`Upcoming events in ${locality.name}`}
        description={`Discover upcoming events, experiences, and gatherings happening in ${locality.name}, Jaipur.`}
        events={upcomingEvents}
        emptyText={`No upcoming events are currently linked to ${locality.name}.`}
      />

      <EventSectionGrid
        title={`Event history in ${locality.name}`}
        description={`JaipurCircle keeps event pages live after they end, helping build a permanent searchable event memory for ${locality.name}.`}
        events={pastEvents}
        emptyText={`No past event archive is currently available for ${locality.name}.`}
      />

      <section className="mt-12">
        <h2 className="text-xl font-semibold">Popular venues in {locality.name}</h2>
        <p className="mt-2 text-sm text-gray-600">
          Explore venues connected to this locality and use them as discovery hubs for events in Jaipur.
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
                    `${venue.name} is a venue in ${locality.name}, Jaipur.`}
                </p>
                <div className="mt-4 text-sm font-medium text-blue-600">
                  View venue page →
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-600">
            No venue cluster is available for this locality yet.
          </div>
        )}
      </section>
    </main>
  );
}
