import {
  dedupeEventsById,
  sortEventsByLifecycle,
  trimEventSection,
} from "@/lib/events/core";

function applyPublicEventFilters(query: any) {
  return query
    .in("status", ["published", "upcoming"])
    .eq("editorial_status", "published")
    .eq("index_status", "index");
}

function uniqueIds(values: any[]) {
  return Array.from(new Set((values || []).filter(Boolean)));
}

async function getNearbyLocalityRows(
  supabase: any,
  localityId?: string | null,
  limit = 5
): Promise<Array<{ locality_id: string; distance_km?: number | null }>> {
  if (!localityId) return [];

  const { data } = await supabase.rpc("get_nearby_locality_ids", {
    p_locality_id: localityId,
    p_limit: limit,
  });

  return (data || []).filter((row: any) => !!row?.locality_id);
}

async function getNearbyLocalityIds(
  supabase: any,
  localityId?: string | null,
  limit = 5
): Promise<string[]> {
  const rows = await getNearbyLocalityRows(supabase, localityId, limit);
  return uniqueIds(rows.map((row) => row.locality_id));
}

function buildNearbyDistanceMap(
  rows: Array<{ locality_id: string; distance_km?: number | null }>
) {
  const map = new Map<string, number>();
  for (const row of rows || []) {
    if (!row?.locality_id) continue;
    map.set(row.locality_id, Number(row.distance_km ?? 999999));
  }
  return map;
}

function normalizeLocalitySlugText(localitySlug?: string | null) {
  if (!localitySlug) return null;
  return localitySlug.replace(/-/g, " ").trim().toLowerCase();
}

function normalizeEventLocalityText(value?: string | null) {
  return String(value || "")
    .replace(/-/g, " ")
    .trim()
    .toLowerCase();
}

function eventStartTs(event: any) {
  const raw = event?.start_date || event?.start_time || event?.published_at;
  const ts = raw ? new Date(raw).getTime() : 0;
  return Number.isFinite(ts) ? ts : 0;
}

function sortByLocalityPriority(
  events: any[],
  {
    exactLocalityId,
    localitySlug,
    nearbyRows = [],
  }: {
    exactLocalityId?: string | null;
    localitySlug?: string | null;
    nearbyRows?: Array<{ locality_id: string; distance_km?: number | null }>;
  }
) {
  const normalizedSlug = normalizeLocalitySlugText(localitySlug);
  const nearbyDistanceMap = buildNearbyDistanceMap(nearbyRows);

  const bucket = (event: any) => {
    if (exactLocalityId && event?.locality_id === exactLocalityId) return 1;

    const normalizedEventLocality = normalizeEventLocalityText(event?.locality);

    if (
      normalizedSlug &&
      normalizedEventLocality &&
      normalizedEventLocality === normalizedSlug
    ) {
      return 2;
    }

    if (event?.locality_id && nearbyDistanceMap.has(event.locality_id)) return 3;

    if (normalizedEventLocality === "jaipur") return 5;

    if (normalizedEventLocality) return 4;

    return 6;
  };

  const distanceScore = (event: any) => {
    if (event?.locality_id && nearbyDistanceMap.has(event.locality_id)) {
      return nearbyDistanceMap.get(event.locality_id) ?? 999999;
    }
    return 999999;
  };

  return [...(events || [])].sort((a: any, b: any) => {
    const bucketDiff = bucket(a) - bucket(b);
    if (bucketDiff !== 0) return bucketDiff;

    const distanceDiff = distanceScore(a) - distanceScore(b);
    if (distanceDiff !== 0) return distanceDiff;

    const dateDiff = eventStartTs(a) - eventStartTs(b);
    if (dateDiff !== 0) return dateDiff;

    const aTitle = String(a?.title || "");
    const bTitle = String(b?.title || "");
    return aTitle.localeCompare(bTitle);
  });
}

