import NearbyLocalities from "@/components/locality/NearbyLocalities";
import LocalityFAQ from "@/components/locality/LocalityFAQ";
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
    .select("name, meta_title, meta_description, should_index")
    .eq("slug", slug)
    .single();

  if (!locality || !locality.should_index) {
    return {
      title: "Locality not found | JaipurCircle",
    };
  }

  return {
    title:
      locality.meta_title ||
      `${locality.name} Jaipur – Events, Venues & Things to Do | JaipurCircle`,
    description:
      locality.meta_description ||
      `Discover events, venues, and things to do in ${locality.name}, Jaipur.`,
    alternates: {
      canonical: `https://www.jaipurcircle.com/jaipur/${slug}`,
    },
    openGraph: {
      title:
        locality.meta_title ||
        `${locality.name} Jaipur – Events, Venues & Things to Do`,
      description:
        locality.meta_description ||
        `Discover events, venues, and things to do in ${locality.name}, Jaipur.`,
      url: `https://www.jaipurcircle.com/jaipur/${slug}`,
    },
  };
}

function countItems(items: any[] | null | undefined) {
  return Array.isArray(items) ? items.length : 0;
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

  const upcomingCount = countItems(upcomingEvents);
  const pastCount = countItems(pastEvents);
  const venueCount = countItems(venues);

  return (
    <main className="max-w-7xl mx-auto px-4 py-10">
      <nav className="text-sm text-gray-500">
        <a href="/" className="hover:text-black">Home</a>
        <span> &gt; </span>
        <a href="/jaipur" className="hover:text-black">Jaipur</a>
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
              Municipality: {locality.municipality}
            </span>
          ) : null}
          <span className="rounded-full bg-gray-100 px-4 py-2">
            Upcoming Events: {upcomingCount}
          </span>
          <span className="rounded-full bg-gray-100 px-4 py-2">
            Venues: {venueCount}
          </span>
        </div>

        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          <a
            href={`/jaipur/${locality.slug}/events`}
            className="rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-blue-700 hover:bg-blue-100"
          >
            Explore events in {locality.name} →
          </a>

          <a
            href={`/jaipur/${locality.slug}/news`}
            className="rounded-full border border-gray-200 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
          >
            Local news →
          </a>

          <a
            href={`/jaipur/${locality.slug}/shopping`}
            className="rounded-full border border-gray-200 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
          >
            Shopping & deals →
          </a>
        </div>
      </header>

      <section className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="text-xl font-semibold text-gray-900">
            About {locality.name}, Jaipur
          </h2>
          <p className="mt-3 text-gray-700 leading-7">
            {locality.seo_content ||
              locality.description ||
              locality.seo_blurb ||
              `${locality.name} is a Jaipur locality page on JaipurCircle designed to help users discover events, venues, and local activity. This hub is intended to become the search-first landing page for area-specific discovery, local experiences, and neighborhood relevance in Jaipur.`}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Locality snapshot
          </h2>
          <div className="mt-4 space-y-3 text-sm text-gray-700">
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">Zone</span>
              <span className="font-medium text-right">{locality.zone || "—"}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">Municipality</span>
              <span className="font-medium text-right">{locality.municipality || "—"}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">Upcoming events</span>
              <span className="font-medium text-right">{upcomingCount}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">Past events</span>
              <span className="font-medium text-right">{pastCount}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">Venues</span>
              <span className="font-medium text-right">{venueCount}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-10 rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="text-xl font-semibold text-gray-900">
          Explore {locality.name}
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Use these locality discovery paths to browse structured JaipurCircle content for this area.
        </p>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <a href={`/jaipur/${locality.slug}/events`} className="rounded-2xl border border-gray-200 p-4 hover:shadow-sm transition">
            <div className="text-sm text-gray-500">Category Page</div>
            <div className="mt-1 font-semibold text-gray-900">Events in {locality.name}</div>
          </a>

          <a href={`/jaipur/${locality.slug}/news`} className="rounded-2xl border border-gray-200 p-4 hover:shadow-sm transition">
            <div className="text-sm text-gray-500">Category Page</div>
            <div className="mt-1 font-semibold text-gray-900">News in {locality.name}</div>
          </a>

          <a href={`/jaipur/${locality.slug}/shopping`} className="rounded-2xl border border-gray-200 p-4 hover:shadow-sm transition">
            <div className="text-sm text-gray-500">Category Page</div>
            <div className="mt-1 font-semibold text-gray-900">Shopping in {locality.name}</div>
          </a>

          <a href="/jaipur" className="rounded-2xl border border-gray-200 p-4 hover:shadow-sm transition">
            <div className="text-sm text-gray-500">Browse More</div>
            <div className="mt-1 font-semibold text-gray-900">All Jaipur localities</div>
          </a>
        </div>
      </section>

      <section className="mt-12">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              Upcoming events in {locality.name}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Discover upcoming events, experiences, and gatherings connected to {locality.name}, Jaipur.
            </p>
          </div>
          <a href={`/jaipur/${locality.slug}/events`} className="text-sm font-medium text-blue-600">
            View all →
          </a>
        </div>

        {upcomingCount > 0 ? (
          <EventSectionGrid
            title=""
            description=""
            events={upcomingEvents}
            emptyText=""
          />
        ) : (
          <div className="mt-5 rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-600">
            No upcoming events are currently linked to {locality.name}. Explore broader Jaipur events or nearby localities as this page grows.
          </div>
        )}
      </section>

      <section className="mt-12">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              Event history in {locality.name}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              JaipurCircle keeps past event memory visible wherever possible so locality pages can compound over time.
            </p>
          </div>
        </div>

        {pastCount > 0 ? (
          <EventSectionGrid
            title=""
            description=""
            events={pastEvents}
            emptyText=""
          />
        ) : (
          <div className="mt-5 rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-600">
            No past event archive is currently available for {locality.name}.
          </div>
        )}
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold">Popular venues in {locality.name}</h2>
        <p className="mt-2 text-sm text-gray-600">
          Explore venues connected to this locality and use them as discovery hubs for events in Jaipur.
        </p>

        {venueCount > 0 ? (
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
                    `${venue.name} is a venue connected to ${locality.name}, Jaipur.`}
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
    
      
      <NearbyLocalities
        currentSlug={locality.slug}
        nearbyLocalities={locality.nearby_localities}
      />

<LocalityFAQ
        name={locality.name}
        zone={locality.zone}
        municipality={locality.municipality}
      />

</main>
  );
}
