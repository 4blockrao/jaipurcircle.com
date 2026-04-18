import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase";
import EventSchema from "./EventSchema";
import EventHero from "@/components/events/detail/EventHero";
import EventFacts from "@/components/events/detail/EventFacts";
import EventSummary from "@/components/events/detail/EventSummary";
import EventGraphLinks from "@/components/events/detail/EventGraphLinks";
import EventArchiveBlock from "@/components/events/detail/EventArchiveBlock";
import EventRecommendations from "@/components/events/detail/EventRecommendations";
import { getEventDisplayState, pickEventDate, formatEventDateTime } from "@/lib/events/core";
import { buildEventRecommendationSections } from "@/lib/events/recommendations";

export const dynamic = "force-dynamic";

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = createServerSupabaseClient();

  const { data: event, error } = await supabase
    .from("events")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!event || error) return notFound();

  const state = getEventDisplayState(event);

  const [{ data: artistRows }, { data: venue }, { data: locality }, { data: categoryRows }] =
    await Promise.all([
      supabase
        .from("event_artists")
        .select("artist_id, artist:artists(id, name, slug, status, editorial_status, index_status)")
        .eq("event_id", event.id),
      event.venue_id
        ? supabase.from("venues").select("*").eq("id", event.venue_id).maybeSingle()
        : Promise.resolve({ data: null }),
      event.locality_id
        ? supabase.from("localities").select("*").eq("id", event.locality_id).maybeSingle()
        : Promise.resolve({ data: null }),
      supabase
        .from("event_categories")
        .select("category:categories(id, name, slug)")
        .eq("event_id", event.id),
    ]);

  const artists = (artistRows || [])
    .map((row: any) => row.artist)
    .filter(
      (artist: any) =>
        artist &&
        artist.slug &&
        artist.status === "published" &&
        artist.index_status === "index" &&
        (artist.editorial_status === "published" || artist.editorial_status == null)
    );

  const categories = (categoryRows || [])
    .map((row: any) => row.category)
    .filter(Boolean);

  let similarEvents: any[] = [];

  const rpcRes = await supabase.rpc("get_similar_upcoming_events", {
    p_event_id: event.id,
    p_limit: 6,
  });

  if (!rpcRes.error && Array.isArray(rpcRes.data)) {
    similarEvents = rpcRes.data;
  } else {
    const dateField = pickEventDate(event) ? "start_date" : "start_time";

    let fallbackQuery = supabase
      .from("events")
      .select("*")
      .neq("id", event.id)
      .in("status", ["published", "upcoming"])
      .eq("editorial_status", "published")
      .limit(6);

    const nowIso = new Date().toISOString();
    fallbackQuery =
      dateField === "start_date"
        ? fallbackQuery.gt("start_date", nowIso).order("start_date", { ascending: true })
        : fallbackQuery.gt("start_time", nowIso).order("start_time", { ascending: true });

    const { data } = await fallbackQuery;
    similarEvents = data || [];
  }

  const recommendationSections = await buildEventRecommendationSections(supabase, {
    event,
    artists,
    locality,
    venue,
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <EventSchema
        event={event}
        venue={venue}
        locality={locality}
        categories={categories}
        artists={artists}
      />

      <EventHero event={event} artists={artists} />
      <EventFacts event={event} artists={artists} />
      <EventSummary event={event} />
      <EventGraphLinks event={event} artists={artists} venue={venue} locality={locality} />

      {state === "ended" ? <EventArchiveBlock /> : null}

      {state === "ended" && similarEvents.length > 0 ? (
        <section className="mt-8 rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-gray-900">Find Similar Upcoming Events</h2>
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {similarEvents.map((e) => (
              <a key={e.id} href={`/events/${e.slug}`} className="rounded-2xl border border-gray-200 p-4 hover:bg-gray-50">
                <p className="font-medium text-gray-900">{e.title}</p>
                <p className="mt-1 text-sm text-gray-500">
                  {formatEventDateTime(e.start_date || e.start_time)}
                </p>
              </a>
            ))}
          </div>
        </section>
      ) : null}

      <EventRecommendations sections={recommendationSections} />
    </main>
  );
}