export async function getEventsByLocality(
  supabase: any,
  {
    eventId,
    localityId,
    localitySlug,
    limit = 6,
    excludeIds = [],
  }: {
    eventId: string;
    localityId?: string | null;
    localitySlug?: string | null;
    limit?: number;
    excludeIds?: string[];
  }
) {
  const normalized = normalizeLocalitySlugText(localitySlug);
  const nearbyRows = await getNearbyLocalityRows(supabase, localityId, 5);
  const nearbyLocalityIds = uniqueIds(nearbyRows.map((row) => row.locality_id));

  let combined: any[] = [];

  if (localityId) {
    const { data: byId } = await applyPublicEventFilters(
      supabase.from("events").select("*").neq("id", eventId)
    )
      .eq("locality_id", localityId)
      .limit(limit * 4);

    combined = combined.concat(byId || []);
  }

  if (nearbyLocalityIds.length > 0) {
    const { data: nearby } = await applyPublicEventFilters(
      supabase.from("events").select("*").neq("id", eventId)
    )
      .in("locality_id", nearbyLocalityIds)
      .limit(limit * 4);

    combined = combined.concat(nearby || []);
  }

  if (normalized) {
    const { data: bySlug } = await applyPublicEventFilters(
      supabase.from("events").select("*").neq("id", eventId)
    )
      .ilike("locality", `%${normalized}%`)
      .limit(limit * 4);

    combined = combined.concat(bySlug || []);
  }

  const { data: cityEvents } = await applyPublicEventFilters(
    supabase.from("events").select("*").neq("id", eventId)
  )
    .ilike("locality", "%jaipur%")
    .limit(limit * 4);

  combined = combined.concat(cityEvents || []);

  return trimEventSection(
    sortByLocalityPriority(dedupeEventsById(combined), {
      exactLocalityId: localityId,
      localitySlug,
      nearbyRows,
    }),
    {
      limit,
      excludeIds,
    }
  );
}

export async function getEventsByVenue(
  supabase: any,
  {
    eventId,
    venueId,
    venueName,
    limit = 6,
    excludeIds = [],
  }: {
    eventId: string;
    venueId?: string | null;
    venueName?: string | null;
    limit?: number;
    excludeIds?: string[];
  }
) {
  let query = applyPublicEventFilters(
    supabase.from("events").select("*").neq("id", eventId)
  );

  if (venueId && venueName) {
    query = query.or(`venue_id.eq.${venueId},venue_name.eq.${venueName}`);
  } else if (venueId) {
    query = query.eq("venue_id", venueId);
  } else if (venueName) {
    query = query.eq("venue_name", venueName);
  } else {
    return [];
  }

  const { data } = await query.limit(limit * 4);

  return trimEventSection(sortEventsByLifecycle(dedupeEventsById(data || [])), {
    limit,
    excludeIds,
  });
}

export async function getEventsByArtist(
  supabase: any,
  {
    eventId,
    artistIds,
    limit = 6,
    excludeIds = [],
  }: {
    eventId: string;
    artistIds: string[];
    limit?: number;
    excludeIds?: string[];
  }
) {
  if (!Array.isArray(artistIds) || artistIds.length === 0) return [];

  const { data: eventArtistRows } = await supabase
    .from("event_artists")
    .select("event_id")
    .in("artist_id", artistIds);

  const eventIds = Array.from(
    new Set(
      (eventArtistRows || [])
        .map((row: any) => row.event_id)
        .filter((id: string) => !!id && id !== eventId)
    )
  );

  if (eventIds.length === 0) return [];

  const { data: events } = await applyPublicEventFilters(
    supabase.from("events").select("*").in("id", eventIds)
  );

  return trimEventSection(
    sortEventsByLifecycle(dedupeEventsById(events || [])),
    {
      limit,
      excludeIds,
    }
  );
}

