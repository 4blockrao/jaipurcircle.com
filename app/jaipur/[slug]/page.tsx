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

type EventsSectionCopy = {
  heading: string;
  description: string;
  emptyText: string;
};

type VenuesSectionCopy = {
  heading: string;
  description: string;
  emptyText: string;
};

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

function normalizeSlugText(value?: string | null) {
  return String(value || "")
    .replace(/-/g, " ")
    .trim()
    .toLowerCase();
}

function eventMatchesLocality(event: any, locality: any) {
  if (!event || !locality) return false;
  if (event?.locality_id && event.locality_id === locality.id) return true;

  const eventLocality = normalizeSlugText(event?.locality);
  const localitySlug = normalizeSlugText(locality?.slug);
  const localityName = normalizeSlugText(locality?.name);

  return !!eventLocality && (eventLocality === localitySlug || eventLocality === localityName);
}

function venueMatchesLocality(venue: any, locality: any) {
  if (!venue || !locality) return false;
  return !!venue?.locality_id && venue.locality_id === locality.id;
}

function dedupeById(items: any[] | null | undefined) {
  const seen = new Set<string>();
  const out: any[] = [];

  for (const item of items || []) {
    const id = item?.id;
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(item);
  }

  return out;
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

  if (exactUpcomingCount >= 1 || exactVenueCount >= 1 || pastCount >= 1) {
    return "developing";
  }

  return "thin";
}

function getTierLabel(tier: LocalityTier) {
  if (tier === "strong") return "Strong Hub";
  if (tier === "developing") return "Developing Hub";
  return "Coverage Seed";
}

function getPrimaryEventsSectionCopy({
  tier,
  localityName,
  exactUpcomingCount,
}: {
  tier: LocalityTier;
  localityName: string;
  exactUpcomingCount: number;
}): EventsSectionCopy {
  if (tier === "strong") {
    return {
      heading: `Upcoming events in ${localityName}`,
      description: `Discover upcoming events, experiences, and gatherings directly connected to ${localityName}, Jaipur.`,
      emptyText: `No upcoming events are currently linked to ${localityName}.`,
    };
  }

  if (tier === "developing") {
    return {
      heading:
        exactUpcomingCount > 0
          ? `Upcoming events in ${localityName}`
          : `Popular upcoming events near ${localityName}`,
      description:
        exactUpcomingCount > 0
          ? `${localityName} already has exact event coverage, and JaipurCircle will keep strengthening this locality’s own event graph over time.`
          : `There may not be enough exact locality-tagged events yet, so this section shows relevant upcoming Jaipur events around and beyond ${localityName}.`,
      emptyText:
        exactUpcomingCount > 0
          ? `No upcoming events are currently linked to ${localityName}.`
          : `No relevant upcoming events were found near ${localityName} right now.`,
    };
  }

  return {
    heading: `Explore nearby events from ${localityName}`,
    description: `${localityName} is still building exact event density, so JaipurCircle surfaces nearby and city-wide events to keep this locality page useful.`,
    emptyText: `No nearby or city-wide upcoming events are available from ${localityName} right now.`,
  };
}

function getFallbackEventsSectionCopy(localityName: string): EventsSectionCopy {
  return {
    heading: `More events around ${localityName}`,
    description: `These are relevant nearby or broader Jaipur events that complement the exact locality feed for ${localityName}.`,
    emptyText: `No additional nearby events are available around ${localityName} right now.`,
  };
}

