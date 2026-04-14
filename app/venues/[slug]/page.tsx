import { notFound } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase';
import EventCard from '@/components/EventCard';
import {
  buildVenueBreadcrumbs,
  buildVenueDiscoveryLinks,
} from '@/lib/internal-linking';

function titleFromSlug(slug?: string) {
  if (!slug) return 'Venue';
  return slug
    .split('-')
    .map((x) => x.charAt(0).toUpperCase() + x.slice(1))
    .join(' ');
}

function resolveVenueName(venue: any, fallbackSlug?: string) {
  return venue?.name || venue?.venue_name || titleFromSlug(fallbackSlug);
}

function resolveVenueImage(venue: any, events: any[]) {
  return (
    venue?.image_url ||
    venue?.cover_image_url ||
    venue?.cover_image ||
    events?.find((e: any) => e?.cover_image_url)?.cover_image_url ||
    events?.find((e: any) => e?.image_url)?.image_url ||
    events?.find((e: any) => e?.cover_image)?.cover_image ||
    'https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=1400'
  );
}

function resolveVenueAddress(venue: any, events: any[]) {
  return (
    venue?.address ||
    venue?.venue_address ||
    events?.find((e: any) => e?.venue_address)?.venue_address ||
    'Jaipur, Rajasthan'
  );
}

function resolveVenueDescription(
  venue: any,
  venueName: string,
  localityName: string
) {
  return (
    venue?.description ||
    venue?.short_description ||
    `Explore events hosted at ${venueName}${localityName ? ` in ${localityName}, Jaipur` : ' in Jaipur'}. Discover upcoming shows, performances, exhibitions, and related experiences connected to this venue on JaipurCircle.`
  );
}

