import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase";
import LocalityEventGrid from "@/components/locality/LocalityEventGrid";

export const dynamic = "force-dynamic";

function normalizeText(value?: string | null) {
  return String(value || "").trim().toLowerCase();
}

function normalizeSlugText(value?: string | null) {
  return normalizeText(value).replace(/-/g, " ");
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

function isPastEvent(event: any) {
  const value = getEventDate(event);
  if (!value) return false;
  const ts = new Date(value).getTime();
  if (Number.isNaN(ts)) return false;
  return ts < Date.now();
}

function dedupeById(items: any[] | null | undefined) {
  const out: any[] = [];
  const seen = new Set<string>();

  for (const item of items || []) {
    const id = item?.id;
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(item);
  }

  return out;
}

async function getVenueBySlug(supabase: any, slug: string) {
  const { data } = await supabase
    .from("venues")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  return data || null;
}

async function getLocalityForVenue(supabase: any, venue: any) {
  if (venue?.locality_id) {
    const { data } = await supabase
      .from("localities")
      .select("*")
      .eq("id", venue.locality_id)
      .maybeSingle();

    if (data) return data;
  }

  const possibleSlug = normalizeSlugText(venue?.locality || venue?.area || venue?.address);
  if (!possibleSlug) return null;

  let { data } = await supabase
    .from("localities")
    .select("*")
    .eq("slug", possibleSlug.replace(/\s+/g, "-"))
    .maybeSingle();

  if (data) return data;

  ({ data } = await supabase
    .from("localities")
    .select("*")
    .ilike("name", possibleSlug)
    .maybeSingle());

  return data || null;
}

async function getVenueEvents(
  supabase: any,
  {
    venue,
    limit = 12,
  }: {
    venue: any;
    limit?: number;
  }
) {
  let combined: any[] = [];
  const nowIso = new Date().toISOString();

  if (venue?.id) {
    const { data } = await supabase
      .from("events")
      .select("*")
      .in("status", ["published", "upcoming"])
      .eq("editorial_status", "published")
      .eq("index_status", "index")
      .eq("venue_id", venue.id)
      .order("start_date", { ascending: true })
      .limit(limit * 2);

    combined = combined.concat(data || []);
  }

  if (venue?.name) {
    const { data } = await supabase
      .from("events")
      .select("*")
      .in("status", ["published", "upcoming"])
      .eq("editorial_status", "published")
      .eq("index_status", "index")
      .ilike("venue_name", venue.name)
      .order("start_date", { ascending: true })
      .limit(limit * 2);

    combined = combined.concat(data || []);
  }

  const deduped = dedupeById(combined);
  const upcoming = deduped
    .filter((event: any) => !isPastEvent(event))
    .sort(
      (a: any, b: any) =>
        new Date(getEventDate(a) || 0).getTime() -
        new Date(getEventDate(b) || 0).getTime()
    )
    .slice(0, 6);

  const past = deduped
    .filter((event: any) => isPastEvent(event))
    .sort(
      (a: any, b: any) =>
        new Date(getEventDate(b) || 0).getTime() -
        new Date(getEventDate(a) || 0).getTime()
    )
    .slice(0, 6);

  return { upcoming, past };
}

async function getLocalityRelatedEvents(
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
  if (!locality?.id) return [];

  const nowIso = new Date().toISOString();
  const { data } = await supabase
    .from("events")
    .select("*")
    .in("status", ["published", "upcoming"])
    .eq("editorial_status", "published")
    .eq("index_status", "index")
    .eq("locality_id", locality.id)
    .gte("start_date", nowIso)
    .order("start_date", { ascending: true })
    .limit(limit * 3);

  const filtered = (data || []).filter((event: any) => {
    if (venue?.id && event?.venue_id && event.venue_id === venue.id) return false;
    const eventVenueName = normalizeText(event?.venue_name);
    const venueName = normalizeText(venue?.name);
    if (eventVenueName && venueName && eventVenueName === venueName) return false;
    return true;
  });

  return dedupeById(filtered).slice(0, limit);
}

async function getNearbyVenueCluster(
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
  if (!locality?.id) return [];

  const { data } = await supabase
    .from("venues")
    .select("*")
    .eq("locality_id", locality.id)
    .limit(limit * 3);

  const filtered = (data || []).filter((item: any) => item?.id !== venue?.id);
  return dedupeById(filtered).slice(0, limit);
}

export async function generateMetadata(
  props: { params: Promise<{ slug: string }> }
) {
  const { slug } = await props.params;
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
    `Discover venue details, event history, and locality context for ${venue?.name || "this venue"} on JaipurCircle.`;

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

  const [{ upcoming, past }, localityRelatedUpcoming, nearbyVenues] =
    await Promise.all([
      getVenueEvents(supabase, { venue, limit: 12 }),
      getLocalityRelatedEvents(supabase, { venue, locality, limit: 6 }),
      getNearbyVenueCluster(supabase, { venue, locality, limit: 6 }),
    ]);

  const localityHref = locality?.slug ? `/jaipur/${locality.slug}` : null;

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
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

      <header className="mt-6">
        <h1 className="text-3xl font-bold leading-tight text-gray-900 md:text-4xl">
          {venue.name}, Jaipur
        </h1>

        <p className="mt-4 max-w-3xl text-gray-700 leading-7">
          {venue.description ||
            venue.seo_blurb ||
            `${venue.name} is a venue in Jaipur. Explore upcoming events, past event history, and locality context on JaipurCircle.`}
        </p>

        <div className="mt-5 flex flex-wrap gap-3 text-sm">
          <span className="rounded-full bg-gray-100 px-4 py-2">
            Venue: {venue.name}
          </span>
          {locality?.name ? (
            <span className="rounded-full bg-gray-100 px-4 py-2">
              Locality: {locality.name}
            </span>
          ) : null}
          <span className="rounded-full bg-gray-100 px-4 py-2">
            Upcoming Events: {upcoming.length}
          </span>
          <span className="rounded-full bg-gray-100 px-4 py-2">
            Past Events: {past.length}
          </span>
        </div>

        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          {localityHref ? (
            <a
              href={localityHref}
              className="rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-blue-700 hover:bg-blue-100"
            >
              Explore {locality.name} →
            </a>
          ) : null}

          <a
            href="/events"
            className="rounded-full border border-gray-200 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
          >
            Explore Jaipur events →
          </a>
        </div>
      </header>

      <section className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 lg:col-span-2">
          <h2 className="text-xl font-semibold text-gray-900">Venue context</h2>
          <p className="mt-3 text-gray-700 leading-7">
            {venue.name} functions as an event node inside JaipurCircle’s entity
            graph, connecting event pages, venue history, and locality discovery.
            {locality?.name
              ? ` This venue is currently associated with ${locality.name}, helping users move between venue-level discovery and the broader locality hub.`
              : ` This venue is still building stronger locality association inside the Jaipur discovery graph.`}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="text-xl font-semibold text-gray-900">Venue snapshot</h2>
          <div className="mt-4 space-y-3 text-sm text-gray-700">
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">Venue</span>
              <span className="text-right font-medium">{venue.name}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">Locality</span>
              <span className="text-right font-medium">
                {locality?.name || "Jaipur"}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">Upcoming events</span>
              <span className="text-right font-medium">{upcoming.length}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">Past events</span>
              <span className="text-right font-medium">{past.length}</span>
            </div>
          </div>
        </div>
      </section>

      {upcoming.length > 0 ? (
        <section className="mt-12">
          <h2 className="text-2xl font-semibold text-gray-900">
            Upcoming events at {venue.name}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Discover upcoming events scheduled at {venue.name} in Jaipur.
          </p>

          <LocalityEventGrid
            title=""
            description=""
            events={upcoming}
            emptyText=""
            currentLocalityId={locality?.id || null}
            currentLocalityName={locality?.name || null}
          />
        </section>
      ) : (
        <section className="mt-12">
          <h2 className="text-2xl font-semibold text-gray-900">
            Upcoming events at {venue.name}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            There are no upcoming events currently linked to this venue.
          </p>
          <div className="mt-5 rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-600">
            <div className="flex flex-wrap gap-3">
              {localityHref ? (
                <a
                  href={localityHref}
                  className="rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-blue-700 hover:bg-blue-100"
                >
                  Explore {locality.name} →
                </a>
              ) : null}
              <a
                href="/events"
                className="rounded-full border border-gray-200 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
              >
                Explore Jaipur events →
              </a>
            </div>
          </div>
        </section>
      )}

      {past.length > 0 ? (
        <section className="mt-12">
          <h2 className="text-2xl font-semibold text-gray-900">
            Past events at {venue.name}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            JaipurCircle keeps event pages live after they end, helping build a
            permanent event history for {venue.name}.
          </p>

          <LocalityEventGrid
            title=""
            description=""
            events={past}
            emptyText=""
            currentLocalityId={locality?.id || null}
            currentLocalityName={locality?.name || null}
          />
        </section>
      ) : null}

      {localityRelatedUpcoming.length > 0 ? (
        <section className="mt-12">
          <h2 className="text-2xl font-semibold text-gray-900">
            More upcoming events around {venue.name}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            These upcoming events extend discovery through the surrounding
            locality context, helping users continue browsing beyond this venue.
          </p>

          <LocalityEventGrid
            title=""
            description=""
            events={localityRelatedUpcoming}
            emptyText=""
            currentLocalityId={locality?.id || null}
            currentLocalityName={locality?.name || null}
          />
        </section>
      ) : null}

      {nearbyVenues.length > 0 ? (
        <section className="mt-12">
          <h2 className="text-2xl font-semibold text-gray-900">
            Nearby venues in {locality?.name || "this area"}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            These nearby venues strengthen the locality discovery loop between
            venues, events, and locality hubs.
          </p>

          <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {nearbyVenues.map((item: any) => (
              <a
                key={item.id}
                href={`/venues/${item.slug}`}
                className="block rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <h3 className="text-lg font-semibold text-gray-900">
                  {item.name}
                </h3>
                <p className="mt-2 line-clamp-3 text-sm text-gray-600">
                  {item.description ||
                    item.seo_blurb ||
                    `${item.name} is another venue connected to ${locality?.name || "this part of Jaipur"}.`}
                </p>
                <div className="mt-4 text-sm font-medium text-blue-600">
                  View venue page →
                </div>
              </a>
            ))}
          </div>
        </section>
      ) : null}

      {(localityHref || venue?.address || locality?.name) && (
        <section className="mt-12 rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="text-xl font-semibold text-gray-900">Venue details</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-gray-100 p-4">
              <div className="text-xs uppercase tracking-wide text-gray-500">
                Name
              </div>
              <div className="mt-2 font-medium text-gray-900">{venue.name}</div>
            </div>

            <div className="rounded-xl border border-gray-100 p-4">
              <div className="text-xs uppercase tracking-wide text-gray-500">
                Locality
              </div>
              <div className="mt-2 font-medium text-gray-900">
                {locality?.name || "Jaipur"}
              </div>
              {localityHref ? (
                <a
                  href={localityHref}
                  className="mt-3 inline-block text-sm font-medium text-blue-600"
                >
                  Explore locality hub →
                </a>
              ) : null}
            </div>

            {venue?.address ? (
              <div className="rounded-xl border border-gray-100 p-4 md:col-span-2">
                <div className="text-xs uppercase tracking-wide text-gray-500">
                  Address
                </div>
                <div className="mt-2 font-medium text-gray-900">
                  {venue.address}
                </div>
              </div>
            ) : null}
          </div>
        </section>
      )}
    </main>
  );
}