function getPrimaryArchiveSectionCopy({
  tier,
  localityName,
  exactPastCount,
}: {
  tier: LocalityTier;
  localityName: string;
  exactPastCount: number;
}): EventsSectionCopy {
  if (tier === "strong") {
    return {
      heading: `Event history in ${localityName}`,
      description:
        exactPastCount > 0
          ? `JaipurCircle preserves exact event memory for ${localityName}, helping this locality page compound into a stronger long-term archive.`
          : `JaipurCircle is building a permanent event memory layer for ${localityName}, so this locality can compound over time rather than reset after each cycle.`,
      emptyText: `No exact past event archive is currently available for ${localityName}.`,
    };
  }

  if (tier === "developing") {
    return {
      heading: `Event history in ${localityName}`,
      description:
        exactPastCount > 0
          ? `JaipurCircle keeps past events visible for ${localityName} wherever possible so locality pages retain memory and search value over time.`
          : `Historical locality memory for ${localityName} is still developing, but JaipurCircle is designed to preserve relevant archive value as inventory grows.`,
      emptyText: `No exact past event archive is currently available for ${localityName}.`,
    };
  }

  return {
    heading: `Archive memory for ${localityName}`,
    description: `${localityName} is still thin, but JaipurCircle is structured to preserve locality-linked event memory as the page matures over time.`,
    emptyText: `No exact past event archive is currently available for ${localityName}.`,
  };
}

function getArchiveFallbackSectionCopy(localityName: string): EventsSectionCopy {
  return {
    heading: `Related past events around ${localityName}`,
    description: `These older events extend the locality memory layer for ${localityName} using nearby or broader Jaipur archive relevance.`,
    emptyText: `No related past event memory is currently available around ${localityName}.`,
  };
}

function getPrimaryVenuesSectionCopy({
  tier,
  localityName,
  exactVenueCount,
}: {
  tier: LocalityTier;
  localityName: string;
  exactVenueCount: number;
}): VenuesSectionCopy {
  if (tier === "strong") {
    if (exactVenueCount > 0) {
      return {
        heading: `Popular venues in ${localityName}`,
        description: `Explore venues directly connected to this locality and use them as discovery hubs for events in Jaipur.`,
        emptyText: `No exact venue cluster is available for ${localityName} yet.`,
      };
    }

    return {
      heading: `Popular venues around ${localityName}`,
      description: `${localityName} already has strong event coverage, but exact venue mapping is still catching up. For now, JaipurCircle shows nearby and supporting venue discovery.`,
      emptyText: `No nearby venue discovery is available around ${localityName} yet.`,
    };
  }

  if (tier === "developing") {
    if (exactVenueCount > 0) {
      return {
        heading: `Popular venues in ${localityName}`,
        description: `Explore venues connected to this locality and use them as discovery hubs for events in Jaipur.`,
        emptyText: `No exact venue cluster is available for ${localityName} yet.`,
      };
    }

    return {
      heading: `Popular venues around ${localityName}`,
      description: `Exact venue coverage for ${localityName} is still growing, so this section shows nearby or broader Jaipur venue discovery.`,
      emptyText: `No useful venue cluster is available around ${localityName} yet.`,
    };
  }

  return {
    heading: `Useful venues near ${localityName}`,
    description: `${localityName} is still a thin locality node, so JaipurCircle uses nearby venue discovery to keep this page navigable and useful.`,
    emptyText: `No nearby venue discovery is available from ${localityName} yet.`,
  };
}

function getFallbackVenuesSectionCopy(localityName: string): VenuesSectionCopy {
  return {
    heading: `More venues around ${localityName}`,
    description: `These supporting venues help extend discovery beyond the exact venue graph for ${localityName}.`,
    emptyText: `No additional nearby venues are available around ${localityName} right now.`,
  };
}

