import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase";
import LocalityEventGrid from "@/components/locality/LocalityEventGrid";
import {
  getPastEventsForLocality,
  getUpcomingEventsForLocality,
  getVenuesForLocality,
} from "@/lib/events/queries";
import CivicFacts from "@/components/locality/CivicFacts";
import NearbyLocalities from "@/components/locality/NearbyLocalities";
import LocalityIntentMatrix from "@/components/locality/LocalityIntentMatrix";
import LocalityFAQ from "@/components/locality/LocalityFAQ";
import LocalityDifferentiation from "@/components/locality/LocalityDifferentiation";

export const dynamic = "force-dynamic";

type LocalityTier = "strong" | "developing" | "thin";

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

function deriveLocalityTier({
  exactUpcomingCount,
  pastCount,
  exactVenueCount,
}: {
  exactUpcomingCount: number;
  pastCount: number;
  exactVenueCount: number;
}): LocalityTier {
  if (
    exactUpcomingCount >= 3 ||
    exactVenueCount >= 4 ||
    (exactUpcomingCount >= 2 && exactVenueCount >= 2) ||
    (pastCount >= 6 && exactVenueCount >= 2)
  ) {
    return "strong";
  }

  if (
    exactUpcomingCount >= 1 ||
    exactVenueCount >= 1 ||
    pastCount >= 1
  ) {
    return "developing";
  }

  return "thin";
}

function getEventsSectionCopy({
  tier,
  localityName,
  exactUpcomingCount,
}: {
  tier: LocalityTier;
  localityName: string;
  exactUpcomingCount: number;
}) {
  if (tier === "strong") {
    return {
      heading: `Upcoming events in ${localityName}`,
      description: `Discover upcoming events, experiences, and gatherings directly connected to ${localityName}, Jaipur.`,
      emptyText: `No upcoming events are currently linked to ${localityName}.`,
    };
  }

  if (tier === "developing") {
    return {
      heading: `Popular upcoming events near ${localityName}`,
      description:
        exactUpcomingCount > 0
          ? `${localityName} already has some exact event coverage, and this section also expands discovery with nearby relevant Jaipur events.`
          : `There may not be enough exact locality-tagged events yet, so this section shows relevant upcoming Jaipur events around and beyond ${localityName}.`,
      emptyText: `No relevant upcoming events were found near ${localityName} right now.`,
    };
  }

  return {
    heading: `Explore nearby events from ${localityName}`,
    description: `${localityName} is still building exact event density, so JaipurCircle surfaces nearby and city-wide events to keep this locality page useful.`,
    emptyText: `No nearby or city-wide upcoming events are available from ${localityName} right now.`,
  };
}

function getVenuesSectionCopy({
  tier,
  localityName,
  exactVenueCount,
}: {
  tier: LocalityTier;
  localityName: string;
  exactVenueCount: number;
}) {
  if (tier === "strong") {
    return {
      heading: `Popular venues in ${localityName}`,
      description: `Explore venues connected to this locality and use them as discovery hubs for events in Jaipur.`,
      emptyText: `No venue cluster is available for ${localityName} yet.`,
    };
  }

  if (tier === "developing") {
    return {
      heading: `Popular venues around ${localityName}`,
      description:
        exactVenueCount > 0
          ? `${localityName} already has some exact venue coverage, and this section expands the cluster with nearby useful venue discovery.`
          : `Exact venue coverage for ${localityName} is still growing, so this section shows nearby or broader Jaipur venue discovery.`,
      emptyText: `No useful venue cluster is available around ${localityName} yet.`,
    };
  }

  return {
    heading: `Useful venues near ${localityName}`,
    description: `${localityName} is still a thin locality node, so JaipurCircle uses nearby venue discovery to keep this page navigable and useful.`,
    emptyText: `No nearby venue discovery is available from ${localityName} yet.`,
  };
}

function getHubIntro({
  tier,
  localityName,
  baseText,
}: {
  tier: LocalityTier;
  localityName: string;
  baseText: string;
}) {
  if (tier === "strong") return baseText;

  if (tier === "developing") {
    return `${baseText} This locality is now evolving into an active Jaipur discovery hub with growing event and venue coverage.`;
  }

  return `${baseText} This locality is currently in an early coverage phase, and JaipurCircle is progressively enriching it with events, venues, civic facts, and nearby discovery paths.`;
}

function getTierLabel(tier: LocalityTier) {
  if (tier === "strong") return "Strong Hub";
  if (tier === "developing") return "Developing Hub";
  return "Coverage Seed";
}

