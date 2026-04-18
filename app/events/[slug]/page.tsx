import { notFound } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase';
import EventCard from '@/components/EventCard';
import EventSchema from './EventSchema';
import { getEventDisplayState } from '@/lib/events/getEventDisplayState';
import { getEventPrimaryCta } from '@/lib/events/getEventPrimaryCta';
import { buildEventQuickAnswers } from '@/lib/events/buildEventQuickAnswers';
import {
  buildEventParentLinks,
  buildCrossEntityLinks,
  buildEventBreadcrumbs,
} from '@/lib/internal-linking';

function formatDateTime(value?: string | null) {
  if (!value) return 'Date TBA';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date TBA';

  return date.toLocaleString('en-IN', {
    dateStyle: 'long',
    timeStyle: 'short',
  });
}

function resolveHeroImage(event: any) {
  return (
    event?.cover_image_url ||
    event?.image_url ||
    event?.cover_image ||
    'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=1200'
  );
}

function resolveStatusLabel(state: string) {
  switch (state) {
    case 'ended':
      return 'Event Closed';
    case 'today':
      return 'Happening Today';
    case 'live':
      return 'Live Now';
    case 'cancelled':
      return 'Cancelled';
    case 'postponed':
      return 'Postponed';
    case 'rescheduled':
      return 'Rescheduled';
    default:
      return 'Upcoming';
  }
}

function resolveVerifiedText(event: any) {
  if (!event?.last_verified_at) return null;

  const date = new Date(event.last_verified_at);
  if (Number.isNaN(date.getTime())) return null;

  return `Verified on ${date.toLocaleDateString('en-IN', { dateStyle: 'long' })}`;
}

