import { notFound } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase';
import EventCard from '@/components/EventCard';
import { buildLocalityDiscoveryLinks } from '@/lib/internal-linking';
import { getLocalityBySlug } from '@/lib/getLocality';

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

function buildFaq(localityName: string, upcomingCount: number, venueCount: number) {
  return [
    {
      q: `What can I explore in ${localityName}, Jaipur?`,
      a: `${localityName} is an active Jaipur locality where users can explore upcoming events, venues, and category-driven discovery pages on JaipurCircle.`,
    },
    {
      q: `Are there upcoming events in ${localityName}?`,
      a:
        upcomingCount > 0
          ? `Yes, there are ${upcomingCount} upcoming event${upcomingCount === 1 ? '' : 's'} currently listed in ${localityName}.`
          : `There are currently no upcoming events listed in ${localityName}.`,
    },
    {
      q: `Can I discover venues in ${localityName}?`,
      a:
        venueCount > 0
          ? `Yes, JaipurCircle also connects venues and event pages related to ${localityName}.`
          : `Venue discovery for ${localityName} will expand as more event data is added.`,
    },
    {
      q: `Where can I browse more Jaipur events?`,
      a: `You can browse all Jaipur events, category pages, hybrid pages, artist profiles, and venue pages on JaipurCircle.`,
    },
  ];
}

export async function generateMetadata(props: any) {
  const params = await props.params;
  const slug = params?.slug;

  if (!slug) return {};

  const locality = await getLocalityBySlug(slug);

  const localityName = locality?.name || slug;

  return {
    title: `Things to do in ${localityName}, Jaipur`,
    description: `Discover events, venues, and local experiences in ${localityName}, Jaipur.`,
  };
}

export default async function LocalityPage(props: any) {
  const supabase = createServerSupabaseClient();
  const params = await props.params;
  const slug = params?.slug;

  if (!slug) return notFound();

  const locality = await getLocalityBySlug(slug);

  if (!locality) return notFound();

  const eventsQuery = supabase
    .from('events')
    .select('*')
    .eq('locality_slug', slug)
    .or('editorial_status.eq.published,status.eq.upcoming,status.eq.ongoing')
    .order('start_time', { ascending: true });

  const { data: eventsRaw } = await eventsQuery;
  const events = dedupeById(eventsRaw || []);

  const upcomingEvents = events.filter(isUpcomingEvent);
  const pastEvents = events.filter((event: any) => !isUpcomingEvent(event));

  const uniqueCategories = [...new Set(events.map((e: any) => e?.category).filter(Boolean))]
    .slice(0, 10)
    .map((name: string) => ({ slug: name, name }));

  const uniqueVenues = [...new Set(events.map((e: any) => e?.venue_name).filter(Boolean))]
    .slice(0, 8)
    .map((name: string) => ({
      slug: String(name).toLowerCase().replace(/\s+/g, '-'),
      name,
    }));

  const discoveryLinks = buildLocalityDiscoveryLinks({
    locality: { slug: locality.slug, name: locality.name },
    categories: uniqueCategories,
    venues: uniqueVenues,
  });

  const faqItems = buildFaq(locality.name, upcomingEvents.length, uniqueVenues.length);

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
    name: `${locality.name}, Jaipur`,
    description: `Discover events, venues, and local experiences in ${locality.name}, Jaipur.`,
    url: `https://www.jaipurcircle.com/jaipur/${locality.slug}`,
  };

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-6 pb-28">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(placeSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <nav className="mt-6 text-sm text-gray-500">
        <a href="/" className="hover:text-gray-800 transition">Home</a> <span className="mx-2">›</span>
        <a href="/events" className="hover:text-gray-800 transition">Events</a> <span className="mx-2">›</span>
        <span className="text-gray-800">{locality.name}</span>
      </nav>

      <section className="relative h-[320px] md:h-[420px] rounded-3xl overflow-hidden mt-4 bg-gradient-to-br from-fuchsia-600 via-purple-600 to-indigo-700 text-white">
        <div className="absolute inset-0 bg-black/15" />
        <div className="absolute top-5 left-5 flex flex-wrap gap-2">
          <span className="px-3 py-1.5 rounded-full bg-white/15 backdrop-blur text-white text-xs md:text-sm font-medium">
            Locality Hub
          </span>
          <span className="px-3 py-1.5 rounded-full bg-emerald-500 text-white text-xs md:text-sm font-medium">
            {upcomingEvents.length} Upcoming
          </span>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-5 md:p-8">
          <div className="max-w-4xl">
            <h1 className="text-3xl md:text-5xl font-bold leading-tight tracking-tight">
              Things to do in {locality.name}, Jaipur
            </h1>
            <p className="mt-3 text-sm md:text-base text-white/85 max-w-3xl leading-relaxed">
              Explore upcoming events, venues, and category-based discovery in {locality.name}. JaipurCircle helps you find what’s happening now and what to explore next.
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
                Browse All Jaipur Events
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
              About {locality.name}
            </h2>
            <p className="text-gray-600 leading-relaxed text-sm md:text-base">
              {locality.name} is one of Jaipur’s active local discovery zones, connecting users to nearby events, venues, and category-specific event surfaces. This page is designed to help people explore what’s happening locally while staying connected to the broader Jaipur event graph.
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
                <div className="text-xs uppercase tracking-wide text-gray-500">Active Venues</div>
                <div className="mt-1 text-lg font-semibold text-gray-900">{uniqueVenues.length}</div>
              </div>
            </div>
          </section>

          {uniqueCategories.length > 0 ? (
            <section className="bg-white rounded-3xl border border-gray-200 p-6 md:p-8">
              <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-4">
                Explore by category
              </h2>
              <div className="flex flex-wrap gap-2">
                {uniqueCategories.map((category: any) => (
                  <a
                    key={category.slug}
                    href={`/events-in/${category.slug}/${locality.slug}`}
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
              Locality FAQs
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
              Locality overview
            </h2>
            <div className="space-y-4 text-sm">
              <div>
                <div className="text-xs uppercase tracking-wide text-gray-500">Locality</div>
                <div className="mt-1 text-gray-800">{locality.name}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-gray-500">Upcoming Events</div>
                <div className="mt-1 text-gray-800">{upcomingEvents.length}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-gray-500">Venues</div>
                <div className="mt-1 text-gray-800">{uniqueVenues.length}</div>
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
          Upcoming events in {locality.name}
        </h2>

        {upcomingEvents.length > 0 ? (
          <ul className="mb-5 list-disc pl-5 text-sm text-gray-700">
            {upcomingEvents.slice(0, 10).map((event: any) => (
              <li key={`title-${event.id}`}>{event.title}</li>
            ))}
          </ul>
        ) : null}

        {upcomingEvents.length === 0 ? (
          <div className="rounded-3xl border border-gray-200 bg-white p-6 md:p-8">
            <h3 className="text-lg font-semibold text-gray-900">No upcoming events listed yet</h3>
            <p className="mt-2 text-gray-600 leading-relaxed">
              This locality page remains live as part of JaipurCircle’s discovery graph.
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
            Past event archive
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
