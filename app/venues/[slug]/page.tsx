import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase";
import LocalityEventGrid from "@/components/locality/LocalityEventGrid";
import {
  getUpcomingEventsForVenue,
  getPastEventsForVenue,
  getVenuesForLocality,
} from "@/lib/events/queries";

export const dynamic = "force-dynamic";

function countItems(items: any[] | null | undefined) {
  return Array.isArray(items) ? items.length : 0;
}

export async function generateMetadata(
  props: { params: Promise<{ slug: string }> }
) {
  const { slug } = await props.params;
  const supabase = createServerSupabaseClient();

  const { data: venue } = await supabase
    .from("venues")
    .select("name, slug, description, seo_blurb, locality_id")
    .eq("slug", slug)
    .single();

  if (!venue) {
    return {
      title: "Venue not found | JaipurCircle",
    };
  }

  let localityName: string | null = null;

  if (venue.locality_id) {
    const { data: locality } = await supabase
      .from("localities")
      .select("name")
      .eq("id", venue.locality_id)
      .single();

    localityName = locality?.name || null;
  }

  const title = localityName
    ? `${venue.name}, ${localityName}, Jaipur`
    : `${venue.name}, Jaipur`;

  const description =
    venue.description ||
    venue.seo_blurb ||
    (localityName
      ? `${venue.name} is a venue in ${localityName}, Jaipur. Explore upcoming events, venue context, and related local discovery on JaipurCircle.`
      : `${venue.name} is a venue in Jaipur. Explore upcoming events, venue context, and related local discovery on JaipurCircle.`);

  return {
    title: `${title} | JaipurCircle`,
    description,
    alternates: {
      canonical: `https://www.jaipurcircle.com/venues/${slug}`,
    },
    openGraph: {
      title: `${title} | JaipurCircle`,
      description,
      url: `https://www.jaipurcircle.com/venues/${slug}`,
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

  let locality: any = null;

  if (venue.locality_id) {
    const { data } = await supabase
      .from("localities")
      .select("id, slug, name, zone, municipality, pincode, police_station")
      .eq("id", venue.locality_id)
      .single();

    locality = data || null;
  }

  const [upcomingEvents, pastEvents, localityVenues] = await Promise.all([
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
    locality?.id
      ? getVenuesForLocality(supabase, {
          localityId: locality.id,
          localitySlug: locality.slug,
          limit: 8,
        })
      : Promise.resolve([]),
  ]);

  const relatedVenues = (localityVenues || [])
    .filter((v: any) => v?.id !== venue.id)
    .slice(0, 6);

  const upcomingCount = countItems(upcomingEvents);
  const pastCount = countItems(pastEvents);
  const relatedVenueCount = countItems(relatedVenues);

  const venueTitle = locality?.name
    ? `${venue.name}, ${locality.name}, Jaipur`
    : `${venue.name}, Jaipur`;

  const venueDescription =
    venue.description ||
    venue.seo_blurb ||
    (locality?.name
      ? `${venue.name} is a key venue in ${locality.name}, Jaipur. Explore upcoming events, past event history, and nearby discovery paths on JaipurCircle.`
      : `${venue.name} is a venue in Jaipur. Explore upcoming events, past event history, and nearby discovery paths on JaipurCircle.`);

  return (
    <main className="max-w-7xl mx-auto px-4 py-10">
      <nav className="text-sm text-gray-500">
        <a href="/" className="hover:text-black">
          Home
        </a>
        <span> &gt; </span>
        <a href="/venues" className="hover:text-black">
          Venues
        </a>
        <span> &gt; </span>
        <span className="text-black">{venue.name}</span>
      </nav>

      <header className="mt-6">
        <h1 className="text-3xl md:text-4xl font-bold">{venueTitle}</h1>

        <p className="mt-4 max-w-3xl text-gray-700 leading-7">
          {venueDescription}
        </p>

        <div className="mt-5 flex flex-wrap gap-3 text-sm">
          <span className="rounded-full bg-gray-100 px-4 py-2">
            Venue: {venue.name}
          </span>
          {locality?.name ? (
            <span className="rounded-full bg-gray-100 px-4 py-2">
              Locality: {locality.name}
            </span>
          ) : null}
          <span className="rounded-full bg-gray-100 px-4 py-2">
            Upcoming events: {upcomingCount}
          </span>
          <span className="rounded-full bg-gray-100 px-4 py-2">
            Past events: {pastCount}
          </span>
        </div>

        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          {locality?.slug ? (
            <>
              <a
                href={`/jaipur/${locality.slug}`}
                className="rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-blue-700 hover:bg-blue-100"
              >
                Explore {locality.name} →
              </a>
              <a
                href={`/jaipur/${locality.slug}/events`}
                className="rounded-full border border-gray-200 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
              >
                Events in {locality.name} →
              </a>
            </>
          ) : null}
          <a
            href="/venues"
            className="rounded-full border border-gray-200 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
          >
            All venues →
          </a>
        </div>
      </header>

      <section className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 lg:col-span-2">
          <h2 className="text-xl font-semibold text-gray-900">
            About {venue.name}
          </h2>
          <p className="mt-3 text-gray-700 leading-7">
            {venue.description ||
              venue.seo_blurb ||
              (locality?.name
                ? `${venue.name} is a venue in ${locality.name}, Jaipur. This page helps users discover what’s happening here, browse the venue’s event history, and navigate to nearby local discovery surfaces.`
                : `${venue.name} is a venue in Jaipur. This page helps users discover what’s happening here, browse the venue’s event history, and navigate to related local discovery surfaces.`)}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Venue snapshot
          </h2>
          <div className="mt-4 space-y-3 text-sm text-gray-700">
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">Venue</span>
              <span className="text-right font-medium">{venue.name}</span>
            </div>
            {locality?.name ? (
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">Locality</span>
                <span className="text-right font-medium">{locality.name}</span>
              </div>
            ) : null}
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">Upcoming events</span>
              <span className="text-right font-medium">{upcomingCount}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">Past events</span>
              <span className="text-right font-medium">{pastCount}</span>
            </div>
            {locality?.name ? (
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">Other venues nearby</span>
                <span className="text-right font-medium">
                  {relatedVenueCount}
                </span>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="mt-12">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              Upcoming events at {venue.name}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Discover upcoming events scheduled at {venue.name}
              {locality?.name ? ` in ${locality.name}, Jaipur.` : " in Jaipur."}
            </p>
          </div>
        </div>

        {upcomingCount > 0 ? (
          <LocalityEventGrid
            title=""
            description=""
            events={upcomingEvents}
            emptyText=""
            currentLocalityId={locality?.id || null}
            currentLocalityName={locality?.name || null}
          />
        ) : (
          <div className="mt-5 rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-600">
            <p>No upcoming events are currently listed for {venue.name}.</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <a
                href="/events"
                className="rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-blue-700 hover:bg-blue-100"
              >
                Explore all Jaipur events →
              </a>
              {locality?.slug ? (
                <a
                  href={`/jaipur/${locality.slug}`}
                  className="rounded-full border border-gray-200 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
                >
                  Explore {locality.name} →
                </a>
              ) : null}
            </div>
          </div>
        )}
      </section>

      <section className="mt-12">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              Past events at {venue.name}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              JaipurCircle keeps event pages live after they end, helping build a
              permanent event history for {venue.name}.
            </p>
          </div>
        </div>

        {pastCount > 0 ? (
          <LocalityEventGrid
            title=""
            description=""
            events={pastEvents}
            emptyText=""
            currentLocalityId={locality?.id || null}
            currentLocalityName={locality?.name || null}
          />
        ) : (
          <div className="mt-5 rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-600">
            <p>No past event archive is currently available for {venue.name}.</p>
          </div>
        )}
      </section>

      {locality?.slug ? (
        <section className="mt-12 rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="text-xl font-semibold text-gray-900">
            More in {locality.name}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Use this venue as a starting point to explore the wider {locality.name} discovery graph.
          </p>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <a
              href={`/jaipur/${locality.slug}`}
              className="rounded-2xl border border-gray-200 p-4 transition hover:shadow-sm"
            >
              <div className="text-sm text-gray-500">Locality Hub</div>
              <div className="mt-1 font-semibold text-gray-900">
                Explore {locality.name}
              </div>
            </a>

            <a
              href={`/jaipur/${locality.slug}/events`}
              className="rounded-2xl border border-gray-200 p-4 transition hover:shadow-sm"
            >
              <div className="text-sm text-gray-500">Discovery Path</div>
              <div className="mt-1 font-semibold text-gray-900">
                Events in {locality.name}
              </div>
            </a>

            <a
              href={`/jaipur/${locality.slug}/shopping`}
              className="rounded-2xl border border-gray-200 p-4 transition hover:shadow-sm"
            >
              <div className="text-sm text-gray-500">Discovery Path</div>
              <div className="mt-1 font-semibold text-gray-900">
                Shopping in {locality.name}
              </div>
            </a>

            <a
              href="/jaipur"
              className="rounded-2xl border border-gray-200 p-4 transition hover:shadow-sm"
            >
              <div className="text-sm text-gray-500">Browse More</div>
              <div className="mt-1 font-semibold text-gray-900">
                All Jaipur localities
              </div>
            </a>
          </div>
        </section>
      ) : null}

      {relatedVenueCount > 0 && locality?.name ? (
        <section className="mt-12">
          <h2 className="text-xl font-semibold text-gray-900">
            Other venues in {locality.name}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Explore other venue pages connected to {locality.name}, Jaipur.
          </p>

          <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {relatedVenues.map((relatedVenue: any) => (
              <a
                key={relatedVenue.id}
                href={`/venues/${relatedVenue.slug}`}
                className="block rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <h3 className="text-lg font-semibold text-gray-900">
                  {relatedVenue.name}
                </h3>
                <p className="mt-2 line-clamp-3 text-sm text-gray-600">
                  {relatedVenue.description ||
                    relatedVenue.seo_blurb ||
                    `${relatedVenue.name} is a venue connected to ${locality.name}, Jaipur.`}
                </p>
                <div className="mt-4 text-sm font-medium text-blue-600">
                  View venue page →
                </div>
              </a>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-12">
        <h2 className="text-xl font-semibold text-gray-900">Venue context</h2>
        <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-gray-100 p-4">
              <div className="text-xs uppercase tracking-wide text-gray-500">
                Name
              </div>
              <div className="mt-1 text-sm font-medium text-gray-900">
                {venue.name}
              </div>
            </div>

            {locality?.name ? (
              <a
                href={`/jaipur/${locality.slug}`}
                className="block rounded-xl border border-gray-100 p-4 hover:bg-gray-50"
              >
                <div className="text-xs uppercase tracking-wide text-gray-500">
                  Locality
                </div>
                <div className="mt-1 text-sm font-medium text-blue-700">
                  {locality.name}
                </div>
              </a>
            ) : null}

            {locality?.zone ? (
              <div className="rounded-xl border border-gray-100 p-4">
                <div className="text-xs uppercase tracking-wide text-gray-500">
                  Zone
                </div>
                <div className="mt-1 text-sm font-medium text-gray-900">
                  {locality.zone}
                </div>
              </div>
            ) : null}

            {locality?.municipality ? (
              <div className="rounded-xl border border-gray-100 p-4">
                <div className="text-xs uppercase tracking-wide text-gray-500">
                  Municipality
                </div>
                <div className="mt-1 text-sm font-medium text-gray-900">
                  {locality.municipality}
                </div>
              </div>
            ) : null}

            {locality?.pincode ? (
              <div className="rounded-xl border border-gray-100 p-4">
                <div className="text-xs uppercase tracking-wide text-gray-500">
                  Pincode
                </div>
                <div className="mt-1 text-sm font-medium text-gray-900">
                  {locality.pincode}
                </div>
              </div>
            ) : null}

            {locality?.police_station ? (
              <div className="rounded-xl border border-gray-100 p-4">
                <div className="text-xs uppercase tracking-wide text-gray-500">
                  Police Station
                </div>
                <div className="mt-1 text-sm font-medium text-gray-900">
                  {locality.police_station}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}