export default async function LocalityPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = createServerSupabaseClient();
  const nowIso = new Date().toISOString();

  const { data: locality, error } = await supabase
    .from("localities")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!locality || error || !locality.should_index) return notFound();

  const [
    upcomingEvents,
    pastEvents,
    venues,
    exactUpcomingCountRes,
    exactVenueCountRes,
  ] = await Promise.all([
    getUpcomingEventsForLocality(supabase, {
      localityId: locality.id,
      localitySlug: locality.slug,
      limit: 6,
    }),
    getPastEventsForLocality(supabase, {
      localityId: locality.id,
      limit: 6,
    }),
    getVenuesForLocality(supabase, {
      localityId: locality.id,
      localitySlug: locality.slug,
      limit: 6,
    }),
    supabase
      .from("events")
      .select("id", { count: "exact", head: true })
      .in("status", ["published", "upcoming"])
      .eq("editorial_status", "published")
      .eq("index_status", "index")
      .eq("locality_id", locality.id)
      .gte("start_date", nowIso),
    supabase
      .from("venues")
      .select("id", { count: "exact", head: true })
      .eq("locality_id", locality.id),
  ]);

  const displayedUpcomingCount = countItems(upcomingEvents);
  const displayedPastCount = countItems(pastEvents);
  const displayedVenueCount = countItems(venues);

  const exactUpcomingCount = exactUpcomingCountRes.count || 0;
  const exactVenueCount = exactVenueCountRes.count || 0;

  const tier = deriveLocalityTier({
    exactUpcomingCount,
    pastCount: displayedPastCount,
    exactVenueCount,
  });

  const eventsSection = getEventsSectionCopy({
    tier,
    localityName: locality.name,
    exactUpcomingCount,
  });

  const venuesSection = getVenuesSectionCopy({
    tier,
    localityName: locality.name,
    exactVenueCount,
  });

  const baseIntro =
    locality.description ||
    locality.seo_blurb ||
    `${locality.name} is one of Jaipur’s important localities. Explore what is happening here, discover venues, and browse upcoming and past events connected to this area.`;

  const aboutText = getHubIntro({
    tier,
    localityName: locality.name,
    baseText:
      locality.seo_content ||
      locality.description ||
      locality.seo_blurb ||
      `${locality.name} is a Jaipur locality page on JaipurCircle designed to help users discover events, venues, and local activity. This hub is intended to become the search-first landing page for area-specific discovery, local experiences, and neighborhood relevance in Jaipur.`,
  });

  return (
    <main className="max-w-7xl mx-auto px-4 py-10">
      <nav className="text-sm text-gray-500">
        <a href="/" className="hover:text-black">
          Home
        </a>
        <span> &gt; </span>
        <a href="/jaipur" className="hover:text-black">
          Jaipur
        </a>
        <span> &gt; </span>
        <span className="text-black">{locality.name}</span>
      </nav>

      <header className="mt-6">
        <h1 className="text-3xl md:text-4xl font-bold">
          {locality.h1_override || `${locality.name}, Jaipur`}
        </h1>

        <p className="mt-4 max-w-3xl text-gray-700 leading-7">{baseIntro}</p>

        <div className="mt-5 flex flex-wrap gap-3 text-sm">
          <span className="rounded-full bg-gray-100 px-4 py-2">
            Locality: {locality.name}
          </span>
          <span className="rounded-full bg-gray-100 px-4 py-2">
            Tier: {getTierLabel(tier)}
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
            Exact Local Events: {exactUpcomingCount}
          </span>
          <span className="rounded-full bg-gray-100 px-4 py-2">
            Displayed Events: {displayedUpcomingCount}
          </span>
          <span className="rounded-full bg-gray-100 px-4 py-2">
            Exact Local Venues: {exactVenueCount}
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

      <section className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 lg:col-span-2">
          <h2 className="text-xl font-semibold text-gray-900">
            About {locality.name}, Jaipur
          </h2>
          <p className="mt-3 text-gray-700 leading-7">{aboutText}</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Locality snapshot
          </h2>
          <div className="mt-4 space-y-3 text-sm text-gray-700">
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">Tier</span>
              <span className="text-right font-medium">{getTierLabel(tier)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">Zone</span>
              <span className="text-right font-medium">
                {locality.zone || "—"}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">Municipality</span>
              <span className="text-right font-medium">
                {locality.municipality || "—"}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">Exact upcoming events</span>
              <span className="text-right font-medium">
                {exactUpcomingCount}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">Displayed upcoming events</span>
              <span className="text-right font-medium">
                {displayedUpcomingCount}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">Past events</span>
              <span className="text-right font-medium">
                {displayedPastCount}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">Displayed venues</span>
              <span className="text-right font-medium">
                {displayedVenueCount}
              </span>
            </div>
          </div>
        </div>
      </section>

      <LocalityDifferentiation
        name={locality.name}
        bestFor={locality.best_for}
        vibeTags={locality.vibe_tags}
        knownFor={locality.known_for}
      />

      <section className="mt-10 rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="text-xl font-semibold text-gray-900">
          Explore {locality.name}
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Use these locality discovery paths to browse structured JaipurCircle
          content for this area.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <a
            href={`/jaipur/${locality.slug}/events`}
            className="rounded-2xl border border-gray-200 p-4 transition hover:shadow-sm"
          >
            <div className="text-sm text-gray-500">Category Page</div>
            <div className="mt-1 font-semibold text-gray-900">
              Events in {locality.name}
            </div>
          </a>

          <a
            href={`/jaipur/${locality.slug}/news`}
            className="rounded-2xl border border-gray-200 p-4 transition hover:shadow-sm"
          >
            <div className="text-sm text-gray-500">Category Page</div>
            <div className="mt-1 font-semibold text-gray-900">
              News in {locality.name}
            </div>
          </a>

          <a
            href={`/jaipur/${locality.slug}/shopping`}
            className="rounded-2xl border border-gray-200 p-4 transition hover:shadow-sm"
          >
            <div className="text-sm text-gray-500">Category Page</div>
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

      <section className="mt-12">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              {eventsSection.heading}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {eventsSection.description}
            </p>
          </div>
          <a
            href={`/jaipur/${locality.slug}/events`}
            className="text-sm font-medium text-blue-600"
          >
            View all →
          </a>
        </div>

        {displayedUpcomingCount > 0 ? (
          <LocalityEventGrid
            title=""
            description=""
            events={upcomingEvents}
            emptyText=""
            currentLocalityId={locality.id}
            currentLocalityName={locality.name}
          />
        ) : (
          <div className="mt-5 rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-600">
            <p>{eventsSection.emptyText}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <a
                href="/events"
                className="rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-blue-700 hover:bg-blue-100"
              >
                Explore all Jaipur events →
              </a>
              <a
                href="/jaipur"
                className="rounded-full border border-gray-200 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
              >
                Browse other Jaipur localities →
              </a>
            </div>
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
              JaipurCircle keeps past event memory visible wherever possible so
              locality pages can compound over time.
            </p>
          </div>
        </div>

        {displayedPastCount > 0 ? (
          <LocalityEventGrid
            title=""
            description=""
            events={pastEvents}
            emptyText=""
            currentLocalityId={locality.id}
            currentLocalityName={locality.name}
          />
        ) : (
          <div className="mt-5 rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-600">
            <p>No past event archive is currently available for {locality.name}.</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <a
                href={`/jaipur/${locality.slug}/events`}
                className="rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-blue-700 hover:bg-blue-100"
              >
                Check locality events →
              </a>
              <a
                href="/events"
                className="rounded-full border border-gray-200 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
              >
                Explore Jaipur event archive →
              </a>
            </div>
          </div>
        )}
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold">{venuesSection.heading}</h2>
        <p className="mt-2 text-sm text-gray-600">{venuesSection.description}</p>

        {displayedVenueCount > 0 ? (
          <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {venues.map((venue: any) => (
              <a
                key={venue.id}
                href={`/venues/${venue.slug}`}
                className="block rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <h3 className="text-lg font-semibold text-gray-900">
                  {venue.name}
                </h3>
                <p className="mt-2 line-clamp-3 text-sm text-gray-600">
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
            <p>{venuesSection.emptyText}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <a
                href="/venues"
                className="rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-blue-700 hover:bg-blue-100"
              >
                Explore Jaipur venues →
              </a>
              <a
                href="/jaipur"
                className="rounded-full border border-gray-200 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
              >
                Browse other localities →
              </a>
            </div>
          </div>
        )}
      </section>

      <CivicFacts
        name={locality.name}
        zone={locality.zone}
        municipality={locality.municipality}
        pincode={locality.pincode}
        policeStation={locality.police_station}
      />

      <NearbyLocalities
        currentSlug={locality.slug}
        nearbyLocalities={locality.nearby_localities}
      />

      <LocalityIntentMatrix name={locality.name} slug={locality.slug} />

      <LocalityFAQ
        name={locality.name}
        zone={locality.zone}
        municipality={locality.municipality}
      />
    </main>
  );
}
