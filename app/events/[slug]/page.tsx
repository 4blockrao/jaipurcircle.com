import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase";
import EventSectionGrid from "@/components/events/EventSectionGrid";
import EventFreshnessBadge from "@/components/events/EventFreshnessBadge";
import EventSchema from "./EventSchema";
import {
  formatEventDateTime,
  getEventDisplayState,
  pickEventDate,
} from "@/lib/events/core";
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
    <main className="max-w-5xl mx-auto px-4 py-8">
      <EventSchema
        event={event}
        venue={venue}
        locality={locality}
        categories={categories}
        artists={artists}
      />

      <h1 className="text-3xl font-bold mb-4">{event.title}</h1>

      <div className="mb-4">
        <EventFreshnessBadge
          lastVerifiedAt={event.last_verified_at}
          updatedAt={event.updated_at}
        />
      </div>

      {state === "ended" && (
        <div className="mb-4 text-red-600 font-semibold">
          Event Closed
        </div>
      )}

      <div className="mb-6 space-y-3">
        <p>
          <strong>{event.title}</strong> is scheduled at{" "}
          <strong>{event.venue_name || "Venue TBA"}</strong>,{" "}
          {event.locality || locality?.name || "Jaipur"}, Jaipur on{" "}
          {formatEventDateTime(pickEventDate(event))}.
        </p>

        {event.short_description ? (
          <p className="text-gray-700">{event.short_description}</p>
        ) : null}

        {artists.length > 0 ? (
          <div className="pt-1">
            <div className="mb-2 text-sm font-medium text-gray-700">
              Artists / Performers
            </div>
            <div className="flex flex-wrap gap-2">
              {artists.map((artist: any) => (
                <a
                  key={artist.id}
                  href={`/artists/${artist.slug}`}
                  className="rounded-full bg-gray-100 px-4 py-2 text-sm hover:bg-gray-200"
                >
                  {artist.name}
                </a>
              ))}
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3 pt-1 text-sm">
          {event.locality || locality?.slug ? (
            <a
              href={`/jaipur/${locality?.slug || event.locality}`}
              className="rounded-full bg-gray-100 px-4 py-2 hover:bg-gray-200"
            >
              Explore {event.locality || locality?.name || "this locality"}
            </a>
          ) : null}

          {venue?.slug || event.venue_name ? (
            <a
              href={`/venues/${venue?.slug || String(event.venue_name).toLowerCase().replace(/\s+/g, "-")}`}
              className="rounded-full bg-gray-100 px-4 py-2 hover:bg-gray-200"
            >
              View venue page
            </a>
          ) : null}
        </div>
      </div>

      {state !== "ended" ? (
        event.registration_url || event.source_url ? (
          <a
            href={event.registration_url || event.source_url}
            className="inline-block bg-black text-white px-6 py-3 rounded"
          >
            Book Tickets
          </a>
        ) : (
          <div className="inline-block bg-black text-white px-6 py-3 rounded">
            View Details
          </div>
        )
      ) : (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">
            Find Similar Upcoming Events
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {similarEvents.map((e) => (
              <a key={e.id} href={`/events/${e.slug}`} className="border p-3 rounded">
                <p className="font-medium">{e.title}</p>
                <p className="text-sm text-gray-500">
                  {formatEventDateTime(e.start_date || e.start_time)}
                </p>
              </a>
            ))}
          </div>
        </div>
      )}

      {recommendationSections.map((section) => (
        <EventSectionGrid
          key={section.key}
          title={section.title}
          description={section.description}
          events={section.events}
          emptyText=""
        />
      ))}
    </main>
  );
}