function getLocalityAuthorityIntro({
  tier,
  localityName,
  zone,
  municipality,
}: {
  tier: LocalityTier;
  localityName: string;
  zone?: string | null;
  municipality?: string | null;
}) {
  const civicContext =
    zone || municipality
      ? ` It sits${zone ? ` in the ${zone}` : ""}${
          municipality ? ` under ${municipality}` : ""
        } within Jaipur.`
      : "";

  if (tier === "strong") {
    return `${localityName} is now one of JaipurCircle’s strongest locality hubs, with meaningful exact event coverage, venue depth, and visible event memory.${civicContext} This page is designed to function as a reliable discovery hub for what is happening in and around ${localityName}, while also helping users navigate related venues, nearby localities, and recurring Jaipur activity.`;
  }

  if (tier === "developing") {
    return `${localityName} is an actively developing Jaipur locality hub with growing coverage across events, venues, and local discovery paths.${civicContext} JaipurCircle uses a mix of exact locality inventory and nearby relevant Jaipur discovery to keep this page useful while the locality graph continues to mature.`;
  }

  return `${localityName} is currently in an early coverage phase on JaipurCircle.${civicContext} This page still matters as part of Jaipur’s full locality map, and it will gradually become richer as exact events, venues, civic detail, and nearby discovery signals continue to accumulate.`;
}