export default async function EventPage({ params }: any) {
  const supabase = createServerSupabaseClient();
  const { slug } = await params;

  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (!event) return notFound();

  const [
    venueRes,
    localityRes,
    artistsRes,
    categoriesRes,
    similarRes,
  ] = await Promise.all([
    event.venue_id
      ? supabase.from('venues').select('*').eq('id', event.venue_id).maybeSingle()
      : Promise.resolve({ data: null }),
    event.locality_id
      ? supabase.from('localities').select('*').eq('id', event.locality_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from('event_artists')
      .select('artist:artists(*)')
      .eq('event_id', event.id),
    supabase
      .from('event_categories')
      .select('category:categories(*)')
      .eq('event_id', event.id),
    supabase.rpc('get_similar_upcoming_events', {
      p_event_id: event.id,
      p_limit: 6,
    }),
  ]);

  const venue = venueRes?.data || null;
  const localityEntity = localityRes?.data || null;

  const artists = (artistsRes?.data || [])
    .map((row: any) => row.artist)
    .filter(Boolean);

  const categories = (categoriesRes?.data || [])
    .map((row: any) => row.category)
    .filter(Boolean);

  const similarEvents = Array.isArray(similarRes?.data) ? similarRes.data : [];

  const category =
    categories[0]
      ? { slug: categories[0].slug, name: categories[0].name }
      : event.category
      ? { slug: event.category, name: event.category }
      : null;

  const locality =
    localityEntity
      ? { slug: localityEntity.slug, name: localityEntity.name }
      : event.locality
      ? { slug: event.locality, name: event.locality }
      : null;

  const venueLinkEntity =
    venue
      ? { slug: venue.slug, name: venue.name }
      : event.venue_name
      ? { slug: event.venue_name.toLowerCase().replace(/\s+/g, '-'), name: event.venue_name }
      : null;

  const breadcrumbs = buildEventBreadcrumbs({
    eventTitle: event.title,
    category,
    locality,
  });

  const parentLinks = buildEventParentLinks({
    category,
    locality,
    venue: venueLinkEntity,
  });

  const crossLinks = buildCrossEntityLinks({
    category,
    locality,
    venue: venueLinkEntity,
  });

  const displayState = getEventDisplayState({
    start_date: event.start_date,
    end_date: event.end_date,
    status: event.status,
  });

  const primaryCta = getEventPrimaryCta(event, displayState);
  const quickAnswers = buildEventQuickAnswers(event);
  const verifiedText = resolveVerifiedText(event);
  const heroImage = resolveHeroImage(event);

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-6 pb-20">
      <EventSchema
        event={event}
        venue={venue}
        locality={localityEntity}
        categories={categories}
        artists={artists}
      />

      <nav className="mt-6 text-sm text-gray-500 flex flex-wrap gap-2">
        {breadcrumbs.map((b, i) => (
          <span key={i}>
            {b.href !== '#' ? (
              <a href={b.href} className="hover:text-black">{b.label}</a>
            ) : (
              <span className="text-black">{b.label}</span>
            )}
            {i < breadcrumbs.length - 1 && ' > '}
          </span>
        ))}
      </nav>

      <section className="mt-6 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
        <div className="relative h-72 md:h-96 overflow-hidden">
          <img
            src={heroImage}
            alt={event.title}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent" />

          <div className="absolute left-5 top-5 flex flex-wrap gap-2">
            <span className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium text-white backdrop-blur">
              {category?.name || event.category || 'Event'}
            </span>
            <span
              className={`rounded-full px-3 py-1.5 text-xs font-medium text-white ${
                displayState === 'ended'
                  ? 'bg-amber-500'
                  : displayState === 'today' || displayState === 'live'
                  ? 'bg-emerald-500'
                  : 'bg-blue-600'
              }`}
            >
              {resolveStatusLabel(displayState)}
            </span>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 text-white">
            <h1 className="text-3xl md:text-5xl font-bold leading-tight">
              {event.h1_override || event.title}
            </h1>

            <p className="mt-3 max-w-3xl text-sm md:text-base text-white/90">
              {event.title} is happening at {event.venue_name || venue?.name || 'the venue'} in {event.locality || localityEntity?.name || 'Jaipur'}, Jaipur, on {formatDateTime(event.start_date)}.
            </p>

            <div className="mt-4 flex flex-wrap gap-3 text-sm text-white/90">
              <span>📅 {formatDateTime(event.start_date)}</span>
              <span>📍 {event.venue_name || venue?.name || 'Venue TBA'}</span>
              <span>📌 {event.locality || localityEntity?.name || 'Jaipur'}</span>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              {primaryCta.href ? (
                <a
                  href={primaryCta.href}
                  className="inline-flex items-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-black hover:bg-gray-100"
                >
                  {primaryCta.label}
                </a>
              ) : (
                <span className="inline-flex items-center rounded-full bg-white/80 px-5 py-3 text-sm font-semibold text-black">
                  {primaryCta.label}
                </span>
              )}

              {displayState === 'ended' && event.venue_name && (
                <a
                  href={`/venues/${venue?.slug || event.venue_name.toLowerCase().replace(/\s+/g, '-')}`}
                  className="inline-flex items-center rounded-full border border-white/40 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
                >
                  Upcoming Events at This Venue
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 px-6 py-5">
          <div className="flex flex-wrap gap-2">
            {parentLinks.map((l, i) => (
              <a key={i} href={l.href} className="px-3 py-1 rounded-full bg-gray-100 text-sm">
                {l.label}
              </a>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {crossLinks.map((l, i) => (
              <a key={i} href={l.href} className="px-3 py-1 rounded-full bg-gray-50 text-xs">
                {l.label}
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-8 lg:grid-cols-[1.5fr_.9fr]">
        <div>
          {displayState === 'ended' && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
              <h2 className="text-lg font-semibold text-amber-900">This event has ended</h2>
              <p className="mt-1 text-sm text-amber-800">
                This event page remains live as part of JaipurCircle’s permanent event archive. Use the recommendations below to discover similar upcoming events in Jaipur.
              </p>
            </div>
          )}

          <section className="mt-8">
            <h2 className="text-xl font-semibold">Quick Answers</h2>
            <div className="mt-4 space-y-3">
              {quickAnswers.map((line, idx) => (
                <p key={idx} className="text-gray-700 leading-7">
                  {line}
                </p>
              ))}
            </div>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-semibold">About the Event</h2>
            <p className="mt-4 text-gray-700 leading-7">
              {event.description || event.short_description || event.seo_blurb || 'Event details will be updated soon.'}
            </p>
          </section>

          {similarEvents.length > 0 && (
            <section id="similar-upcoming-events" className="mt-12">
              <h2 className="text-xl font-semibold">
                {displayState === 'ended' ? 'Similar Upcoming Events' : 'Related Upcoming Events'}
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Discover upcoming Jaipur events based on artist, venue, locality, category, and overall similarity.
              </p>

              <div className="mt-5 grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                {similarEvents.map((e: any) => (
                  <EventCard key={e.id} event={e} />
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-gray-200 bg-white p-5">
            <h2 className="text-lg font-semibold">Event Facts</h2>
            <div className="mt-4 space-y-3 text-sm text-gray-700">
              <div><strong>Date:</strong> {formatDateTime(event.start_date)}</div>
              <div><strong>Venue:</strong> {event.venue_name || venue?.name || 'Venue TBA'}</div>
              <div><strong>Locality:</strong> {event.locality || localityEntity?.name || 'Jaipur'}</div>
              <div><strong>Category:</strong> {category?.name || event.category || 'Event'}</div>
              <div><strong>Organizer:</strong> {event.organizer_name || 'Organizer TBA'}</div>
              <div><strong>Price:</strong> {event.is_free ? 'Free' : event.price_min ? `₹${event.price_min}` : event.ticket_price ? `₹${event.ticket_price}` : 'Price TBA'}</div>
              {verifiedText && <div><strong>Status:</strong> {verifiedText}</div>}
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-5">
            <h2 className="text-lg font-semibold">Venue & Access</h2>
            <div className="mt-4 space-y-2 text-sm text-gray-700">
              <p><strong>Venue:</strong> {event.venue_name || venue?.name || 'Venue TBA'}</p>
              <p><strong>Address:</strong> {event.venue_address || venue?.address || 'Address details will be updated soon.'}</p>
              <p><strong>Locality:</strong> {event.locality || localityEntity?.name || 'Jaipur'}</p>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {venue?.slug && (
                <a href={`/venues/${venue.slug}`} className="rounded-full bg-gray-100 px-3 py-2 text-sm">
                  Venue Page
                </a>
              )}
              {localityEntity?.slug && (
                <a href={`/jaipur/${localityEntity.slug}`} className="rounded-full bg-gray-100 px-3 py-2 text-sm">
                  Explore Locality
                </a>
              )}
            </div>
          </section>

          {(artists.length > 0 || categories.length > 0) && (
            <section className="rounded-2xl border border-gray-200 bg-white p-5">
              <h2 className="text-lg font-semibold">Explore More</h2>

              {artists.length > 0 && (
                <div className="mt-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Artists</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {artists.map((artist: any) => (
                      <a
                        key={artist.id}
                        href={`/artists/${artist.slug}`}
                        className="rounded-full bg-gray-100 px-3 py-2 text-sm"
                      >
                        {artist.name}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {categories.length > 0 && (
                <div className="mt-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Categories</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {categories.map((cat: any) => (
                      <a
                        key={cat.id}
                        href={`/categories/${cat.slug}`}
                        className="rounded-full bg-gray-100 px-3 py-2 text-sm"
                      >
                        {cat.name}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}
        </aside>
      </section>
    </main>
  );
}
