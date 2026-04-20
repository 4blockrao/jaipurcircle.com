import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

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

function isEventClosed(event: any) {
  const value = getEventDate(event);
  if (!value) return false;
  const ts = new Date(value).getTime();
  if (Number.isNaN(ts)) return false;
  return ts < Date.now();
}

function getEventImage(event: any) {
  return (
    event?.cover_image_url ||
    event?.image_url ||
    event?.cover_image ||
    "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=1200&auto=format&fit=crop"
  );
}

function getEventPrice(event: any) {
  if (event?.is_free) return "Free";
  if (event?.price_min) {
    return `₹${event.price_min}${event?.price_max ? ` - ₹${event.price_max}` : ""}`;
  }
  if (event?.ticket_price) return `₹${event.ticket_price}`;
  return "Price TBA";
}

function prettyText(value?: string | null) {
  if (!value) return "";
  return String(value)
    .replace(/-/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
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

async function getEventBySlug(supabase: any, slug: string) {
  if (!slug) return null;

  let { data } = await supabase
    .from("events")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (data) return data;

  const cleaned = slug.replace(/-\d{4}-\d{2}-\d{2}$/, "");

  if (cleaned !== slug) {
    const { data: fallback } = await supabase
      .from("events")
      .select("*")
      .eq("slug", cleaned)
      .maybeSingle();

    if (fallback) return fallback;
  }

  const { data: loose } = await supabase
    .from("events")
    .select("*")
    .ilike("slug", `%${cleaned}%`)
    .limit(1);

  return loose?.[0] || null;
}

async function getLocalityForEvent(supabase: any, event: any) {
  try {
    if (event?.locality_id) {
      const { data } = await supabase
        .from("localities")
        .select("id,name,slug,nearby_localities")
        .eq("id", event.locality_id)
        .maybeSingle();

      if (data) return data;
    }

    const localityValue = event?.locality;
    if (!localityValue) return null;

    const slug = String(localityValue).trim().toLowerCase().replace(/\s+/g, "-");

    let { data } = await supabase
      .from("localities")
      .select("id,name,slug,nearby_localities")
      .eq("slug", slug)
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

async function getVenueForEvent(supabase: any, event: any) {
  try {
    if (event?.venue_id) {
      const { data } = await supabase
        .from("venues")
        .select("id,name,slug,locality_id")
        .eq("id", event.venue_id)
        .maybeSingle();

      if (data) return data;
    }

    if (!event?.venue_name) return null;

    const { data } = await supabase
      .from("venues")
      .select("id,name,slug,locality_id")
      .ilike("name", String(event.venue_name).trim())
      .limit(1);

    return data?.[0] || null;
  } catch {
    return null;
  }
}

async function getSameLocalityUpcomingEvents(
  supabase: any,
  {
    event,
    locality,
    limit = 6,
  }: {
    event: any;
    locality: any;
    limit?: number;
  }
) {
  try {
    if (!locality?.id) return [];

    const nowIso = new Date().toISOString();

    const { data } = await supabase
      .from("events")
      .select("id,title,slug,start_time,start_date,locality,locality_id")
      .in("status", ["published", "upcoming"])
      .eq("editorial_status", "published")
      .eq("index_status", "index")
      .eq("locality_id", locality.id)
      .gte("start_date", nowIso)
      .neq("id", event.id)
      .order("start_date", { ascending: true })
      .limit(limit);

    return data || [];
  } catch {
    return [];
  }
}

async function getNearbyLocalityUpcomingEvents(
  supabase: any,
  {
    event,
    locality,
    limit = 6,
  }: {
    event: any;
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

    const nearbyIds = (nearbyLocalities || []).map((row: any) => row.id).filter(Boolean);

    if (!nearbyIds.length) return [];

    const nowIso = new Date().toISOString();

    const { data } = await supabase
      .from("events")
      .select("id,title,slug,start_time,start_date,locality,locality_id")
      .in("status", ["published", "upcoming"])
      .eq("editorial_status", "published")
      .eq("index_status", "index")
      .in("locality_id", nearbyIds)
      .gte("start_date", nowIso)
      .neq("id", event.id)
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

async function getRelatedUpcomingEvents(
  supabase: any,
  {
    event,
    locality,
    venue,
    limit = 6,
  }: {
    event: any;
    locality: any;
    venue: any;
    limit?: number;
  }
) {
  try {
    const nowIso = new Date().toISOString();
    let combined: any[] = [];

    if (venue?.id) {
      const { data } = await supabase
        .from("events")
        .select("id,title,slug,start_time,start_date,locality,locality_id")
        .in("status", ["published", "upcoming"])
        .eq("editorial_status", "published")
        .eq("index_status", "index")
        .eq("venue_id", venue.id)
        .gte("start_date", nowIso)
        .neq("id", event.id)
        .order("start_date", { ascending: true })
        .limit(limit * 2);

      combined = combined.concat(data || []);
    }

    if (locality?.id) {
      const { data } = await supabase
        .from("events")
        .select("id,title,slug,start_time,start_date,locality,locality_id")
        .in("status", ["published", "upcoming"])
        .eq("editorial_status", "published")
        .eq("index_status", "index")
        .eq("locality_id", locality.id)
        .gte("start_date", nowIso)
        .neq("id", event.id)
        .order("start_date", { ascending: true })
        .limit(limit * 2);

      combined = combined.concat(data || []);
    }

    return dedupeById(combined).slice(0, limit);
  } catch {
    return [];
  }
}

async function getVenueArchiveEvents(
  supabase: any,
  {
    event,
    venue,
    limit = 6,
  }: {
    event: any;
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
      .neq("id", event.id)
      .order("start_date", { ascending: false })
      .limit(limit);

    return data || [];
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

  const event = await getEventBySlug(supabase, slug);

  if (!event) {
    return {
      title: "Event not found | JaipurCircle",
    };
  }

  const title =
    event?.meta_title || `${event?.title || "Event"} | JaipurCircle`;

  const description =
    event?.meta_description ||
    event?.seo_blurb ||
    event?.description ||
    `Discover details for ${event?.title || "this event"} on JaipurCircle.`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://www.jaipurcircle.com/events/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `https://www.jaipurcircle.com/events/${slug}`,
      images: event?.cover_image_url ? [event.cover_image_url] : undefined,
    },
  };
}

export default async function EventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = createServerSupabaseClient();

  const event = await getEventBySlug(supabase, slug);
  if (!event) return notFound();

  const [locality, venue] = await Promise.all([
    getLocalityForEvent(supabase, event),
    getVenueForEvent(supabase, event),
  ]);

  const [sameLocalityEvents, nearbyLocalityEvents, relatedEvents, venueArchive] =
    await Promise.all([
      getSameLocalityUpcomingEvents(supabase, {
        event,
        locality,
        limit: 6,
      }),
      getNearbyLocalityUpcomingEvents(supabase, {
        event,
        locality,
        limit: 6,
      }),
      getRelatedUpcomingEvents(supabase, {
        event,
        locality,
        venue,
        limit: 6,
      }),
      getVenueArchiveEvents(supabase, {
        event,
        venue,
        limit: 6,
      }),
    ]);

  const closed = isEventClosed(event);
  const localityHref = locality?.slug ? `/jaipur/${locality.slug}` : null;
  const venueHref = venue?.slug ? `/venues/${venue.slug}` : null;

  const archiveIntro = closed
    ? `This event has ended, but JaipurCircle keeps event pages live as permanent memory. Use the discovery links below to continue exploring related upcoming events, the venue, and the surrounding locality.`
    : `This event page is designed to be more than a detail page. It connects the event to its locality, venue, and surrounding discovery graph so users and search engines can continue exploring Jaipur meaningfully.`;

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <nav className="text-sm text-gray-500">
        <a href="/" className="hover:text-black">
          Home
        </a>
        <span> &gt; </span>
        <a href="/events" className="hover:text-black">
          Events
        </a>
        <span> &gt; </span>
        <span className="text-black">{event.title}</span>
      </nav>

      <section className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700">
              {prettyText(event?.category || "Event")}
            </span>
            <span
              className={`rounded-full px-3 py-1 text-sm ${
                closed
                  ? "bg-orange-100 text-orange-800"
                  : "bg-blue-100 text-blue-800"
              }`}
            >
              {closed ? "Event Closed" : "Upcoming"}
            </span>
            {locality?.name ? (
              <span className="rounded-full bg-green-50 px-3 py-1 text-sm text-green-700">
                {locality.name}
              </span>
            ) : null}
          </div>

          <h1 className="mt-4 text-3xl font-bold leading-tight text-gray-900 md:text-4xl">
            {event.title}
          </h1>

          <p className="mt-4 max-w-2xl text-gray-700 leading-7">
            {event.description ||
              event.seo_blurb ||
              `${event.title} is listed on JaipurCircle with event details, venue context, and locality-based discovery links.`}
          </p>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <div className="text-xs uppercase tracking-wide text-gray-500">
                Date & time
              </div>
              <div className="mt-2 font-medium text-gray-900">
                {formatDate(getEventDate(event)) || "Date TBA"}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <div className="text-xs uppercase tracking-wide text-gray-500">
                Price
              </div>
              <div className="mt-2 font-medium text-gray-900">
                {getEventPrice(event)}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <div className="text-xs uppercase tracking-wide text-gray-500">
                Venue
              </div>
              <div className="mt-2 font-medium text-gray-900">
                {event?.venue_name || venue?.name || "Venue TBA"}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <div className="text-xs uppercase tracking-wide text-gray-500">
                Locality
              </div>
              <div className="mt-2 font-medium text-gray-900">
                {locality?.name || prettyText(event?.locality) || "Jaipur"}
              </div>
            </div>
          </div>

          {closed ? (
            <div className="mt-6 rounded-2xl border border-orange-200 bg-orange-50 p-5">
              <h2 className="text-lg font-semibold text-gray-900">
                This event has ended
              </h2>
              <p className="mt-2 text-sm leading-6 text-gray-700">
                JaipurCircle keeps past event pages live so they continue to act
                as searchable history and discovery nodes. Users can still move
                into venue pages, locality hubs, and similar upcoming events.
              </p>
            </div>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-3">
            {venueHref ? (
              <a
                href={venueHref}
                className="rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-700 hover:bg-blue-100"
              >
                View venue →
              </a>
            ) : null}
            {localityHref ? (
              <a
                href={localityHref}
                className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Explore {locality?.name} →
              </a>
            ) : null}
            <a
              href="/events"
              className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              All Jaipur events →
            </a>
          </div>
        </div>

        <div className="overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-sm">
          <img
            src={getEventImage(event)}
            alt={event?.title || "Event"}
            className="h-full w-full object-cover"
          />
        </div>
      </section>

      {(localityHref || venueHref) ? (
        <section className="mt-10 rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Event context
          </h2>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-gray-100 p-4">
              <div className="text-xs uppercase tracking-wide text-gray-500">
                Locality context
              </div>
              <div className="mt-2 font-medium text-gray-900">
                {locality?.name || prettyText(event?.locality) || "Jaipur"}
              </div>
              <p className="mt-2 text-sm text-gray-600">
                This event contributes to the discovery graph of{" "}
                {locality?.name || prettyText(event?.locality) || "Jaipur"}.
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
                Venue context
              </div>
              <div className="mt-2 font-medium text-gray-900">
                {venue?.name || event?.venue_name || "Venue TBA"}
              </div>
              <p className="mt-2 text-sm text-gray-600">
                Venue pages help users continue into more events and location-aware discovery.
              </p>
              {venueHref ? (
                <a
                  href={venueHref}
                  className="mt-3 inline-block text-sm font-medium text-blue-600"
                >
                  Go to venue page →
                </a>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      <section className="mt-10 rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="text-xl font-semibold text-gray-900">
          Event history & discovery
        </h2>
        <p className="mt-3 text-gray-700 leading-7">{archiveIntro}</p>
      </section>

      {sameLocalityEvents.length > 0 ? (
        <section className="mt-12">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">
                More events in {locality?.name || prettyText(event?.locality) || "this area"}
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Continue exploring exact locality-linked upcoming events.
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {sameLocalityEvents.map((item: any) => (
              <EventLinkCard key={item.id} event={item} />
            ))}
          </div>
        </section>
      ) : null}

      {nearbyLocalityEvents.length > 0 ? (
        <section className="mt-12">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">
                Events near {locality?.name || prettyText(event?.locality) || "this area"}
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Nearby localities help users keep moving through Jaipur’s event graph.
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {nearbyLocalityEvents.map((item: any) => (
              <EventLinkCard key={item.id} event={item} showLocality />
            ))}
          </div>
        </section>
      ) : null}

      {relatedEvents.length > 0 ? (
        <section className="mt-12">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">
                Similar upcoming events
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Related events based on venue and locality relevance.
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {relatedEvents.map((item: any) => (
              <EventLinkCard key={item.id} event={item} />
            ))}
          </div>
        </section>
      ) : null}

      {closed && venueArchive.length > 0 ? (
        <section className="mt-12">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">
                More event history at {venue?.name || event?.venue_name || "this venue"}
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Archive continuity helps this event page compound as a permanent search and discovery asset.
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {venueArchive.map((item: any) => (
              <EventLinkCard key={item.id} event={item} />
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
