import EventSchema from './EventSchema';
import { createServerSupabaseClient } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import EventCard from '@/components/EventCard';

function formatEventDateTime(value?: string | null) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function BreadcrumbSchema({
  event,
  locality,
  primaryCategory,
}: {
  event: any;
  locality?: any;
  primaryCategory?: any;
}) {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const items: any[] = [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Events',
      item: `${base}/events`,
    },
  ];

  if (primaryCategory?.slug) {
    items.push({
      '@type': 'ListItem',
      position: items.length + 1,
      name: primaryCategory.name,
      item: `${base}/categories/${primaryCategory.slug}`,
    });
  }

  if (locality?.slug) {
    items.push({
      '@type': 'ListItem',
      position: items.length + 1,
      name: locality.name,
      item: `${base}/jaipur/${locality.slug}`,
    });
  }

  items.push({
    '@type': 'ListItem',
    position: items.length + 1,
    name: event.title,
    item: `${base}/events/${event.slug}`,
  });

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: items,
        }),
      }}
    />
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const supabase = createServerSupabaseClient();
  const { slug } = await params;

  const { data: event } = await supabase
    .from('events')
    .select('title, meta_title, meta_description, description')
    .eq('slug', slug)
    .maybeSingle();

  if (!event) return {};

  return {
    title: event.meta_title || event.title,
    description:
      event.meta_description ||
      event.description ||
      `Explore ${event.title} in Jaipur.`,
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
  const moreFromVenue = data?.more_from_venue || [];

  if (!event) return notFound();

  const image =
    event.cover_image ||
    event.image_url ||
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1200';

  const now = new Date();
  const eventDate = event.start_time ? new Date(event.start_time) : null;

  const isCompleted =
    event.status === 'past' ||
    (eventDate &&
      !Number.isNaN(eventDate.getTime()) &&
      eventDate.getTime() < now.getTime());

  const { data: artistLinks } = await supabase
    .from('event_artists_view')
    .select('*')
    .eq('event_id', event.id);

  const artists = artistLinks || [];

  let relatedByArtist: any[] = [];

  if (artists.length > 0) {
    const artistIds = artists.map((a: any) => a.artist_id);

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
        .order('start_time', { ascending: false })
        .limit(6);

      relatedByArtist = artistEvents || [];
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
  }

  let relatedByCategory: any[] = [];
  if (categories.length > 0) {
    const primaryCategory = categories[0];

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
        .order('start_time', { ascending: false })
        .limit(6);

      relatedByCategory = categoryEvents || [];
    }
  }

  const usedIds = new Set<string>();
  const markUsed = (list: any[]) => {
    list.forEach((e: any) => usedIds.add(e.id));
  };

  markUsed(moreFromVenue || []);

  relatedByArtist = relatedByArtist.filter((e: any) => !usedIds.has(e.id));
  markUsed(relatedByArtist);

  relatedByLocality = relatedByLocality.filter((e: any) => !usedIds.has(e.id));
  markUsed(relatedByLocality);

  relatedByCategory = relatedByCategory.filter((e: any) => !usedIds.has(e.id));

  const primaryCategory = categories[0] || null;

  return (
    <main className="max-w-6xl mx-auto px-4 md:px-6 pb-28">
      <EventSchema
        event={event}
        venue={venue}
        locality={locality}
        categories={categories}
        artists={artists}
      />
      <BreadcrumbSchema
        event={event}
        locality={locality}
        primaryCategory={primaryCategory}
      />

      <section className="relative h-[260px] md:h-[420px] rounded-2xl overflow-hidden mt-6">
        <img
          src={image}
          alt={event.title}
          className="w-full h-full object-cover"
        />

        <div className="absolute inset-0 bg-black/50"></div>

        <div className="absolute top-4 left-4 z-10">
          <span
            className={`inline-flex items-center rounded-full px-4 py-2 text-xs md:text-sm font-medium backdrop-blur-sm ${
              isCompleted
                ? 'bg-amber-500/85 text-white'
                : 'bg-emerald-500/85 text-white'
            }`}
          >
            {isCompleted ? 'Completed Event' : 'Upcoming Event'}
          </span>
        </div>

        <div className="absolute bottom-4 left-4 right-4 text-white">
          <h1 className="text-xl md:text-4xl font-bold leading-tight">
            {event.title}
          </h1>

          <p className="mt-1 text-xs md:text-sm opacity-90">
            {venue?.name || 'Venue TBA'} {locality?.name ? `• ${locality.name}` : ''}
          </p>
        </div>
      </section>

      {isCompleted && (
        <section className="mt-6">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 md:p-6">
            <h2 className="text-base md:text-lg font-semibold text-amber-900">
              This event has ended
            </h2>

            <p className="mt-2 text-sm md:text-base text-amber-800 leading-relaxed">
              This page stays live as part of JaipurCircle’s event archive. Explore similar upcoming
              events below by artist, venue, locality and category.
            </p>
          </div>
        </section>
      )}

      <section className="mt-6 md:mt-8 grid md:grid-cols-3 gap-6 md:gap-8">
        <div className="md:col-span-2">
          <h2 className="text-lg md:text-xl font-semibold mb-2 md:mb-3">
            About Event
          </h2>

          <p className="text-gray-600 text-sm md:text-base leading-relaxed">
            {event.description || event.meta_description}
          </p>

          <div className="text-sm text-gray-500 mt-4 flex flex-wrap gap-2">
            {locality?.slug && locality?.name && (
              <a href={`/jaipur/${locality.slug}`} className="underline">
                More in {locality.name}
              </a>
            )}

            {primaryCategory?.slug && primaryCategory?.name && (
              <a href={`/categories/${primaryCategory.slug}`} className="underline">
                {primaryCategory.name} Events
              </a>
            )}

            {primaryCategory?.slug && locality?.slug && primaryCategory?.name && locality?.name && (
              <a
                href={`/events-in/${primaryCategory.slug}/${locality.slug}`}
                className="underline"
              >
                {primaryCategory.name} in {locality.name}
              </a>
            )}
          </div>

          {artists.length > 0 && (
            <div className="mt-5">
              <h3 className="text-sm md:text-base font-semibold text-gray-900 mb-3">
                Artists
              </h3>
              <div className="flex flex-wrap gap-2">
                {artists.map((artist: any) => (
                  <a
                    key={artist.artist_id}
                    href={`/artists/${artist.artist_slug}`}
                    className="px-3 py-1 bg-gray-100 rounded-full text-xs md:text-sm hover:bg-gray-200 transition"
                  >
                    {artist.artist_name}
                  </a>
                ))}
              </div>
            </div>
          )}

          {categories.length > 0 && (
            <div className="mt-5">
              <h3 className="text-sm md:text-base font-semibold text-gray-900 mb-3">
                Categories
              </h3>
              <div className="flex flex-wrap gap-2">
                {categories.map((c: any) => (
                  <a
                    key={c.id}
                    href={`/categories/${c.slug}`}
                    className="px-3 py-1 bg-gray-100 rounded-full text-xs md:text-sm hover:bg-gray-200 transition"
                  >
                    {c.name}
                  </a>
                ))}
              </div>
            </div>
          )}

          <section className="mt-10 text-sm text-gray-600 leading-relaxed">
            {isCompleted ? (
              <>
                <h2 className="text-lg font-semibold mb-2">
                  This Event Has Ended
                </h2>

                <p>
                  This event took place in {locality?.name || 'Jaipur'}.
                  While it is no longer active, you can explore similar upcoming events
                  in the same category and location.
                </p>
              </>
            ) : (
              <>
                <h2 className="text-lg font-semibold mb-2">
                  About This Event
                </h2>

                <p>
                  Discover this {(primaryCategory?.name || 'live').toLowerCase()} event happening in {locality?.name || 'Jaipur'}.
                  Stay updated with timing, venue, and artist details to plan your experience.
                </p>
              </>
            )}
          </section>

          <p className="text-xs text-gray-400 mt-4">
            Last updated: {new Date(event.updated_at || Date.now()).toLocaleDateString()}
          </p>

          <div className="mt-8 border-t pt-6">
            <h2 className="text-lg md:text-xl font-semibold mb-3">
              Explore Nearby
            </h2>

            <div className="flex flex-wrap gap-3 text-sm">
              {venue?.slug && (
                <a
                  href={`/venues/${venue.slug}`}
                  className="px-4 py-2 bg-gray-100 rounded-full hover:bg-gray-200 transition"
                >
                  More at {venue.name}
                </a>
              )}

              {locality?.slug && (
                <a
                  href={`/jaipur/${locality.slug}`}
                  className="px-4 py-2 bg-gray-100 rounded-full hover:bg-gray-200 transition"
                >
                  Things to do in {locality.name}
                </a>
              )}

              {categories.map((c: any) =>
                locality?.slug ? (
                  <a
                    key={`hybrid-${c.id}`}
                    href={`/events-in/${c.slug}/${locality.slug}`}
                    className="px-4 py-2 bg-gray-100 rounded-full hover:bg-gray-200 transition"
                  >
                    {c.name} in {locality.name}
                  </a>
                ) : null
              )}
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-4 md:p-5 shadow-sm md:sticky md:top-24">
          <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4">
            Event Details
          </h3>

          <div className="space-y-2 md:space-y-3 text-xs md:text-sm text-gray-600">
            {event.start_time && (
              <div>🕒 {formatEventDateTime(event.start_time)}</div>
            )}

            {venue?.slug && (
              <div>
                📍{' '}
                <a
                  href={`/venues/${venue.slug}`}
                  className="text-blue-600 hover:underline"
                >
                  {venue.name}
                </a>
              </div>
            )}

            {locality?.slug && (
              <div>
                📌{' '}
                <a
                  href={`/jaipur/${locality.slug}`}
                  className="text-blue-600 hover:underline"
                >
                  {locality.name}
                </a>
              </div>
            )}

            <div>
              💰 {event.price_min ? `₹${event.price_min}` : 'Free'}
            </div>

            <div>
              📍 Status: {isCompleted ? 'Past' : 'Upcoming'}
            </div>
          </div>

          {!isCompleted ? (
            <button className="mt-6 w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition">
              Book Tickets
            </button>
          ) : (
            <a
              href="/events"
              className="mt-6 block w-full text-center bg-gray-900 text-white py-3 rounded-xl font-semibold hover:bg-black transition"
            >
              Browse More Events
            </a>
          )}
        </div>
      </section>

      {relatedByArtist.length > 0 && (
        <section className="mt-12 md:mt-16">
          <h2 className="text-lg md:text-xl font-semibold mb-4">
            More from this artist
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {relatedByArtist.map((e: any) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        </section>
      )}

      {moreFromVenue.length > 0 && (
        <section className="mt-12 md:mt-16">
          <h2 className="text-lg md:text-xl font-semibold mb-4">
            More events at {venue?.name}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {moreFromVenue.map((e: any) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        </section>
      )}

      {relatedByLocality.length > 0 && (
        <section className="mt-12">
          <h2 className="text-lg md:text-xl font-semibold mb-4">
            More events in {locality?.name}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {relatedByLocality.map((e: any) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        </section>
      )}

      {relatedByCategory.length > 0 && (
        <section className="mt-12">
          <h2 className="text-lg md:text-xl font-semibold mb-4">
            Similar {primaryCategory?.name || 'events'} in Jaipur
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {relatedByCategory.map((e: any) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        </section>
      )}

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 md:hidden">
        {!isCompleted ? (
          <button className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold">
            Book Tickets
          </button>
        ) : (
          <a
            href="/events"
            className="block w-full text-center bg-gray-900 text-white py-3 rounded-xl font-semibold"
          >
            Browse More Events
          </a>
        )}
      </div>
    </main>
  );
}
