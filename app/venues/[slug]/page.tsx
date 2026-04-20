import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

function normalizeText(value?: string | null) {
  return String(value || "").trim().toLowerCase();
}

function prettyText(value?: string | null) {
  if (!value) return "";
  return String(value)
    .replace(/-/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function formatDate(value?: string | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getEventDate(event: any) {
  return event?.start_time || event?.start_date || event?.published_at || null;
}

function getVenueImage(venue: any) {
  return (
    venue?.cover_image_url ||
    venue?.image_url ||
    venue?.cover_image ||
    "https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=1200&auto=format&fit=crop"
  );
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

function eventCardDate(event: any) {
  return formatDate(getEventDate(event)) || "Date TBA";
}

async function getVenueBySlug(supabase: any, slug: string) {
  if (!slug) return null;

  let { data } = await supabase
    .from("venues")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (data) return data;

  const normalized = normalizeText(slug).replace(/\s+/g, "-");

  ({ data } = await supabase
    .from("venues")
    .select("*")
    .eq("slug", normalized)
    .maybeSingle());

  if (data) return data;

  const { data: loose } = await supabase
    .from("venues")
    .select("*")
    .ilike("name", `%${prettyText(slug)}%`)
    .limit(1);

  return loose?.[0] || null;
}

async function getLocalityForVenue(supabase: any, venue: any) {
  try {
    if (venue?.locality_id) {
      const { data } = await supabase
        .from("localities")
        .select("id,name,slug,nearby_localities")
        .eq("id", venue.locality_id)
        .maybeSingle();

      if (data) return data;
    }

    const localityValue = venue?.locality;
    if (!localityValue) return null;

    const localitySlug = String(localityValue)
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-");

    let { data } = await supabase
      .from("localities")
      .select("id,name,slug,nearby_localities")
      .eq("slug", localitySlug)
      .maybeSingle();

    if (data) return data;

    ({ data } = await supabase
      .from("localities")
      .select("id,name,slug,nearby_localities")
      .ilike("name", String(localityValue).trim())
      .maybeSingle());

    return data || null;
  } catch {
    return null;
  }
}

async function getUpcomingEventsAtVenue(
  supabase: any,
  {
    venue,
    limit = 6,
  }: {
    venue: any;
    limit?: number;
  }
) {
  try {
    if (!venue?.id) return [];

    const nowIso = new Date().toISOString();

    const { data } = await supabase
      .from("events")
      .select("id,title,slug,start_time,start_date,locality,locality_id")
      .in("status", ["published", "upcoming"])
      .eq("editorial_status", "published")
      .eq("index_status", "index")
      .eq("venue_id", venue.id)
      .gte("start_date", nowIso)
      .order("start_date", { ascending: true })
      .limit(limit);

    return data || [];
  } catch {
    return [];
  }
}

async function getVenueArchiveEvents(
  supabase: any,
  {
    venue,
    limit = 6,
  }: {
    venue: any;
    limit?: number;
  }
) {
  try {
    if (!venue?.id) return [];

    const nowIso = new Date().toISOString();

    const { data } = await supabase
      .from("events")
      .select("id,title,slug,start_time,start_date,locality,locality_id")
      .in("status", ["published", "upcoming"])
      .eq("editorial_status", "published")
      .eq("index_status", "index")
      .eq("venue_id", venue.id)
      .lt("start_date", nowIso)
      .order("start_date", { ascending: false })
      .limit(limit);

    return data || [];
  } catch {
    return [];
  }
}

async function getNearbyLocalityEvents(
  supabase: any,
  {
    venue,
    locality,
    limit = 6,
  }: {
    venue: any;
    locality: any;
    limit?: number;
  }
) {
  try {
    const nearby = Array.isArray(locality?.nearby_localities)
      ? locality.nearby_localities
      : [];

    const nearbySlugs = nearby
      .map((item: any) =>
        typeof item === "string"
          ? item
          : item?.slug || item?.locality_slug || null
      )
      .filter(Boolean)
      .slice(0, 8);

    if (!nearbySlugs.length) return [];

    const { data: nearbyLocalities } = await supabase
      .from("localities")
      .select("id,name,slug")
      .in("slug", nearbySlugs);

    const nearbyIds = (nearbyLocalities || [])
      .map((row: any) => row.id)
      .filter(Boolean);

    if (!nearbyIds.length) return [];

    const nowIso = new Date().toISOString();

    const { data } = await supabase
      .from("events")
      .select("id,title,slug,start_time,start_date,locality,locality_id")
      .in("status", ["published", "upcoming"])
      .eq("editorial_status", "published")
      .eq("index_status", "index")
      .in("locality_id", nearbyIds)
      .neq("venue_id", venue?.id || null)
      .gte("start_date", nowIso)
      .order("start_date", { ascending: true })
      .limit(limit * 2);

    const localityNameById = new Map(
      (nearbyLocalities || []).map((row: any) => [row.id, row.name])
    );

    return dedupeById(
      (data || []).map((item: any) => ({
        ...item,
        locality_name:
          localityNameById.get(item.locality_id) || prettyText(item.locality),
      }))
    ).slice(0, limit);
  } catch {
    return [];
  }
}

function EventLinkCard({
  event,
  showLocality = false,
}: {
  event: any;
  showLocality?: boolean;
}) {
  return (
    <a
      href={`/events/${event.slug}`}
      className="block rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
    >
      <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
      <p className="mt-2 text-sm text-gray-600">{eventCardDate(event)}</p>
      {showLocality ? (
        <p className="mt-1 text-sm text-gray-500">
          {event.locality_name || prettyText(event.locality) || "Jaipur"}
        </p>
      ) : null}
      <div className="mt-4 text-sm font-medium text-blue-600">View event →</div>
    </a>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = createServerSupabaseClient();

  const venue = await getVenueBySlug(supabase, slug);

  if (!venue) {
    return {
      title: "Venue not found | JaipurCircle",
    };
  }

  const title =
    venue?.meta_title || `${venue?.name || "Venue"} | JaipurCircle`;

  const description =
    venue?.meta_description ||
    venue?.seo_blurb ||
    venue?.description ||
    `Discover events, venue details, and locality context for ${venue?.name || "this venue"} on JaipurCircle.`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://www.jaipurcircle.com/venues/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `https://www.jaipurcircle.com/venues/${slug}`,
      images: venue?.cover_image_url ? [venue.cover_image_url] : undefined,
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

  const venue = await getVenueBySlug(supabase, slug);
  if (!venue) return notFound();

  const locality = await getLocalityForVenue(supabase, venue);

  const [upcomingEvents, venueArchive, nearbyEvents] = await Promise.all([
    getUpcomingEventsAtVenue(supabase, {
      venue,
      limit: 6,
    }),
    getVenueArchiveEvents(supabase, {
      venue,
      limit: 6,
    }),
    getNearbyLocalityEvents(supabase, {
      venue,
      locality,
      limit: 6,
    }),
  ]);

  const localityHref = locality?.slug ? `/jaipur/${locality.slug}` : null;
  const nearbyLocalities = Array.isArray(locality?.nearby_localities)
    ? locality.nearby_localities
    : [];

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
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

      <section className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700">
              Venue
            </span>
            {locality?.name ? (
              <span className="rounded-full bg-green-50 px-3 py-1 text-sm text-green-700">
                {locality.name}
              </span>
            ) : null}
          </div>

          <h1 className="mt-4 text-3xl font-bold leading-tight text-gray-900 md:text-4xl">
            {venue.name}
          </h1>

          <p className="mt-4 max-w-2xl text-gray-700 leading-7">
            {venue.description ||
              venue.seo_blurb ||
              `${venue.name} is a Jaipur venue listed on JaipurCircle with locality context and event discovery pathways.`}
          </p>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <div className="text-xs uppercase tracking-wide text-gray-500">
                Locality
              </div>
              <div className="mt-2 font-medium text-gray-900">
                {locality?.name || prettyText(venue?.locality) || "Jaipur"}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <div className="text-xs uppercase tracking-wide text-gray-500">
                Slug
              </div>
              <div className="mt-2 font-medium text-gray-900">
                {venue.slug || "—"}
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {localityHref ? (
              <a
                href={localityHref}
                className="rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-700 hover:bg-blue-100"
              >
                Explore {locality.name} →
              </a>
            ) : null}
            <a
              href="/events"
              className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              All Jaipur events →
            </a>
            <a
              href="/venues"
              className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Browse venues →
            </a>
          </div>
        </div>

        <div className="overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-sm">
          <img
            src={getVenueImage(venue)}
            alt={venue?.name || "Venue"}
            className="h-full w-full object-cover"
          />
        </div>
      </section>

      {(localityHref || nearbyLocalities.length > 0) ? (
        <section className="mt-10 rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Venue context
          </h2>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-gray-100 p-4">
              <div className="text-xs uppercase tracking-wide text-gray-500">
                Locality context
              </div>
              <div className="mt-2 font-medium text-gray-900">
                {locality?.name || prettyText(venue?.locality) || "Jaipur"}
              </div>
              <p className="mt-2 text-sm text-gray-600">
                This venue contributes to the locality discovery graph and helps connect users to nearby Jaipur activity.
              </p>
              {localityHref ? (
                <a
                  href={localityHref}
                  className="mt-3 inline-block text-sm font-medium text-blue-600"
                >
                  Go to locality hub →
                </a>
              ) : null}
            </div>

            <div className="rounded-xl border border-gray-100 p-4">
              <div className="text-xs uppercase tracking-wide text-gray-500">
                Discovery continuity
              </div>
              <div className="mt-2 font-medium text-gray-900">
                Events + place memory
              </div>
              <p className="mt-2 text-sm text-gray-600">
                Venue pages remain useful over time by linking current events, archive history, and nearby discovery paths.
              </p>
            </div>
          </div>
        </section>
      ) : null}

      {upcomingEvents.length > 0 ? (
        <section className="mt-12">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">
                Upcoming events at {venue.name}
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Current event listings connected directly to this venue.
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {upcomingEvents.map((event: any) => (
              <EventLinkCard key={event.id} event={event} />
            ))}
          </div>
        </section>
      ) : null}

      {nearbyEvents.length > 0 ? (
        <section className="mt-12">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">
                More events near {venue.name}
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                These events come from nearby localities and extend venue-based discovery.
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {nearbyEvents.map((event: any) => (
              <EventLinkCard key={event.id} event={event} showLocality />
            ))}
          </div>
        </section>
      ) : null}

      {venueArchive.length > 0 ? (
        <section className="mt-12">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">
                Event history at {venue.name}
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Archived event memory helps this venue page compound as a permanent search and discovery asset.
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {venueArchive.map((event: any) => (
              <EventLinkCard key={event.id} event={event} />
            ))}
          </div>
        </section>
      ) : null}

      {nearbyLocalities.length > 0 ? (
        <section className="mt-12 rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Nearby localities
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Continue browsing nearby Jaipur localities connected to this venue.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            {nearbyLocalities.slice(0, 8).map((item: any, idx: number) => {
              const nearbySlug =
                typeof item === "string"
                  ? item
                  : item?.slug || item?.locality_slug || null;

              const nearbyName =
                typeof item === "string"
                  ? prettyText(item)
                  : item?.name || item?.locality_name || nearbySlug;

              if (!nearbySlug) return null;

              return (
                <a
                  key={`${venue.slug}-nearby-${idx}`}
                  href={`/jaipur/${nearbySlug}`}
                  className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  {nearbyName} →
                </a>
              );
            })}
          </div>
        </section>
      ) : null}
    </main>
  );
}
