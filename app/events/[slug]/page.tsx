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
  if (event?.is_free) return 'Free Entry';
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
  if (event?.status) return String(event.status).toLowerCase();

  const startValue = event?.start_time || event?.start_date;
  if (!startValue) return 'upcoming';

  const now = new Date();
  const eventDate = new Date(startValue);

  if (Number.isNaN(eventDate.getTime())) return 'upcoming';
  return eventDate < now ? 'past' : 'upcoming';
}

function resolveCategoryLabel(category: any, event: any) {
  return (
    category?.name ||
    event?.category?.replace(/-/g, ' ') ||
    'Event'
  );
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

function formatEventDateOnly(value?: string | null) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleDateString('en-IN', {
    dateStyle: 'full',
  });
}

function formatEventTimeOnly(value?: string | null) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
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

function buildHighlights(event: any, venueName: string, localityName: string, price: string) {
  const highlights: string[] = [];

  if (event?.is_free) {
    highlights.push('Free entry');
  } else if (price && price !== 'Price TBA') {
    highlights.push(`Tickets from ${price}`);
  }

  if (venueName && venueName !== 'Venue TBA') {
    highlights.push(`Hosted at ${venueName}`);
  }

  if (localityName && localityName !== 'Jaipur') {
    highlights.push(`Located in ${localityName}, Jaipur`);
  }

  if (event?.organizer_name) {
    highlights.push(`Organized by ${event.organizer_name}`);
  }

  if (event?.tags?.length) {
    const readable = event.tags
      .slice(0, 2)
      .map((t: string) => String(t).replace(/-/g, ' '));
    if (readable.length > 0) {
      highlights.push(`Includes ${readable.join(' and ')}`);
    }
  }

  return highlights.slice(0, 4);
}

function buildFaq(event: any, venueName: string, localityName: string, price: string) {
  return [
    {
      q: `What is ${event?.title} about?`,
      a:
        event?.short_description ||
        event?.description ||
        `${event?.title} is an event in Jaipur.`,
    },
    {
      q: `Where is ${event?.title} happening?`,
      a: `${venueName}${localityName ? `, ${localityName}, Jaipur` : ', Jaipur'}.`,
    },
    {
      q: `What is the ticket price for ${event?.title}?`,
      a: price,
    },
    {
      q: `Is ${event?.title} upcoming or past?`,
      a: resolveStatus(event) === 'past' ? 'This event has ended.' : 'This is an upcoming event.',
    },
  ];
}

function buildWhyAttend(event: any, categoryLabel: string, localityName: string, venueName: string) {
  return [
    {
      title: 'Why it stands out',
      text:
        event?.short_description ||
        `A strong ${categoryLabel.toLowerCase()} experience in Jaipur with clear venue, timing, and discovery context.`,
    },
    {
      title: 'Who should go',
      text: `Ideal for people interested in ${categoryLabel.toLowerCase()} around ${localityName}.`,
    },
    {
      title: 'Venue advantage',
      text: `${venueName} gives this event a strong local context and makes it easy to discover similar experiences nearby.`,
    },
  ];
}

