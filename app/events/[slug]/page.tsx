import EventSchema from './EventSchema';
import { createServerSupabaseClient } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import EventCard from '@/components/EventCard';

/* =========================
   FIELD RESOLVERS
   ========================= */

function resolveEventImage(event: any) {
  return (
    event?.cover_image_url ||
    event?.image_url ||
    event?.cover_image ||
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1200'
  );
}

function resolveVenueName(event: any, venue: any) {
  return venue?.name || event?.venue_name || 'Venue TBA';
}

function resolveLocalityName(event: any, locality: any) {
  return locality?.name || event?.locality || 'Jaipur';
}

function resolvePrice(event: any) {
  if (event?.is_free) return 'Free';
  if (event?.price_min) return `₹${event.price_min}`;
  if (event?.ticket_price) return `₹${event.ticket_price}`;
  return 'Price TBA';
}

function resolveDescription(event: any) {
  return (
    event?.short_description ||
    event?.meta_description ||
    event?.description ||
    `Explore ${event?.title} in Jaipur.`
  );
}

function resolveStatus(event: any) {
  if (event?.status) return event.status;

  const startValue = event?.start_time || event?.start_date;
  if (!startValue) return 'upcoming';

  const now = new Date();
  const eventDate = new Date(startValue);

  if (Number.isNaN(eventDate.getTime())) return 'upcoming';
  return eventDate < now ? 'past' : 'upcoming';
}

function formatEventDateTime(value?: string | null) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function dedupeEvents(events: any[], excludeId?: string) {
  const seen = new Set<string>();
  return (events || []).filter((event: any) => {
    if (!event?.id) return false;
    if (excludeId && event.id === excludeId) return false;
    if (seen.has(event.id)) return false;
    seen.add(event.id);
    return true;
  });
}

/* ========================= */

export async function generateMetadata(props: any) {
  const supabase = createServerSupabaseClient();
  const params = await props.params;
  const slug = params?.slug;

  if (!slug) return {};

  const { data } = await supabase.rpc('get_event_page', {
    p_slug: slug,
  });

  const event = data?.event;

  if (!event) return {};

  return {
    title: event?.meta_title || event?.title || 'Event in Jaipur',
    description:
      event?.meta_description ||
      event?.short_description ||
      event?.description ||
      `Explore ${event?.title || 'this event'} in Jaipur.`,
  };
}

