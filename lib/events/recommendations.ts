import {
  trimEventSection,
  hasMeaningfulEventSection,
} from "@/lib/events/core";
import {
  getEventsByArtist,
  getEventsByLocality,
  getEventsByVenue,
} from "@/lib/events/queries";

type Section = {
  key: string;
  title: string;
  description: string;
  events: any[];
};

function normalizeCategory(category?: string | null) {
  if (!category) return null;
  return String(category).trim().toLowerCase();
}

function inferEventIntent(event: any): "artist-first" | "venue-first" | "locality-first" {
  const category = normalizeCategory(event?.category);

  if (
    category &&
    ["music", "concert", "comedy", "nightlife", "festival"].includes(category)
  ) {
    return "artist-first";
  }

  if (
    category &&
    ["exhibition", "expo", "fair", "market", "conference"].includes(category)
  ) {
    return "venue-first";
  }

  return "locality-first";
}

async function getCategoryFallbackEvents(
  supabase: any,
  {
    currentEventId,
    category,
    limit = 6,
    excludeIds = [],
  }: {
    currentEventId: string;
    category?: string | null;
    limit?: number;
    excludeIds?: string[];
  }
) {
  if (!category) return [];

  const { data } = await supabase
    .from("events")
    .select("*")
    .neq("id", currentEventId)
    .eq("status", "published")
    .eq("editorial_status", "published")
    .eq("index_status", "index")
    .eq("category", category)
    .limit(limit * 4);

  return trimEventSection(data || [], {
    limit,
    excludeIds,
  });
}

function dedupeSectionEvents(sections: Section[]) {
  const seen = new Set<string>();

  return sections
    .map((section) => {
      const events = (section.events || []).filter((event: any) => {
        if (!event?.id) return false;
        if (seen.has(event.id)) return false;
        seen.add(event.id);
        return true;
      });

      return {
        ...section,
        events,
      };
    })
    .filter((section) => hasMeaningfulEventSection(section.events, 2));
}

export async function buildEventRecommendationSections(
  supabase: any,
  {
    event,
    artists,
    locality,
    venue,
  }: {
    event: any;
    artists: any[];
    locality: any | null;
    venue: any | null;
  }
) {
  const artistIds = (artists || []).map((a: any) => a.id).filter(Boolean);
  const intent = inferEventIntent(event);
  const titlePrefix = event?.start_date || event?.start_time
    ? new Date(event.start_date || event.start_time) < new Date()
      ? "More upcoming"
      : "More"
    : "More";

  const artistEvents = await getEventsByArtist(supabase, {
    eventId: event.id,
    artistIds,
    limit: 6,
    excludeIds: [event.id],
  });

  const venueEvents = await getEventsByVenue(supabase, {
    eventId: event.id,
    venueId: event.venue_id,
    venueName: event.venue_name || venue?.name || null,
    limit: 6,
    excludeIds: [event.id],
  });

  const localityEvents = await getEventsByLocality(supabase, {
    eventId: event.id,
    localityId: event.locality_id,
    localitySlug: event.locality || locality?.slug || null,
    limit: 6,
    excludeIds: [event.id],
  });

  const categoryFallbackEvents = await getCategoryFallbackEvents(supabase, {
    currentEventId: event.id,
    category: event.category,
    limit: 6,
    excludeIds: [event.id],
  });

  const sectionsBase: Record<string, Section> = {
    artist: {
      key: "artist",
      title: `${titlePrefix} events by ${artists?.[0]?.name || "this artist"}`,
      description: `Explore more Jaipur events connected to ${artists?.[0]?.name || "this artist"}.`,
      events: artistEvents,
    },
    venue: {
      key: "venue",
      title: `${titlePrefix} events at ${event.venue_name || venue?.name || "this venue"}`,
      description: `Discover more Jaipur events happening at ${event.venue_name || venue?.name || "this venue"}.`,
      events: venueEvents,
    },
    locality: {
      key: "locality",
      title: `${titlePrefix} events in ${event.locality || locality?.name || "this locality"}`,
      description: `Explore more Jaipur events connected to ${event.locality || locality?.name || "this locality"}.`,
      events: localityEvents,
    },
    category: {
      key: "category",
      title: `${titlePrefix} ${event.category || "related"} events in Jaipur`,
      description: `Discover more Jaipur events in the ${event.category || "same"} category.`,
      events: categoryFallbackEvents,
    },
  };

  let orderedKeys: string[] = [];

  if (intent === "artist-first") {
    orderedKeys = ["artist", "venue", "locality", "category"];
  } else if (intent === "venue-first") {
    orderedKeys = ["venue", "locality", "category", "artist"];
  } else {
    orderedKeys = ["locality", "venue", "category", "artist"];
  }

  const sections = orderedKeys.map((key) => sectionsBase[key]);

  return dedupeSectionEvents(sections);
}
