import {
  dedupeEventsById,
  sortEventsByLifecycle,
  trimEventSection,
} from "@/lib/events/core";

function applyPublicEventFilters(query: any) {
  return query
    .eq("status", "published")
    .eq("editorial_status", "published")
    .eq("index_status", "index");
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

  if (localityId) {
    const { data: byId } = await applyPublicEventFilters(
      supabase.from("events").select("*").neq("id", eventId)
    )
      .eq("locality_id", localityId)
      .limit(limit * 4);

    const idEvents = trimEventSection(
      sortEventsByLifecycle(dedupeEventsById(byId || [])),
      {
        limit,
        excludeIds,
      }
    );

    if (idEvents.length > 0) return idEvents;
  }

  if (normalized) {
    const { data: bySlug } = await applyPublicEventFilters(
      supabase.from("events").select("*").neq("id", eventId)
    )
      .ilike("locality", `%${normalized}%`)
      .limit(limit * 4);

    const slugEvents = trimEventSection(
      sortEventsByLifecycle(dedupeEventsById(bySlug || [])),
      {
        limit,
        excludeIds,
      }
    );

    if (slugEvents.length > 0) return slugEvents;
  }

  const { data: cityEvents } = await applyPublicEventFilters(
    supabase.from("events").select("*").neq("id", eventId)
  )
    .ilike("locality", "%jaipur%")
    .limit(limit * 4);

  return trimEventSection(
    sortEventsByLifecycle(dedupeEventsById(cityEvents || [])),
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
  const nowIso = new Date().toISOString();
  const normalized = localitySlug?.replace(/-/g, " ");

  if (localityId) {
    const { data: strictData } = await applyPublicEventFilters(
      supabase.from("events").select("*")
    )
      .eq("locality_id", localityId)
      .gte("start_date", nowIso)
      .order("start_date", { ascending: true })
      .limit(limit * 4);

    const strictEvents = trimEventSection(
      sortEventsByLifecycle(dedupeEventsById(strictData || [])),
      { limit }
    );

    if (strictEvents.length > 0) return strictEvents;
  }

  if (normalized) {
    const { data: slugData } = await applyPublicEventFilters(
      supabase.from("events").select("*")
    )
      .ilike("locality", `%${normalized}%`)
      .gte("start_date", nowIso)
      .order("start_date", { ascending: true })
      .limit(limit * 4);

    const slugEvents = trimEventSection(
      sortEventsByLifecycle(dedupeEventsById(slugData || [])),
      { limit }
    );

    if (slugEvents.length > 0) return slugEvents;
  }

  const { data: cityData } = await applyPublicEventFilters(
    supabase.from("events").select("*")
  )
    .ilike("locality", "%jaipur%")
    .gte("start_date", nowIso)
    .order("start_date", { ascending: true })
    .limit(limit * 4);

  const cityEvents = trimEventSection(
    sortEventsByLifecycle(dedupeEventsById(cityData || [])),
    { limit }
  );

  if (cityEvents.length > 0) return cityEvents;

  const { data: fallbackData } = await applyPublicEventFilters(
    supabase.from("events").select("*")
  )
    .gte("start_date", nowIso)
    .order("start_date", { ascending: true })
    .limit(limit * 4);

  return trimEventSection(
    sortEventsByLifecycle(dedupeEventsById(fallbackData || [])),
    { limit }
  );
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