export default async function EventPage(props: any) {
  const supabase = createServerSupabaseClient();

  const params = await props.params;
  const slug = params?.slug;

  if (!slug) return notFound();

  const { data } = await supabase.rpc('get_event_page', {
    p_slug: slug,
  });

  const event = data?.event;
  const venue = data?.venue;
  const locality = data?.locality;
  const categories = data?.categories || [];
  const moreFromVenueRaw = data?.more_from_venue || [];

  if (!event) return notFound();

  const image = resolveEventImage(event);
  const venueName = resolveVenueName(event, venue);
  const localityName = resolveLocalityName(event, locality);
  const price = resolvePrice(event);
  const description = resolveDescription(event);
  const status = resolveStatus(event);
  const isCompleted = status === 'past';
  const primaryCategory = categories?.[0] || null;

  const { data: artistLinks } = await supabase
    .from('event_artists_view')
    .select('*')
    .eq('event_id', event.id);

  const artists = artistLinks || [];

  let relatedByArtist: any[] = [];
  if (artists.length > 0) {
    const artistIds = artists
      .map((a: any) => a.artist_id)
      .filter(Boolean);

    if (artistIds.length > 0) {
      const { data: linkedArtistEvents } = await supabase
        .from('event_artists')
        .select('event_id')
        .in('artist_id', artistIds);

      const eventIds = [
        ...new Set((linkedArtistEvents || []).map((x: any) => x.event_id)),
      ].filter((id: string) => id !== event.id);

      if (eventIds.length > 0) {
        const { data: artistEvents } = await supabase
          .from('events')
          .select('*')
          .in('id', eventIds)
          .order('start_time', { ascending: true })
          .limit(6);

        relatedByArtist = artistEvents || [];
      }
    }
  }

  let relatedByLocality: any[] = [];
  if (locality?.id) {
    const { data: localityEvents } = await supabase
      .from('events')
      .select('*')
      .eq('locality_id', locality.id)
      .neq('id', event.id)
      .order('start_time', { ascending: true })
      .limit(6);

    relatedByLocality = localityEvents || [];
  } else if (event?.locality) {
    const { data: localityEvents } = await supabase
      .from('events')
      .select('*')
      .eq('locality', event.locality)
      .neq('id', event.id)
      .order('start_time', { ascending: true })
      .limit(6);

    relatedByLocality = localityEvents || [];
  }

  let relatedByCategory: any[] = [];
  if (primaryCategory?.id) {
    const { data: categoryLinks } = await supabase
      .from('event_categories')
      .select('event_id')
      .eq('category_id', primaryCategory.id);

    const relatedIds = (categoryLinks || [])
      .map((row: any) => row.event_id)
      .filter((id: string) => id !== event.id);

    if (relatedIds.length > 0) {
      const { data: categoryEvents } = await supabase
        .from('events')
        .select('*')
        .in('id', relatedIds)
        .order('start_time', { ascending: true })
        .limit(6);

      relatedByCategory = categoryEvents || [];
    }
  }

  const moreFromVenue = dedupeEvents(moreFromVenueRaw, event.id);
  const venueIds = new Set(moreFromVenue.map((e: any) => e.id));
  relatedByArtist = dedupeEvents(
    relatedByArtist.filter((e: any) => !venueIds.has(e.id)),
    event.id
  );
  const artistIdsUsed = new Set(relatedByArtist.map((e: any) => e.id));
  relatedByLocality = dedupeEvents(
    relatedByLocality.filter((e: any) => !venueIds.has(e.id) && !artistIdsUsed.has(e.id)),
    event.id
  );
  const localityIdsUsed = new Set(relatedByLocality.map((e: any) => e.id));
  relatedByCategory = dedupeEvents(
    relatedByCategory.filter(
      (e: any) =>
        !venueIds.has(e.id) &&
        !artistIdsUsed.has(e.id) &&
        !localityIdsUsed.has(e.id)
    ),
    event.id
  );

  return (
    <main className="max-w-6xl mx-auto px-4 md:px-6 pb-28">
      <EventSchema
        event={event}
        venue={venue}
        locality={locality}
        categories={categories}
        artists={artists}
      />

      <section className="relative h-[260px] md:h-[420px] rounded-2xl overflow-hidden mt-6">
        <img src={image} alt={event.title} className="w-full h-full object-cover" />

        <div className="absolute inset-0 bg-black/50" />

        <div className="absolute top-4 left-4">
          <span
            className={`px-4 py-2 text-sm rounded-full ${
              isCompleted ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'
            }`}
          >
            {isCompleted ? 'Completed Event' : 'Upcoming Event'}
          </span>
        </div>

        <div className="absolute bottom-4 left-4 right-4 text-white">
          <div className="flex flex-wrap gap-2 mb-3">
            {primaryCategory?.slug && primaryCategory?.name ? (
              <a
                href={`/categories/${primaryCategory.slug}`}
                className="px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-xs hover:bg-white/20 transition"
              >
                {primaryCategory.name}
              </a>
            ) : null}
            {locality?.slug && localityName ? (
              <a
                href={`/jaipur/${locality.slug}`}
                className="px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-xs hover:bg-white/20 transition"
              >
                {localityName}
              </a>
            ) : null}
          </div>

          <h1 className="text-3xl md:text-4xl font-bold">{event.title}</h1>

          <p className="mt-2 text-sm opacity-90">
            {venueName} • {localityName}
          </p>
        </div>
      </section>

      <section className="mt-6">
        <div className="flex flex-wrap gap-3 text-sm text-gray-600">
          <a href="/events" className="underline">
            All Events
          </a>

          {primaryCategory?.slug && primaryCategory?.name ? (
            <a href={`/categories/${primaryCategory.slug}`} className="underline">
              {primaryCategory.name} in Jaipur
            </a>
          ) : null}

          {locality?.slug ? (
            <a href={`/jaipur/${locality.slug}`} className="underline">
              Things to do in {localityName}
            </a>
          ) : null}

          {primaryCategory?.slug && locality?.slug ? (
            <a
              href={`/events-in/${primaryCategory.slug}/${locality.slug}`}
              className="underline"
            >
              {primaryCategory.name} in {localityName}
            </a>
          ) : null}

          {venue?.slug ? (
            <a href={`/venues/${venue.slug}`} className="underline">
              More at {venueName}
            </a>
          ) : null}
        </div>
      </section>

      <section className="mt-8 grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <section>
            <h2 className="text-xl font-semibold mb-3">About Event</h2>
            <p className="text-gray-600 leading-relaxed">{description}</p>
          </section>

          {artists.length > 0 ? (
            <section className="mt-8">
              <h2 className="text-lg font-semibold mb-3">Artists</h2>
              <div className="flex flex-wrap gap-2">
                {artists.map((artist: any) => (
                  <a
                    key={artist.artist_id}
                    href={`/artists/${artist.artist_slug}`}
                    className="px-3 py-2 bg-gray-100 rounded-full text-sm hover:bg-gray-200 transition"
                  >
                    {artist.artist_name}
                  </a>
                ))}
              </div>
            </section>
          ) : null}

          {categories.length > 0 ? (
            <section className="mt-8">
              <h2 className="text-lg font-semibold mb-3">Categories</h2>
              <div className="flex flex-wrap gap-2">
                {categories.map((c: any) => (
                  <a
                    key={c.id}
                    href={`/categories/${c.slug}`}
                    className="px-3 py-2 bg-gray-100 rounded-full text-sm hover:bg-gray-200 transition"
                  >
                    {c.name}
                  </a>
                ))}
              </div>
            </section>
          ) : null}

          {isCompleted ? (
            <section className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <h2 className="text-lg font-semibold text-amber-900">
                This event has ended
              </h2>
              <p className="mt-2 text-sm text-amber-800 leading-relaxed">
                This page stays live as part of JaipurCircle’s event archive. Explore similar
                upcoming events below by artist, venue, locality and category.
              </p>
            </section>
          ) : null}

          <section className="mt-8">
            <h2 className="text-lg font-semibold mb-3">Explore Nearby</h2>
            <div className="flex flex-wrap gap-3 text-sm">
              {venue?.slug ? (
                <a
                  href={`/venues/${venue.slug}`}
                  className="px-4 py-2 bg-gray-100 rounded-full hover:bg-gray-200 transition"
                >
                  More at {venueName}
                </a>
              ) : null}

              {locality?.slug ? (
                <a
                  href={`/jaipur/${locality.slug}`}
                  className="px-4 py-2 bg-gray-100 rounded-full hover:bg-gray-200 transition"
                >
                  Things to do in {localityName}
                </a>
              ) : null}

              {categories.map((c: any) =>
                locality?.slug ? (
                  <a
                    key={`hybrid-${c.id}`}
                    href={`/events-in/${c.slug}/${locality.slug}`}
                    className="px-4 py-2 bg-gray-100 rounded-full hover:bg-gray-200 transition"
                  >
                    {c.name} in {localityName}
                  </a>
                ) : null
              )}
            </div>
          </section>

          <p className="text-xs text-gray-400 mt-6">
            Last updated:{' '}
            {new Date(event.updated_at || Date.now()).toLocaleDateString()}
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-4 md:p-5 shadow-sm md:sticky md:top-24 h-fit">
          <h3 className="text-base md:text-lg font-semibold mb-4">
            Event Details
          </h3>

          <div className="space-y-3 text-sm text-gray-600">
            {event.start_time || event.start_date ? (
              <div>🕒 {formatEventDateTime(event.start_time || event.start_date)}</div>
            ) : null}

            <div>📍 {venueName}</div>
            <div>📌 {localityName}</div>
            <div>💰 {price}</div>
            <div>📍 Status: {isCompleted ? 'Past' : 'Upcoming'}</div>
          </div>

          {!isCompleted ? (
            event?.registration_url ? (
              <a
                href={event.registration_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 block w-full text-center bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition"
              >
                Book Tickets
              </a>
            ) : (
              <a
                href="/events"
                className="mt-6 block w-full text-center bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition"
              >
                Browse Tickets & Events
              </a>
            )
          ) : (
            <a
              href="/events"
              className="mt-6 block w-full text-center bg-black text-white py-3 rounded-xl font-semibold hover:bg-gray-900 transition"
            >
              Browse More Events
            </a>
          )}
        </div>
      </section>

      {relatedByArtist.length > 0 ? (
        <section className="mt-12">
          <h2 className="text-xl font-semibold mb-4">More from this artist</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {relatedByArtist.map((e: any) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        </section>
      ) : null}

      {moreFromVenue.length > 0 ? (
        <section className="mt-12">
          <h2 className="text-xl font-semibold mb-4">More at {venueName}</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {moreFromVenue.map((e: any) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        </section>
      ) : null}

      {relatedByLocality.length > 0 ? (
        <section className="mt-12">
          <h2 className="text-xl font-semibold mb-4">
            More events in {localityName}
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {relatedByLocality.map((e: any) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        </section>
      ) : null}

      {relatedByCategory.length > 0 ? (
        <section className="mt-12">
          <h2 className="text-xl font-semibold mb-4">
            Similar {primaryCategory?.name || 'events'} in Jaipur
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {relatedByCategory.map((e: any) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        </section>
      ) : null}

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 md:hidden">
        {!isCompleted ? (
          event?.registration_url ? (
            <a
              href={event.registration_url}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center bg-blue-600 text-white py-3 rounded-xl font-semibold"
            >
              Book Tickets
            </a>
          ) : (
            <a
              href="/events"
              className="block w-full text-center bg-blue-600 text-white py-3 rounded-xl font-semibold"
            >
              Browse More Events
            </a>
          )
        ) : (
          <a
            href="/events"
            className="block w-full text-center bg-black text-white py-3 rounded-xl font-semibold"
          >
            Browse More Events
          </a>
        )}
      </div>
    </main>
  );
}
