import { notFound } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase';
import EventCard from '@/components/EventCard';
import {
  buildArtistBreadcrumbs,
  buildArtistDiscoveryLinks,
} from '@/lib/internal-linking';

function resolveArtistName(artist: any, fallbackSlug?: string) {
  return (
    artist?.name ||
    artist?.artist_name ||
    (fallbackSlug
      ? fallbackSlug
          .split('-')
          .map((x: string) => x.charAt(0).toUpperCase() + x.slice(1))
          .join(' ')
      : 'Artist')
  );
}

function resolveArtistImage(artist: any) {
  return (
    artist?.image_url ||
    artist?.cover_image_url ||
    artist?.cover_image ||
    'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=1200'
  );
}

function resolveArtistBio(artist: any, artistName: string) {
  return (
    artist?.bio ||
    artist?.description ||
    artist?.short_description ||
    `${artistName} is featured on JaipurCircle as part of Jaipur’s live event and performance ecosystem. Explore upcoming and past events, discover venues, and follow related event activity in Jaipur.`
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

function buildFaq(artistName: string, upcomingCount: number, pastCount: number) {
  return [
    {
      q: `Who is ${artistName}?`,
      a: `${artistName} is listed on JaipurCircle as an artist or performer connected to Jaipur event activity.`,
    },
    {
      q: `Are there any upcoming events featuring ${artistName}?`,
      a:
        upcomingCount > 0
          ? `Yes, there are ${upcomingCount} upcoming event${upcomingCount === 1 ? '' : 's'} featuring ${artistName}.`
          : `There are currently no upcoming events featuring ${artistName}.`,
    },
    {
      q: `Can I explore past events by ${artistName}?`,
      a:
        pastCount > 0
          ? `Yes, JaipurCircle also keeps past event pages live as archive references for ${artistName}.`
          : `There are no past archived events listed for ${artistName} right now.`,
    },
    {
      q: `Where can I discover more events in Jaipur?`,
      a: `You can browse all Jaipur events, category pages, locality pages, and related event listings on JaipurCircle.`,
    },
  ];
}

export async function generateMetadata(props: any) {
  const supabase = createServerSupabaseClient();
  const params = await props.params;
  const slug = params?.slug;

  if (!slug) return {};

  const { data: artist } = await supabase
    .from('artists')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  const artistName = resolveArtistName(artist, slug);
  const artistBio = resolveArtistBio(artist, artistName);

  return {
    title: `${artistName} | Artist Profile & Events in Jaipur`,
    description: artistBio,
  };
}

export default async function ArtistPage(props: any) {
  const supabase = createServerSupabaseClient();
  const params = await props.params;
  const slug = params?.slug;

  if (!slug) return notFound();

  const { data: artist } = await supabase
    .from('artists')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  const artistName = resolveArtistName(artist, slug);
  const artistImage = resolveArtistImage(artist);
  const artistBio = resolveArtistBio(artist, artistName);

  const { data: artistLinks } = await supabase
    .from('event_artists_view')
    .select('*')
    .eq('artist_slug', slug);

  const linkedEventsRaw = artistLinks || [];
  const linkedEventIds = [...new Set(linkedEventsRaw.map((x: any) => x.event_id).filter(Boolean))];

  let events: any[] = [];

  if (linkedEventIds.length > 0) {
    const { data: fetchedEvents } = await supabase
      .from('events')
      .select('*')
      .eq('editorial_status', 'published')
      .in('id', linkedEventIds)
      .order('start_time', { ascending: true });

    events = dedupeById(fetchedEvents || []);
  }

  if (!artist && events.length === 0) return notFound();

  const upcomingEvents = events.filter(isUpcomingEvent);
  const pastEvents = events.filter((event: any) => !isUpcomingEvent(event));

  const uniqueLocalities = [...new Set(events.map((e: any) => e?.locality).filter(Boolean))]
    .slice(0, 8)
    .map((name: string) => ({ slug: name, name }));

  const uniqueCategories = [...new Set(events.map((e: any) => e?.category).filter(Boolean))]
    .slice(0, 8)
    .map((name: string) => ({ slug: name, name }));

  const uniqueVenues = [...new Set(events.map((e: any) => e?.venue_name).filter(Boolean))]
    .slice(0, 6)
    .map((name: string) => ({
      slug: String(name).toLowerCase().replace(/\s+/g, '-'),
      name,
    }));

  const discoveryLinks = buildArtistDiscoveryLinks({
    categories: uniqueCategories,
    localities: uniqueLocalities,
    venues: uniqueVenues,
  });

  const breadcrumbs = buildArtistBreadcrumbs(artistName);

  const faqItems = buildFaq(artistName, upcomingEvents.length, pastEvents.length);

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

  const personSchema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: artistName,
    description: artistBio,
    image: artistImage,
    url: `https://www.jaipurcircle.com/artists/${slug}`,
  };

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-6 pb-28">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

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
        <img src={artistImage} alt={artistName} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10" />

        <div className="absolute top-5 left-5 flex flex-wrap gap-2">
          <span className="px-3 py-1.5 rounded-full bg-white/15 backdrop-blur text-white text-xs md:text-sm font-medium">
            Artist Profile
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
              {artistName}
            </h1>
            <p className="mt-3 text-sm md:text-base text-white/85 max-w-3xl leading-relaxed">
              {artistBio}
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
                Explore Jaipur Events
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
              About {artistName}
            </h2>
            <p className="text-gray-600 leading-relaxed text-sm md:text-base">
              {artistBio}
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
                <div className="text-xs uppercase tracking-wide text-gray-500">City</div>
                <div className="mt-1 text-lg font-semibold text-gray-900">Jaipur</div>
              </div>
            </div>
          </section>

          {uniqueCategories.length > 0 ? (
            <section className="bg-white rounded-3xl border border-gray-200 p-6 md:p-8">
              <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-4">
                Categories
              </h2>
              <div className="flex flex-wrap gap-2">
                {uniqueCategories.map((category: any) => (
                  <a
                    key={category.slug}
                    href={`/events?category=${encodeURIComponent(category.slug)}`}
                    className="px-3 py-1.5 rounded-full bg-gray-100 text-sm text-gray-700 hover:bg-gray-200 transition"
                  >
                    {String(category.name).replace(/-/g, ' ')}
                  </a>
                ))}
              </div>
            </section>
          ) : null}

          {uniqueLocalities.length > 0 ? (
            <section className="bg-white rounded-3xl border border-gray-200 p-6 md:p-8">
              <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-4">
                Event localities
              </h2>
              <div className="flex flex-wrap gap-2">
                {uniqueLocalities.map((locality: any) => (
                  <a
                    key={locality.slug}
                    href={`/jaipur/${locality.slug}`}
                    className="px-3 py-1.5 rounded-full bg-gray-100 text-sm text-gray-700 hover:bg-gray-200 transition"
                  >
                    {String(locality.name).replace(/-/g, ' ')}
                  </a>
                ))}
              </div>
            </section>
          ) : null}

          <section className="bg-white rounded-3xl border border-gray-200 p-6 md:p-8">
            <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-4">
              Artist FAQs
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
              Artist overview
            </h2>

            <div className="space-y-4 text-sm">
              <div>
                <div className="text-xs uppercase tracking-wide text-gray-500">Name</div>
                <div className="mt-1 text-gray-800">{artistName}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-gray-500">Upcoming Events</div>
                <div className="mt-1 text-gray-800">{upcomingEvents.length}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-gray-500">Past Events</div>
                <div className="mt-1 text-gray-800">{pastEvents.length}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-gray-500">Coverage</div>
                <div className="mt-1 text-gray-800">JaipurCircle artist graph</div>
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
          Upcoming events featuring {artistName}
        </h2>

        {upcomingEvents.length === 0 ? (
          <div className="rounded-3xl border border-gray-200 bg-white p-6 md:p-8">
            <h3 className="text-lg font-semibold text-gray-900">No upcoming events listed yet</h3>
            <p className="mt-2 text-gray-600 leading-relaxed">
              This artist profile remains live on JaipurCircle. Explore all Jaipur events to discover related performances and upcoming local experiences.
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