function buildDiscoveryLinks(primaryCategory: any, locality: any, venue: any, localityName: string) {
  const links = [
    { href: '/events', label: 'All Events' },
  ];

  if (primaryCategory?.slug && primaryCategory?.name) {
    links.push({
      href: `/categories/${primaryCategory.slug}`,
      label: `${primaryCategory.name} in Jaipur`,
    });
  }

  if (locality?.slug) {
    links.push({
      href: `/jaipur/${locality.slug}`,
      label: `Things to do in ${localityName}`,
    });
  }

  if (venue?.slug && venue?.name) {
    links.push({
      href: `/venues/${venue.slug}`,
      label: `More at ${venue.name}`,
    });
  }

  if (primaryCategory?.slug && locality?.slug) {
    links.push({
      href: `/events-in/${primaryCategory.slug}/${locality.slug}`,
      label: `${primaryCategory.name} in ${localityName}`,
    });
  }

  return links;
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
  const categoryLabel = resolveCategoryLabel(primaryCategory, event);
  const highlights = buildHighlights(event, venueName, localityName, price);
  const faqItems = buildFaq(event, venueName, localityName, price);
  const whyAttend = buildWhyAttend(event, categoryLabel, localityName, venueName);
  const discoveryLinks = buildDiscoveryLinks(primaryCategory, locality, venue, localityName);

  const { data: artistLinks } = await supabase
    .from('event_artists_view')
    .select('*')
    .eq('event_id', event.id);

  const artists = artistLinks || [];

  let relatedByArtist: any[] = [];
  if (artists.length > 0) {
    const artistIds = artists.map((a: any) => a.artist_id).filter(Boolean);

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

  let relatedUpcomingJaipur: any[] = [];
  const { data: jaipurUpcoming } = await supabase
    .from('events')
    .select('*')
    .eq('editorial_status', 'published')
    .neq('id', event.id)
    .order('start_time', { ascending: true })
    .limit(8);

  relatedUpcomingJaipur = jaipurUpcoming || [];

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

  const categoryIdsUsed = new Set(relatedByCategory.map((e: any) => e.id));

  relatedUpcomingJaipur = dedupeEvents(
    relatedUpcomingJaipur.filter(
      (e: any) =>
        !venueIds.has(e.id) &&
        !artistIdsUsed.has(e.id) &&
        !localityIdsUsed.has(e.id) &&
        !categoryIdsUsed.has(e.id)
    ),
    event.id
  );

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  };

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-6 pb-28">
      <EventSchema
        event={event}
        venue={venue}
        locality={locality}
        categories={categories}
        artists={artists}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <section className="relative h-[340px] md:h-[500px] rounded-3xl overflow-hidden mt-6">
        <img src={image} alt={event.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />

        <div className="absolute top-5 left-5 flex flex-wrap gap-2">
          <span className="px-3 py-1.5 rounded-full bg-white/15 backdrop-blur text-white text-xs md:text-sm font-medium">
            {categoryLabel}
          </span>

          <span
            className={`px-3 py-1.5 rounded-full text-xs md:text-sm font-medium ${
              isCompleted ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'
            }`}
          >
            {isCompleted ? 'Past Event' : 'Upcoming Event'}
          </span>

          {!isCompleted && price !== 'Price TBA' ? (
            <span className="px-3 py-1.5 rounded-full bg-black/45 backdrop-blur text-white text-xs md:text-sm font-medium">
              {price}
            </span>
          ) : null}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-5 md:p-8 text-white">
          <div className="max-w-4xl">
            <h1 className="text-2xl md:text-5xl font-bold leading-tight tracking-tight">
              {event.title}
            </h1>

            <p className="mt-3 text-sm md:text-base text-white/85 max-w-3xl leading-relaxed">
              {description}
            </p>

            <div className="mt-4 flex flex-wrap gap-3 text-sm md:text-base text-white/90">
              {formatEventDateOnly(event.start_time || event.start_date) ? (
                <span>{formatEventDateOnly(event.start_time || event.start_date)}</span>
              ) : null}
              <span>•</span>
              <span>{venueName}</span>
              <span>•</span>
              <span>{localityName}</span>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {!isCompleted ? (
                event?.registration_url ? (
                  <a
                    href={event.registration_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-3 text-sm md:text-base font-semibold text-gray-900 hover:bg-gray-100 transition"
                  >
                    Book Tickets
                  </a>
                ) : (
                  <a
                    href="/events"
                    className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-3 text-sm md:text-base font-semibold text-gray-900 hover:bg-gray-100 transition"
                  >
                    Explore More Events
                  </a>
                )
              ) : (
                <a
                  href="/events"
                  className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-3 text-sm md:text-base font-semibold text-gray-900 hover:bg-gray-100 transition"
                >
                  Browse Upcoming Events
                </a>
              )}

              {venue?.slug ? (
                <a
                  href={`/venues/${venue.slug}`}
                  className="inline-flex items-center justify-center rounded-2xl border border-white/30 bg-white/10 px-6 py-3 text-sm md:text-base font-medium text-white backdrop-blur hover:bg-white/15 transition"
                >
                  View Venue
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 flex flex-wrap gap-3 text-sm">
        {discoveryLinks.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="px-4 py-2 bg-gray-100 rounded-full text-gray-700 hover:bg-gray-200 transition"
          >
            {link.label}
          </a>
        ))}
      </section>

      <section className="mt-8 grid grid-cols-1 lg:grid-cols-[1.55fr_0.9fr] gap-8">
        <div className="space-y-8">
          {isCompleted ? (
            <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 md:p-6">
              <h2 className="text-lg font-semibold text-amber-900">
                This event has ended
              </h2>
              <p className="mt-2 text-sm md:text-base text-amber-800 leading-relaxed">
                This page remains live as part of JaipurCircle’s event archive. Explore similar
                upcoming events below by category, venue, locality and artist.
              </p>
            </section>
          ) : null}

          <section className="bg-white rounded-3xl border border-gray-200 p-6 md:p-8">
            <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-4">
              About this event
            </h2>

            <p className="text-gray-600 leading-relaxed text-sm md:text-base">
              {description}
            </p>

            {highlights.length > 0 ? (
              <div className="mt-6">
                <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-3">
                  Event highlights
                </h3>
                <ul className="grid sm:grid-cols-2 gap-3">
                  {highlights.map((item, index) => (
                    <li
                      key={index}
                      className="rounded-2xl bg-gray-50 border border-gray-100 px-4 py-3 text-sm text-gray-700"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>

          <section className="bg-white rounded-3xl border border-gray-200 p-6 md:p-8">
            <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-4">
              Why attend
            </h2>

            <div className="grid sm:grid-cols-3 gap-4">
              {whyAttend.map((item, index) => (
                <div key={index} className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white rounded-3xl border border-gray-200 p-6 md:p-8">
            <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-4">
              Quick information
            </h2>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
                <div className="text-xs uppercase tracking-wide text-gray-500">Date</div>
                <div className="mt-1 text-sm text-gray-800">
                  {formatEventDateOnly(event.start_time || event.start_date) || 'TBA'}
                </div>
              </div>

              <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
                <div className="text-xs uppercase tracking-wide text-gray-500">Time</div>
                <div className="mt-1 text-sm text-gray-800">
                  {formatEventTimeOnly(event.start_time || event.start_date) || 'TBA'}
                </div>
              </div>

              <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
                <div className="text-xs uppercase tracking-wide text-gray-500">Venue</div>
                <div className="mt-1 text-sm text-gray-800">{venueName}</div>
              </div>

              <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
                <div className="text-xs uppercase tracking-wide text-gray-500">Price</div>
                <div className="mt-1 text-sm text-gray-800">{price}</div>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-3xl border border-gray-200 p-6 md:p-8">
            <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-4">
              Venue & locality
            </h2>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
                <div className="text-xs uppercase tracking-wide text-gray-500">Venue</div>
                <div className="mt-1 text-sm font-medium text-gray-900">{venueName}</div>
                {event?.venue_address ? (
                  <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                    {event.venue_address}
                  </p>
                ) : null}
                {venue?.slug ? (
                  <a
                    href={`/venues/${venue.slug}`}
                    className="inline-block mt-3 text-sm text-blue-600 hover:underline"
                  >
                    View venue page
                  </a>
                ) : null}
              </div>

              <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
                <div className="text-xs uppercase tracking-wide text-gray-500">Locality</div>
                <div className="mt-1 text-sm font-medium text-gray-900">{localityName}</div>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                  Explore what else is happening in this part of Jaipur and discover similar nearby events.
                </p>
                {locality?.slug ? (
                  <a
                    href={`/jaipur/${locality.slug}`}
                    className="inline-block mt-3 text-sm text-blue-600 hover:underline"
                  >
                    Explore {localityName}
                  </a>
                ) : null}
              </div>
            </div>
          </section>

          {artists.length > 0 ? (
            <section className="bg-white rounded-3xl border border-gray-200 p-6 md:p-8">
              <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-4">
                Artist{artists.length > 1 ? 's' : ''}
              </h2>

              <div className="flex flex-wrap gap-3">
                {artists.map((artist: any) => (
                  <a
                    key={artist.artist_id}
                    href={`/artists/${artist.artist_slug}`}
                    className="px-4 py-2 bg-gray-100 rounded-full text-sm text-gray-800 hover:bg-gray-200 transition"
                  >
                    {artist.artist_name}
                  </a>
                ))}
              </div>
            </section>
          ) : null}

          <section className="bg-white rounded-3xl border border-gray-200 p-6 md:p-8">
            <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-4">
              Tags & discovery
            </h2>

            <div className="flex flex-wrap gap-2">
              {(event?.tags || []).length > 0 ? (
                (event.tags || []).map((tag: string, index: number) => (
                  <span
                    key={`${tag}-${index}`}
                    className="px-3 py-1.5 rounded-full bg-gray-100 text-sm text-gray-700"
                  >
                    {String(tag).replace(/-/g, ' ')}
                  </span>
                ))
              ) : (
                <span className="text-sm text-gray-500">
                  Tags will appear here as this event gets enriched.
                </span>
              )}
            </div>
          </section>

          <section className="bg-white rounded-3xl border border-gray-200 p-6 md:p-8">
            <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-4">
              Event FAQs
            </h2>

            <div className="space-y-4">
              {faqItems.map((item, index) => (
                <div key={index} className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
                  <h3 className="text-sm md:text-base font-semibold text-gray-900">
                    {item.q}
                  </h3>
                  <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                    {item.a}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="text-xs text-gray-500">
            Updated on {new Date(event.updated_at || Date.now()).toLocaleDateString('en-IN')} •
            {event?.source_label ? ` Source: ${event.source_label}` : ' JaipurCircle listing'}
            {event?.organizer_name ? ` • Organizer: ${event.organizer_name}` : ''}
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 h-fit">
          <div className="bg-white rounded-3xl border border-gray-200 p-5 md:p-6 shadow-sm">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">
              Event details
            </h2>

            <div className="space-y-4 text-sm">
              <div>
                <div className="text-xs uppercase tracking-wide text-gray-500">Date</div>
                <div className="mt-1 text-gray-800">
                  {formatEventDateOnly(event.start_time || event.start_date) || 'TBA'}
                </div>
              </div>

              <div>
                <div className="text-xs uppercase tracking-wide text-gray-500">Time</div>
                <div className="mt-1 text-gray-800">
                  {formatEventTimeOnly(event.start_time || event.start_date) || 'TBA'}
                </div>
              </div>

              <div>
                <div className="text-xs uppercase tracking-wide text-gray-500">Venue</div>
                <div className="mt-1 text-gray-800">{venueName}</div>
              </div>

              <div>
                <div className="text-xs uppercase tracking-wide text-gray-500">Location</div>
                <div className="mt-1 text-gray-800">{localityName}</div>
              </div>

              <div>
                <div className="text-xs uppercase tracking-wide text-gray-500">Price</div>
                <div className="mt-1 text-gray-800">{price}</div>
              </div>

              <div>
                <div className="text-xs uppercase tracking-wide text-gray-500">Status</div>
                <div className="mt-1 text-gray-800">
                  {isCompleted ? 'Past Event' : 'Upcoming Event'}
                </div>
              </div>

              {event?.organizer_name ? (
                <div>
                  <div className="text-xs uppercase tracking-wide text-gray-500">Organizer</div>
                  <div className="mt-1 text-gray-800">{event.organizer_name}</div>
                </div>
              ) : null}
            </div>

            <div className="mt-6 flex flex-col gap-3">
              {!isCompleted ? (
                event?.registration_url ? (
                  <a
                    href={event.registration_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full text-center bg-blue-600 text-white py-3 rounded-2xl font-semibold hover:bg-blue-700 transition"
                  >
                    Book Tickets
                  </a>
                ) : (
                  <a
                    href="/events"
                    className="w-full text-center bg-blue-600 text-white py-3 rounded-2xl font-semibold hover:bg-blue-700 transition"
                  >
                    Explore More Events
                  </a>
                )
              ) : (
                <a
                  href="/events"
                  className="w-full text-center bg-gray-900 text-white py-3 rounded-2xl font-semibold hover:bg-black transition"
                >
                  Browse Upcoming Events
                </a>
              )}

              {venue?.slug ? (
                <a
                  href={`/venues/${venue.slug}`}
                  className="w-full text-center border border-gray-200 text-gray-800 py-3 rounded-2xl font-medium hover:bg-gray-50 transition"
                >
                  View Venue Page
                </a>
              ) : null}

              {locality?.slug ? (
                <a
                  href={`/jaipur/${locality.slug}`}
                  className="w-full text-center border border-gray-200 text-gray-800 py-3 rounded-2xl font-medium hover:bg-gray-50 transition"
                >
                  Explore {localityName}
                </a>
              ) : null}
            </div>
          </div>
        </aside>
      </section>

      {relatedByArtist.length > 0 ? (
        <section className="mt-14">
          <h2 className="text-2xl font-semibold text-gray-900 mb-5">
            More from this artist
          </h2>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            {relatedByArtist.map((e: any) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        </section>
      ) : null}

      {moreFromVenue.length > 0 ? (
        <section className="mt-14">
          <h2 className="text-2xl font-semibold text-gray-900 mb-5">
            More at {venueName}
          </h2>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            {moreFromVenue.map((e: any) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        </section>
      ) : null}

      {relatedByLocality.length > 0 ? (
        <section className="mt-14">
          <h2 className="text-2xl font-semibold text-gray-900 mb-5">
            More events in {localityName}
          </h2>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            {relatedByLocality.map((e: any) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        </section>
      ) : null}

      {relatedByCategory.length > 0 ? (
        <section className="mt-14">
          <h2 className="text-2xl font-semibold text-gray-900 mb-5">
            Similar {categoryLabel} in Jaipur
          </h2>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            {relatedByCategory.map((e: any) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        </section>
      ) : null}

      {relatedUpcomingJaipur.length > 0 ? (
        <section className="mt-14">
          <h2 className="text-2xl font-semibold text-gray-900 mb-5">
            Upcoming events in Jaipur
          </h2>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            {relatedUpcomingJaipur.slice(0, 6).map((e: any) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        </section>
      ) : null}

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 md:hidden">
        {!isCompleted ? (
          event?.registration_url ? (
            <div className="flex items-center gap-3">
              <div className="min-w-[90px] text-sm font-semibold text-gray-900">
                {price}
              </div>
              <a
                href={event.registration_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center bg-blue-600 text-white py-3 rounded-2xl font-semibold"
              >
                Book Tickets
              </a>
            </div>
          ) : (
            <a
              href="/events"
              className="block w-full text-center bg-blue-600 text-white py-3 rounded-2xl font-semibold"
            >
              Explore More Events
            </a>
          )
        ) : (
          <a
            href="/events"
            className="block w-full text-center bg-gray-900 text-white py-3 rounded-2xl font-semibold"
          >
            Browse Upcoming Events
          </a>
        )}
      </div>
    </main>
  );
}