function isUpcomingEvent(event: any) {
  const value = event?.start_time || event?.start_date;
  if (!value) return true;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return true;

  return date >= new Date();
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

function buildFaq(venueName: string, upcomingCount: number, pastCount: number, localityName: string) {
  return [
    {
      q: `What is ${venueName}?`,
      a: `${venueName} is a Jaipur venue listed on JaipurCircle with connected event activity and discovery pages.`,
    },
    {
      q: `Are there upcoming events at ${venueName}?`,
      a:
        upcomingCount > 0
          ? `Yes, there are ${upcomingCount} upcoming event${upcomingCount === 1 ? '' : 's'} currently listed at ${venueName}.`
          : `There are currently no upcoming events listed at ${venueName}.`,
    },
    {
      q: `Where is ${venueName} located?`,
      a: localityName ? `${venueName} is connected to ${localityName}, Jaipur.` : `${venueName} is located in Jaipur.`,
    },
    {
      q: `Can I explore past events at ${venueName}?`,
      a:
        pastCount > 0
          ? `Yes, JaipurCircle keeps past event pages live as archive references for ${venueName}.`
          : `There are no past archived events listed for ${venueName} right now.`,
    },
  ];
}

export async function generateMetadata(props: any) {
  const supabase = createServerSupabaseClient();
  const params = await props.params;
  const slug = params?.slug;

  if (!slug) return {};

  const { data: venue } = await supabase
    .from('venues')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  const venueName = resolveVenueName(venue, slug);
  const localityName = venue?.locality || 'Jaipur';
  const description = resolveVenueDescription(venue, venueName, localityName);

  return {
    title: `${venueName} | Venue Profile & Events in Jaipur`,
    description,
  };
}

export default async function VenuePage(props: any) {
  const supabase = createServerSupabaseClient();
  const params = await props.params;
  const slug = params?.slug;

  if (!slug) return notFound();

  const { data: venue } = await supabase
    .from('venues')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  let eventsRaw: any[] = [];

  if (venue?.id) {
    const { data: eventsByVenueId } = await supabase
      .from('events')
      .select('*')
      .eq('editorial_status', 'published')
      .eq('venue_id', venue.id)
      .order('start_time', { ascending: true });

    eventsRaw = eventsByVenueId || [];
  }

  if ((!eventsRaw || eventsRaw.length === 0) && venue?.name) {
    const { data: eventsByVenueName } = await supabase
      .from('events')
      .select('*')
      .eq('editorial_status', 'published')
      .eq('venue_name', venue.name)
      .order('start_time', { ascending: true });

    eventsRaw = eventsByVenueName || [];
  }

  if (!venue && eventsRaw.length === 0) return notFound();

  const events = dedupeById(eventsRaw || []);

  const venueName = resolveVenueName(venue, slug);
  const localityName = venue?.locality || events?.find((e: any) => e?.locality)?.locality || 'Jaipur';
  const venueImage = resolveVenueImage(venue, events);
  const venueAddress = resolveVenueAddress(venue, events);
  const venueDescription = resolveVenueDescription(venue, venueName, localityName);

  const upcomingEvents = events.filter(isUpcomingEvent);
  const pastEvents = events.filter((event: any) => !isUpcomingEvent(event));

  const uniqueCategories = [...new Set(events.map((e: any) => e?.category).filter(Boolean))]
    .slice(0, 8)
    .map((name: string) => ({ slug: name, name }));

  const venueLocality =
    localityName && localityName !== 'Jaipur'
      ? { slug: localityName, name: localityName }
      : null;

  const discoveryLinks = buildVenueDiscoveryLinks({
    locality: venueLocality,
    categories: uniqueCategories,
  });

  const breadcrumbs = buildVenueBreadcrumbs(venueName);
  const faqItems = buildFaq(venueName, upcomingEvents.length, pastEvents.length, localityName);

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };

  const placeSchema = {
    '@context': 'https://schema.org',
    '@type': 'Place',
    name: venueName,
    description: venueDescription,
    image: venueImage,
    address: {
      '@type': 'PostalAddress',
      streetAddress: venueAddress,
      addressLocality: localityName || 'Jaipur',
      addressRegion: 'Rajasthan',
      addressCountry: 'India',
    },
    url: `https://www.jaipurcircle.com/venues/${slug}`,
  };

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-6 pb-28">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(placeSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <nav className="mt-6 text-sm text-gray-500 flex flex-wrap gap-2">
        {breadcrumbs.map((b, i) => (
          <span key={`${b.label}-${i}`}>
            {b.href !== '#' ? (
              <a href={b.href} className="hover:text-gray-800 transition">{b.label}</a>
            ) : (
              <span className="text-gray-800">{b.label}</span>
            )}
            {i < breadcrumbs.length - 1 && ' › '}
          </span>
        ))}
      </nav>

      <section className="relative h-[320px] md:h-[420px] rounded-3xl overflow-hidden mt-4">
        <img src={venueImage} alt={venueName} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10" />

        <div className="absolute top-5 left-5 flex flex-wrap gap-2">
          <span className="px-3 py-1.5 rounded-full bg-white/15 backdrop-blur text-white text-xs md:text-sm font-medium">
            Venue Profile
          </span>
          {upcomingEvents.length > 0 ? (
            <span className="px-3 py-1.5 rounded-full bg-emerald-500 text-white text-xs md:text-sm font-medium">
              {upcomingEvents.length} Upcoming Event{upcomingEvents.length === 1 ? '' : 's'}
            </span>
          ) : null}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-5 md:p-8 text-white">
          <div className="max-w-4xl">
            <h1 className="text-3xl md:text-5xl font-bold leading-tight tracking-tight">
              {venueName}
            </h1>
            <p className="mt-3 text-sm md:text-base text-white/85 max-w-3xl leading-relaxed">
              {venueDescription}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="#upcoming-events"
                className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-3 text-sm md:text-base font-semibold text-gray-900 hover:bg-gray-100 transition"
              >
                View Upcoming Events
              </a>
              <a
                href="/events"
                className="inline-flex items-center justify-center rounded-2xl border border-white/30 bg-white/10 px-6 py-3 text-sm md:text-base font-medium text-white backdrop-blur hover:bg-white/15 transition"
              >
                Browse Jaipur Events
              </a>
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
          <section className="bg-white rounded-3xl border border-gray-200 p-6 md:p-8">
            <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-4">
              About {venueName}
            </h2>
            <p className="text-gray-600 leading-relaxed text-sm md:text-base">
              {venueDescription}
            </p>

            <div className="mt-6 grid sm:grid-cols-3 gap-4">
              <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
                <div className="text-xs uppercase tracking-wide text-gray-500">Upcoming Events</div>
                <div className="mt-1 text-lg font-semibold text-gray-900">{upcomingEvents.length}</div>
              </div>
              <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
                <div className="text-xs uppercase tracking-wide text-gray-500">Past Events</div>
                <div className="mt-1 text-lg font-semibold text-gray-900">{pastEvents.length}</div>
              </div>
              <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
                <div className="text-xs uppercase tracking-wide text-gray-500">Locality</div>
                <div className="mt-1 text-lg font-semibold text-gray-900">{localityName}</div>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-3xl border border-gray-200 p-6 md:p-8">
            <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-4">
              Venue details
            </h2>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
                <div className="text-xs uppercase tracking-wide text-gray-500">Venue Name</div>
                <div className="mt-1 text-sm font-medium text-gray-900">{venueName}</div>
              </div>
              <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
                <div className="text-xs uppercase tracking-wide text-gray-500">Locality</div>
                <div className="mt-1 text-sm font-medium text-gray-900">{localityName}</div>
              </div>
              <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4 sm:col-span-2">
                <div className="text-xs uppercase tracking-wide text-gray-500">Address</div>
                <div className="mt-1 text-sm text-gray-800 leading-relaxed">{venueAddress}</div>
              </div>
            </div>
          </section>

          {uniqueCategories.length > 0 ? (
            <section className="bg-white rounded-3xl border border-gray-200 p-6 md:p-8">
              <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-4">
                Event categories at this venue
              </h2>
              <div className="flex flex-wrap gap-2">
                {uniqueCategories.map((category: any) => (
                  <a
                    key={category.slug}
                    href={`/categories/${category.slug}`}
                    className="px-3 py-1.5 rounded-full bg-gray-100 text-sm text-gray-700 hover:bg-gray-200 transition"
                  >
                    {String(category.name).replace(/-/g, ' ')}
                  </a>
                ))}
              </div>
            </section>
          ) : null}

          <section className="bg-white rounded-3xl border border-gray-200 p-6 md:p-8">
            <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-4">
              Venue FAQs
            </h2>
            <div className="space-y-4">
              {faqItems.map((item, index) => (
                <div key={index} className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
                  <h3 className="text-sm md:text-base font-semibold text-gray-900">{item.q}</h3>
                  <p className="mt-2 text-sm text-gray-600 leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 h-fit">
          <div className="bg-white rounded-3xl border border-gray-200 p-5 md:p-6 shadow-sm">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">
              Venue overview
            </h2>

            <div className="space-y-4 text-sm">
              <div>
                <div className="text-xs uppercase tracking-wide text-gray-500">Venue</div>
                <div className="mt-1 text-gray-800">{venueName}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-gray-500">Locality</div>
                <div className="mt-1 text-gray-800">{localityName}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-gray-500">Upcoming Events</div>
                <div className="mt-1 text-gray-800">{upcomingEvents.length}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-gray-500">Past Events</div>
                <div className="mt-1 text-gray-800">{pastEvents.length}</div>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <a
                href="#upcoming-events"
                className="w-full text-center bg-blue-600 text-white py-3 rounded-2xl font-semibold hover:bg-blue-700 transition"
              >
                View Upcoming Events
              </a>
              <a
                href="/events"
                className="w-full text-center border border-gray-200 text-gray-800 py-3 rounded-2xl font-medium hover:bg-gray-50 transition"
              >
                Browse Jaipur Events
              </a>
            </div>
          </div>
        </aside>
      </section>

      <section id="upcoming-events" className="mt-14">
        <h2 className="text-2xl font-semibold text-gray-900 mb-5">
          Upcoming events at {venueName}
        </h2>

        {upcomingEvents.length === 0 ? (
          <div className="rounded-3xl border border-gray-200 bg-white p-6 md:p-8">
            <h3 className="text-lg font-semibold text-gray-900">No upcoming events listed yet</h3>
            <p className="mt-2 text-gray-600 leading-relaxed">
              This venue page remains live on JaipurCircle as part of the city’s venue graph.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            {upcomingEvents.map((event: any) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </section>

      {pastEvents.length > 0 ? (
        <section className="mt-14">
          <h2 className="text-2xl font-semibold text-gray-900 mb-5">
            Past events archive
          </h2>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            {pastEvents.slice(0, 9).map((event: any) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