export async function getUpcomingEventsForLocality(
  supabase: any,
  {
    localityId,
    localitySlug,
    limit = 6,
  }: {
    localityId?: string | null;
    localitySlug?: string | null;
    limit?: number;
  }
) {
  const nowIso = new Date().toISOString();
  const normalized = normalizeLocalitySlugText(localitySlug);
  const nearbyRows = await getNearbyLocalityRows(supabase, localityId, 5);
  const nearbyLocalityIds = uniqueIds(nearbyRows.map((row) => row.locality_id));

  let combined: any[] = [];

  if (localityId) {
    const { data: exactData } = await applyPublicEventFilters(
      supabase.from("events").select("*")
    )
      .eq("locality_id", localityId)
      .gte("start_date", nowIso)
      .order("start_date", { ascending: true })
      .limit(limit * 6);

    combined = combined.concat(exactData || []);
  }

  if (normalized) {
    const { data: exactSlugData } = await applyPublicEventFilters(
      supabase.from("events").select("*")
    )
      .ilike("locality", `%${normalized}%`)
      .gte("start_date", nowIso)
      .order("start_date", { ascending: true })
      .limit(limit * 6);

    combined = combined.concat(exactSlugData || []);
  }

  if (nearbyLocalityIds.length > 0) {
    const { data: nearbyData } = await applyPublicEventFilters(
      supabase.from("events").select("*")
    )
      .in("locality_id", nearbyLocalityIds)
      .gte("start_date", nowIso)
      .order("start_date", { ascending: true })
      .limit(limit * 8);

    combined = combined.concat(nearbyData || []);
  }

  if (combined.length < limit * 2) {
    const { data: cityData } = await applyPublicEventFilters(
      supabase.from("events").select("*")
    )
      .ilike("locality", "%jaipur%")
      .gte("start_date", nowIso)
      .order("start_date", { ascending: true })
      .limit(limit * 10);

    combined = combined.concat(cityData || []);
  }

  const ranked = sortByLocalityPriority(dedupeEventsById(combined), {
    exactLocalityId: localityId,
    localitySlug,
    nearbyRows,
  });

  return trimEventSection(ranked, { limit });
}

export async function getPastEventsForLocality(
  supabase: any,
  {
    localityId,
    limit = 6,
  }: {
    localityId?: string | null;
    limit?: number;
  }
) {
  if (!localityId) return [];

  const { data } = await applyPublicEventFilters(
    supabase.from("events").select("*")
  )
    .eq("locality_id", localityId)
    .lt("start_date", new Date().toISOString())
    .order("start_date", { ascending: false })
    .limit(limit * 3);

  return trimEventSection(dedupeEventsById(data || []), { limit });
}

export async function getVenuesForLocality(
  supabase: any,
  {
    localityId,
    localitySlug,
    limit = 6,
  }: {
    localityId?: string | null;
    localitySlug?: string | null;
    limit?: number;
  }
) {
  const normalized = normalizeLocalitySlugText(localitySlug);

  if (localityId) {
    const { data: strictVenues } = await supabase
      .from("venues")
      .select("*")
      .eq("locality_id", localityId)
      .limit(limit);

    if (strictVenues && strictVenues.length > 0) {
      return strictVenues;
    }
  }

  const nearbyIds = await getNearbyLocalityIds(supabase, localityId, 5);

  if (nearbyIds.length > 0) {
    const { data: nearbyVenues } = await supabase
      .from("venues")
      .select("*")
      .in("locality_id", nearbyIds)
      .limit(limit * 2);

    if (nearbyVenues && nearbyVenues.length > 0) {
      return nearbyVenues.slice(0, limit);
    }
  }

  if (normalized) {
    const { data: slugVenues } = await supabase
      .from("venues")
      .select("*")
      .or(`name.ilike.%${normalized}%,description.ilike.%${normalized}%`)
      .limit(limit);

    if (slugVenues && slugVenues.length > 0) {
      return slugVenues;
    }
  }

  const events = await getUpcomingEventsForLocality(supabase, {
    localityId,
    localitySlug,
    limit: Math.max(limit, 8),
  });

  const venueIds = Array.from(
    new Set((events || []).map((e: any) => e?.venue_id).filter(Boolean))
  );

  if (venueIds.length > 0) {
    const { data: eventVenues } = await supabase
      .from("venues")
      .select("*")
      .in("id", venueIds)
      .limit(limit);

    if (eventVenues && eventVenues.length > 0) {
      return eventVenues;
    }
  }

  const { data: fallbackVenues } = await supabase
    .from("venues")
    .select("*")
    .limit(limit);

  return fallbackVenues || [];
}

export async function getUpcomingEventsForVenue(
  supabase: any,
  {
    venueId,
    venueName,
    limit = 6,
  }: {
    venueId?: string | null;
    venueName?: string | null;
    limit?: number;
  }
) {
  let query = applyPublicEventFilters(supabase.from("events").select("*"));

  if (venueId && venueName) {
    query = query.or(`venue_id.eq.${venueId},venue_name.eq.${venueName}`);
  } else if (venueId) {
    query = query.eq("venue_id", venueId);
  } else if (venueName) {
    query = query.eq("venue_name", venueName);
  } else {
    return [];
  }

  const { data } = await query
    .gte("start_date", new Date().toISOString())
    .order("start_date", { ascending: true })
    .limit(limit * 3);

  return trimEventSection(dedupeEventsById(data || []), { limit });
}

