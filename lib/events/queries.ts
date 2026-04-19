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

async function getNearbyLocalityIds(
  supabase: any,
  localityId?: string | null,
  limit = 5
): Promise<string[]> {
  if (!localityId) return [];

  const { data } = await supabase.rpc("get_nearby_locality_ids", {
    p_locality_id: localityId,
    p_limit: limit,
  });

  return uniqueIds((data || []).map((row: any) => row.locality_id));
}

function sortByLocalityPriority(
  events: any[],
  {
    exactLocalityId,
    nearbyLocalityIds = [],
  }: {
    exactLocalityId?: string | null;
    nearbyLocalityIds?: string[];
  }
) {
  const nearbySet = new Set(nearbyLocalityIds || []);

  const score = (event: any) => {
    if (exactLocalityId && event?.locality_id === exactLocalityId) return 1;
    if (event?.locality_id && nearbySet.has(event.locality_id)) return 2;
    if (String(event?.locality || "").toLowerCase() === "jaipur") return 4;
    return 3;
  };

  return [...(events || [])].sort((a: any, b: any) => {
    const scoreDiff = score(a) - score(b);
    if (scoreDiff !== 0) return scoreDiff;

    const aDate = new Date(a?.start_date || a?.start_time || 0).getTime();
    const bDate = new Date(b?.start_date || b?.start_time || 0).getTime();

    if (aDate && bDate) return aDate - bDate;
    if (aDate) return -1;
    if (bDate) return 1;
    return 0;
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
  const normalized = localitySlug?.replace(/-/g, " ");
  const nearbyLocalityIds = await getNearbyLocalityIds(supabase, localityId, 5);

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
    .or("locality.ilike.%jaipur%")
    .limit(limit * 4);

  combined = combined.concat(cityEvents || []);

  return trimEventSection(
    sortByLocalityPriority(dedupeEventsById(combined), {
      exactLocalityId: localityId,
      nearbyLocalityIds,
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
  const normalized = localitySlug?.replace(/-/g, " ");
  const nearbyLocalityIds = await getNearbyLocalityIds(supabase, localityId, 5);

  let combined: any[] = [];

  if (localityId) {
    const { data: exactData } = await applyPublicEventFilters(
      supabase.from("events").select("*")
    )
      .eq("locality_id", localityId)
      .gte("start_date", nowIso)
      .order("start_date", { ascending: true })
      .limit(limit * 4);

    combined = combined.concat(exactData || []);
  }

  if (nearbyLocalityIds.length > 0) {
    const { data: nearbyData } = await applyPublicEventFilters(
      supabase.from("events").select("*")
    )
      .in("locality_id", nearbyLocalityIds)
      .gte("start_date", nowIso)
      .order("start_date", { ascending: true })
      .limit(limit * 4);

    combined = combined.concat(nearbyData || []);
  }

  if (normalized) {
    const { data: slugData } = await applyPublicEventFilters(
      supabase.from("events").select("*")
    )
      .ilike("locality", `%${normalized}%`)
      .gte("start_date", nowIso)
      .order("start_date", { ascending: true })
      .limit(limit * 4);

    combined = combined.concat(slugData || []);
  }

  const { data: cityData } = await applyPublicEventFilters(
    supabase.from("events").select("*")
  )
    .or("locality.ilike.%jaipur%")
    .gte("start_date", nowIso)
    .order("start_date", { ascending: true })
    .limit(limit * 4);

  combined = combined.concat(cityData || []);

  const ranked = sortByLocalityPriority(dedupeEventsById(combined), {
    exactLocalityId: localityId,
    nearbyLocalityIds,
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
    .limit(limit * 2);

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
  const normalized = localitySlug?.replace(/-/g, " ");

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

  if (normalized) {
    const { data: slugVenues } = await supabase
      .from("venues")
      .select("*")
      .ilike("name", `%${normalized}%`)
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
    .limit(limit * 2);

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
    .limit(limit * 2);

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
    .limit(limit * 2);

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
    .limit(limit * 2);

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
