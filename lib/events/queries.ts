import {
  dedupeEventsById,
  sortEventsByLifecycle,
  trimEventSection,
  parseEventDate,
  pickEventDate,
} from "@/lib/events/core";

function applyPublicEventFilters(query: any) {
  return query
    .in("status", ["published", "upcoming"])
    .eq("editorial_status", "published")
    .eq("index_status", "index");
}

function filterUpcomingInMemory(items: any[]) {
  const now = new Date();
  return (items || []).filter((item: any) => {
    const date = parseEventDate(pickEventDate(item));
    return date && date >= now;
  });
}

function filterPastInMemory(items: any[]) {
  const now = new Date();
  return (items || []).filter((item: any) => {
    const date = parseEventDate(pickEventDate(item));
    return date && date < now;
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
  let query = applyPublicEventFilters(
    supabase.from("events").select("*").neq("id", eventId)
  );

  if (!localityId) {
    return [];
  }
  query = query.eq("locality_id", localityId);

  const { data } = await query.limit(limit * 6);

  return trimEventSection(sortEventsByLifecycle(dedupeEventsById(data || [])), {
    limit,
    excludeIds,
  });
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

  const { data } = await query.limit(limit * 6);

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

  return trimEventSection(sortEventsByLifecycle(dedupeEventsById(events || [])), {
    limit,
    excludeIds,
  });
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
  if (!localityId && !localitySlug) return [];

  const nowIso = new Date().toISOString();

  let strictQuery = applyPublicEventFilters(
    supabase.from("events").select("*")
  );

  if (localityId) {
    strictQuery = strictQuery.eq("locality_id", localityId);
  } else {
    strictQuery = strictQuery.eq("locality", localitySlug);
  }

  const { data: strictData } = await strictQuery
    .gte("start_time", nowIso)
    .order("start_time", { ascending: true })
    .limit(limit * 10);

  const strictEvents = trimEventSection(
    sortEventsByLifecycle(
      filterUpcomingInMemory(dedupeEventsById(strictData || []))
    ),
    { limit }
  );

  if (strictEvents.length > 0) return strictEvents;

  if (localitySlug) {
    const { data: fallbackData } = await applyPublicEventFilters(
      supabase.from("events").select("*")
    )
      .ilike("locality", `%${localitySlug}%`)
      .gte("start_time", nowIso)
      .order("start_time", { ascending: true })
      .limit(limit * 10);

    const fallbackEvents = trimEventSection(
      sortEventsByLifecycle(
        filterUpcomingInMemory(dedupeEventsById(fallbackData || []))
      ),
      { limit }
    );

    if (fallbackEvents.length > 0) return fallbackEvents;
  }

  const { data: jaipurData } = await applyPublicEventFilters(
    supabase.from("events").select("*")
  )
    .gte("start_time", nowIso)
    .order("start_time", { ascending: true })
    .limit(limit * 10);

  return trimEventSection(
    sortEventsByLifecycle(
      filterUpcomingInMemory(dedupeEventsById(jaipurData || []))
    ),
    { limit }
  );
}

export async function getPastEventsForLocality(
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
  let query = applyPublicEventFilters(
    supabase.from("events").select("*")
  );

  if (!localityId) {
    return [];
  }
  query = query.eq("locality_id", localityId);

  const { data } = await query.limit(limit * 10);

  return trimEventSection(
    sortEventsByLifecycle(
      filterPastInMemory(dedupeEventsById(data || []))
    ),
    { limit }
  );
}

export async function getVenuesForLocality(
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

  const { data } = await supabase
    .from("venues")
    .select("*")
    .eq("locality_id", localityId)
    .limit(limit);

  return data || [];
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
  let query = applyPublicEventFilters(
    supabase.from("events").select("*")
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

  const { data } = await query.limit(limit * 10);

  return trimEventSection(
    sortEventsByLifecycle(
      filterUpcomingInMemory(dedupeEventsById(data || []))
    ),
    { limit }
  );
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
  let query = applyPublicEventFilters(
    supabase.from("events").select("*")
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

  const { data } = await query.limit(limit * 10);

  return trimEventSection(
    sortEventsByLifecycle(
      filterPastInMemory(dedupeEventsById(data || []))
    ),
    { limit }
  );
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
  );

  return trimEventSection(
    sortEventsByLifecycle(
      filterUpcomingInMemory(dedupeEventsById(data || []))
    ),
    { limit }
  );
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
  );

  return trimEventSection(
    sortEventsByLifecycle(
      filterPastInMemory(dedupeEventsById(data || []))
    ),
    { limit }
  );
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