export async function getPastEventsForVenue(
  supabase: any,
  {
    venueId,
    venueName,
    limit = 6,
  }: {
    venueId?: string | null;
    venueName?: string | null;
    limit?: number;
  }
) {
  let query = applyPublicEventFilters(supabase.from("events").select("*"));

  if (venueId && venueName) {
    query = query.or(`venue_id.eq.${venueId},venue_name.eq.${venueName}`);
  } else if (venueId) {
    query = query.eq("venue_id", venueId);
  } else if (venueName) {
    query = query.eq("venue_name", venueName);
  } else {
    return [];
  }

  const { data } = await query
    .lt("start_date", new Date().toISOString())
    .order("start_date", { ascending: false })
    .limit(limit * 3);

  return trimEventSection(dedupeEventsById(data || []), { limit });
}

export async function getUpcomingEventsForArtist(
  supabase: any,
  {
    artistId,
    limit = 6,
  }: {
    artistId?: string | null;
    limit?: number;
  }
) {
  if (!artistId) return [];

  const { data: links } = await supabase
    .from("event_artists")
    .select("event_id")
    .eq("artist_id", artistId);

  const eventIds = Array.from(
    new Set((links || []).map((row: any) => row.event_id).filter(Boolean))
  );

  if (eventIds.length === 0) return [];

  const { data } = await applyPublicEventFilters(
    supabase.from("events").select("*").in("id", eventIds)
  )
    .gte("start_date", new Date().toISOString())
    .order("start_date", { ascending: true })
    .limit(limit * 3);

  return trimEventSection(dedupeEventsById(data || []), { limit });
}

export async function getPastEventsForArtist(
  supabase: any,
  {
    artistId,
    limit = 6,
  }: {
    artistId?: string | null;
    limit?: number;
  }
) {
  if (!artistId) return [];

  const { data: links } = await supabase
    .from("event_artists")
    .select("event_id")
    .eq("artist_id", artistId);

  const eventIds = Array.from(
    new Set((links || []).map((row: any) => row.event_id).filter(Boolean))
  );

  if (eventIds.length === 0) return [];

  const { data } = await applyPublicEventFilters(
    supabase.from("events").select("*").in("id", eventIds)
  )
    .lt("start_date", new Date().toISOString())
    .order("start_date", { ascending: false })
    .limit(limit * 3);

  return trimEventSection(dedupeEventsById(data || []), { limit });
}

export async function getVenueClusterForArtist(
  supabase: any,
  {
    artistId,
    limit = 6,
  }: {
    artistId?: string | null;
    limit?: number;
  }
) {
  if (!artistId) return [];

  const { data: links } = await supabase
    .from("event_artists")
    .select("event_id")
    .eq("artist_id", artistId);

  const eventIds = Array.from(
    new Set((links || []).map((row: any) => row.event_id).filter(Boolean))
  );

  if (eventIds.length === 0) return [];

  const { data: events } = await applyPublicEventFilters(
    supabase.from("events").select("venue_id, venue_name").in("id", eventIds)
  );

  const venueIds = Array.from(
    new Set((events || []).map((e: any) => e.venue_id).filter(Boolean))
  );

  if (venueIds.length === 0) return [];

  const { data: venues } = await supabase
    .from("venues")
    .select("*")
    .in("id", venueIds)
    .limit(limit);

  return venues || [];
}

export async function getLocalityClusterForArtist(
  supabase: any,
  {
    artistId,
    limit = 6,
  }: {
    artistId?: string | null;
    limit?: number;
  }
) {
  if (!artistId) return [];

  const { data: links } = await supabase
    .from("event_artists")
    .select("event_id")
    .eq("artist_id", artistId);

  const eventIds = Array.from(
    new Set((links || []).map((row: any) => row.event_id).filter(Boolean))
  );

  if (eventIds.length === 0) return [];

  const { data: events } = await applyPublicEventFilters(
    supabase.from("events").select("locality_id, locality").in("id", eventIds)
  );

  const localityIds = Array.from(
    new Set((events || []).map((e: any) => e.locality_id).filter(Boolean))
  );

  if (localityIds.length === 0) return [];

  const { data: localities } = await supabase
    .from("localities")
    .select("*")
    .in("id", localityIds)
    .limit(limit);

  return localities || [];
}
