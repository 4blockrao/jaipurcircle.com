function pickEventDate(event: any) {
  return event?.start_date || event?.start_time || null;
}

function sortEvents(items: any[]) {
  const now = new Date();

  return [...(items || [])].sort((a: any, b: any) => {
    const aRaw = pickEventDate(a);
    const bRaw = pickEventDate(b);

    const aDate = aRaw ? new Date(aRaw) : null;
    const bDate = bRaw ? new Date(bRaw) : null;

    if (!aDate && !bDate) return 0;
    if (!aDate) return 1;
    if (!bDate) return -1;

    const aUpcoming = aDate >= now;
    const bUpcoming = bDate >= now;

    if (aUpcoming && !bUpcoming) return -1;
    if (!aUpcoming && bUpcoming) return 1;

    if (aUpcoming && bUpcoming) return aDate.getTime() - bDate.getTime();
    return bDate.getTime() - aDate.getTime();
  });
}

function dedupeById(items: any[]) {
  const seen = new Set<string>();
  return (items || []).filter((item: any) => {
    if (!item?.id) return false;
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

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
  }: {
    eventId: string;
    localityId?: string | null;
    localitySlug?: string | null;
    limit?: number;
  }
) {
  let query = applyPublicEventFilters(
    supabase.from("events").select("*").neq("id", eventId)
  );

  if (localityId && localitySlug) {
    query = query.or(`locality_id.eq.${localityId},locality.eq.${localitySlug}`);
  } else if (localityId) {
    query = query.eq("locality_id", localityId);
  } else if (localitySlug) {
    query = query.eq("locality", localitySlug);
  } else {
    return [];
  }

  const { data } = await query.limit(limit * 3);
  return sortEvents(dedupeById(data || [])).slice(0, limit);
}

export async function getEventsByVenue(
  supabase: any,
  {
    eventId,
    venueId,
    venueName,
    limit = 6,
  }: {
    eventId: string;
    venueId?: string | null;
    venueName?: string | null;
    limit?: number;
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

  const { data } = await query.limit(limit * 3);
  return sortEvents(dedupeById(data || [])).slice(0, limit);
}

export async function getEventsByArtist(
  supabase: any,
  {
    eventId,
    artistIds,
    limit = 6,
  }: {
    eventId: string;
    artistIds: string[];
    limit?: number;
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

  return sortEvents(dedupeById(events || [])).slice(0, limit);
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
  let query = applyPublicEventFilters(
    supabase.from("events").select("*")
  );

  if (localityId && localitySlug) {
    query = query.or(`locality_id.eq.${localityId},locality.eq.${localitySlug}`);
  } else if (localityId) {
    query = query.eq("locality_id", localityId);
  } else if (localitySlug) {
    query = query.eq("locality", localitySlug);
  } else {
    return [];
  }

  const { data } = await query
    .gte("start_date", new Date().toISOString())
    .order("start_date", { ascending: true })
    .limit(limit);

  return dedupeById(data || []);
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

  if (localityId && localitySlug) {
    query = query.or(`locality_id.eq.${localityId},locality.eq.${localitySlug}`);
  } else if (localityId) {
    query = query.eq("locality_id", localityId);
  } else if (localitySlug) {
    query = query.eq("locality", localitySlug);
  } else {
    return [];
  }

  const { data } = await query
    .lt("start_date", new Date().toISOString())
    .order("start_date", { ascending: false })
    .limit(limit);

  return dedupeById(data || []);
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

  const { data } = await query
    .gte("start_date", new Date().toISOString())
    .order("start_date", { ascending: true })
    .limit(limit);

  return dedupeById(data || []);
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

  const { data } = await query
    .lt("start_date", new Date().toISOString())
    .order("start_date", { ascending: false })
    .limit(limit);

  return dedupeById(data || []);
}