function getAuthorityHighlights({
  tier,
  exactUpcomingCount,
  exactVenueCount,
  exactPastCount,
}: {
  tier: LocalityTier;
  exactUpcomingCount: number;
  exactVenueCount: number;
  exactPastCount: number;
}) {
  if (tier === "strong") {
    return [
      `${exactUpcomingCount} exact upcoming event${
        exactUpcomingCount === 1 ? "" : "s"
      } currently mapped`,
      `${exactVenueCount} exact venue${exactVenueCount === 1 ? "" : "s"} contributing to locality strength`,
      `${exactPastCount} archived exact event${exactPastCount === 1 ? "" : "s"} building locality memory`,
    ];
  }

  if (tier === "developing") {
    return [
      `${exactUpcomingCount} exact upcoming event${
        exactUpcomingCount === 1 ? "" : "s"
      } currently mapped`,
      `${exactVenueCount} exact venue${exactVenueCount === 1 ? "" : "s"} currently linked`,
      `${exactPastCount} archived exact event${exactPastCount === 1 ? "" : "s"} supporting locality history`,
    ];
  }

  return [
    "Full locality coverage track retained even while this page is still thin",
    "Nearby events and venues help keep discovery useful in early phases",
    "Archive memory will strengthen as exact locality history accumulates",
  ];
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
  return {
    heading: `${localityName} as a Jaipur discovery hub`,
    body: `${localityName} is no longer just a placeholder locality page. It now has enough exact inventory to behave like a real hyperlocal discovery node, with ${exactUpcomingCount} exact upcoming event${exactUpcomingCount === 1 ? "" : "s"}, ${exactVenueCount} exact venue${exactVenueCount === 1 ? "" : "s"}, and ${exactPastCount} archived exact event${exactPastCount === 1 ? "" : "s"} contributing to local memory. The next goal for this hub is quality compounding: stronger venue context, richer locality comparisons, more authoritative civic detail, and tighter event curation over time.`,
  };
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
    upcomingEventsRaw,
    pastEventsRaw,
    venuesRaw,
    exactUpcomingCountRes,
    exactVenueCountRes,
    exactPastCountRes,
  ] = await Promise.all([
    getUpcomingEventsForLocality(supabase, {
      localityId: locality.id,
      localitySlug: locality.slug,
      limit: 12,
    }),
    getPastEventsForLocality(supabase, {
      localityId: locality.id,
      limit: 12,
    }),
    getVenuesForLocality(supabase, {
      localityId: locality.id,
      localitySlug: locality.slug,
      limit: 12,
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
    supabase
      .from("events")
      .select("id", { count: "exact", head: true })
      .in("status", ["published", "upcoming"])
      .eq("editorial_status", "published")
      .eq("index_status", "index")
      .eq("locality_id", locality.id)
      .lt("start_date", nowIso),
  ]);

  const exactUpcomingCount = exactUpcomingCountRes.count || 0;
  const exactVenueCount = exactVenueCountRes.count || 0;
  const exactPastCount = exactPastCountRes.count || 0;

  const tier = deriveLocalityTier({
    exactUpcomingCount,
    pastCount: exactPastCount,
    exactVenueCount,
  });

  const exactUpcomingEvents = dedupeById(
    (upcomingEventsRaw || []).filter((event: any) => eventMatchesLocality(event, locality))
  ).slice(0, 6);

  const fallbackUpcomingEvents = dedupeById(
    (upcomingEventsRaw || []).filter((event: any) => !eventMatchesLocality(event, locality))
  ).slice(0, 6);

  const exactPastEvents = dedupeById(
    (pastEventsRaw || []).filter((event: any) => eventMatchesLocality(event, locality))
  ).slice(0, 6);

  const fallbackPastEvents = dedupeById(
    (pastEventsRaw || []).filter((event: any) => !eventMatchesLocality(event, locality))
  ).slice(0, 6);

  const exactVenues = dedupeById(
    (venuesRaw || []).filter((venue: any) => venueMatchesLocality(venue, locality))
  ).slice(0, 6);

  const fallbackVenues = dedupeById(
    (venuesRaw || []).filter((venue: any) => !venueMatchesLocality(venue, locality))
  ).slice(0, 6);

  const displayedUpcomingEvents =
    exactUpcomingEvents.length > 0
      ? exactUpcomingEvents
      : fallbackUpcomingEvents.slice(0, 6);

  const displayedPastEvents =
    exactPastEvents.length > 0 ? exactPastEvents : fallbackPastEvents.slice(0, 6);

  const displayedVenueItems =
    exactVenues.length > 0 ? exactVenues : fallbackVenues.slice(0, 6);

  const displayedUpcomingCount = countItems(displayedUpcomingEvents);
  const displayedPastCount = countItems(displayedPastEvents);
  const displayedVenueCount = countItems(displayedVenueItems);

  const primaryEventsSection = getPrimaryEventsSectionCopy({
    tier,
    localityName: locality.name,
    exactUpcomingCount,
  });

  const fallbackEventsSection = getFallbackEventsSectionCopy(locality.name);

  const primaryArchiveSection = getPrimaryArchiveSectionCopy({
    tier,
    localityName: locality.name,
    exactPastCount,
  });

  const archiveFallbackSection = getArchiveFallbackSectionCopy(locality.name);

  const primaryVenuesSection = getPrimaryVenuesSectionCopy({
    tier,
    localityName: locality.name,
    exactVenueCount,
  });

  const fallbackVenuesSection = getFallbackVenuesSectionCopy(locality.name);

  const authorityIntro = getLocalityAuthorityIntro({
    tier,
    localityName: locality.name,
    zone: locality.zone,
    municipality: locality.municipality,
  });

  const authorityHighlights = getAuthorityHighlights({
    tier,
    exactUpcomingCount,
    exactVenueCount,
    exactPastCount,
  });

  const strongHubBlock =
    tier === "strong"
      ? getStrongHubEditorialBlock({
          localityName: locality.name,
          exactUpcomingCount,
          exactVenueCount,
          exactPastCount,
        })
      : null;

  const baseIntro =
    locality.description ||
    locality.seo_blurb ||
    `${locality.name} is one of Jaipur’s important localities. Explore what is happening here, discover venues, and browse upcoming and past events connected to this area.`;

  const shouldShowFallbackEvents =
    exactUpcomingEvents.length > 0 &&
    fallbackUpcomingEvents.length > 0 &&
    tier !== "thin";

  const shouldShowArchiveFallback =
    exactPastEvents.length > 0 &&
    fallbackPastEvents.length > 0 &&
    tier !== "thin";

  const shouldShowFallbackVenues =
    exactVenues.length > 0 &&
    fallbackVenues.length > 0 &&
    tier !== "thin";

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
            Exact Archive Events: {exactPastCount}
          </span>
          <span className="rounded-full bg-gray-100 px-4 py-2">
            Exact Local Venues: {exactVenueCount}
          </span>
          <span className="rounded-full bg-gray-100 px-4 py-2">
            Displayed Venues: {displayedVenueCount}
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
          <p className="mt-3 text-gray-700 leading-7">{authorityIntro}</p>
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
              <span className="text-gray-500">Exact archive events</span>
              <span className="text-right font-medium">{exactPastCount}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">Displayed archive events</span>
              <span className="text-right font-medium">
                {displayedPastCount}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">Exact venues</span>
              <span className="text-right font-medium">{exactVenueCount}</span>
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

      <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="text-xl font-semibold text-gray-900">
          {locality.name} authority signals
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          These signals indicate how this locality is maturing inside JaipurCircle’s city-wide discovery graph.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
          {authorityHighlights.map((item, index) => (
            <div
              key={`${locality.slug}-authority-${index}`}
              className="rounded-xl border border-gray-100 p-4 text-sm text-gray-700"
            >
              {item}
            </div>
          ))}
        </div>
      </section>

      {strongHubBlock ? (
        <section className="mt-8 rounded-2xl border border-blue-100 bg-blue-50/40 p-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {strongHubBlock.heading}
          </h2>
          <p className="mt-3 text-gray-700 leading-7">{strongHubBlock.body}</p>
        </section>
      ) : null}

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
              {primaryEventsSection.heading}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {primaryEventsSection.description}
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
            events={displayedUpcomingEvents}
            emptyText=""
            currentLocalityId={locality.id}
            currentLocalityName={locality.name}
          />
        ) : (
          <div className="mt-5 rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-600">
            <p>{primaryEventsSection.emptyText}</p>
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

        {shouldShowFallbackEvents ? (
          <div className="mt-10">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {fallbackEventsSection.heading}
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  {fallbackEventsSection.description}
                </p>
              </div>
            </div>

            <LocalityEventGrid
              title=""
              description=""
              events={fallbackUpcomingEvents}
              emptyText=""
              currentLocalityId={locality.id}
              currentLocalityName={locality.name}
            />
          </div>
        ) : null}
      </section>

      <section className="mt-12">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              {primaryArchiveSection.heading}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {primaryArchiveSection.description}
            </p>
          </div>
        </div>

        {displayedPastCount > 0 ? (
          <LocalityEventGrid
            title=""
            description=""
            events={displayedPastEvents}
            emptyText=""
            currentLocalityId={locality.id}
            currentLocalityName={locality.name}
          />
        ) : (
          <div className="mt-5 rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-600">
            <p>{primaryArchiveSection.emptyText}</p>
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

        {shouldShowArchiveFallback ? (
          <div className="mt-10">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {archiveFallbackSection.heading}
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  {archiveFallbackSection.description}
                </p>
              </div>
            </div>

            <LocalityEventGrid
              title=""
              description=""
              events={fallbackPastEvents}
              emptyText=""
              currentLocalityId={locality.id}
              currentLocalityName={locality.name}
            />
          </div>
        ) : null}
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold">{primaryVenuesSection.heading}</h2>
        <p className="mt-2 text-sm text-gray-600">{primaryVenuesSection.description}</p>

        {displayedVenueCount > 0 ? (
          <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {displayedVenueItems.map((venue: any) => (
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
            <p>{primaryVenuesSection.emptyText}</p>
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

        {shouldShowFallbackVenues ? (
          <div className="mt-10">
            <h3 className="text-xl font-semibold text-gray-900">
              {fallbackVenuesSection.heading}
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              {fallbackVenuesSection.description}
            </p>

            <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {fallbackVenues.map((venue: any) => (
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
                      `${venue.name} is a nearby or supporting venue relevant to ${locality.name}, Jaipur.`}
                  </p>
                  <div className="mt-4 text-sm font-medium text-blue-600">
                    View venue page →
                  </div>
                </a>
              ))}
            </div>
          </div>
        ) : null}
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
