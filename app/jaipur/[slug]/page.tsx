import { notFound, redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase';
import EventCard from '@/components/EventCard';
import { buildLocalityDiscoveryLinks } from '@/lib/internal-linking';
import { resolveLocalitySlug } from '@/lib/resolve-slugs';

function parseEventDate(event: any) {
  const value = event?.start_time || event?.start_date;
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return date;
}

function isUpcomingEvent(event: any) {
  const date = parseEventDate(event);
  if (!date) return false;
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

function sortEvents(items: any[]) {
  const now = new Date();

  return [...(items || [])].sort((a: any, b: any) => {
    const aDate = parseEventDate(a);
    const bDate = parseEventDate(b);

    if (!aDate && !bDate) return 0;
    if (!aDate) return 1;
    if (!bDate) return -1;

    const aUpcoming = aDate >= now;
    const bUpcoming = bDate >= now;

    if (aUpcoming && !bUpcoming) return -1;
    if (!aUpcoming && bUpcoming) return 1;

    if (aUpcoming && bUpcoming) return aDate.getTime() - bDate.getTime();
    return bDate.getTime() - aDate.getTime();
  });
}

function buildFaq(localityName: string, upcomingCount: number, venueCount: number) {
  return [
    {
      q: `What can I explore in ${localityName}, Jaipur?`,
      a: `${localityName} is a Jaipur locality page on JaipurCircle where you can discover events, category pages, venues, and locality-based exploration links.`,
    },
    {
      q: `Are there upcoming events in ${localityName}?`,
      a:
        upcomingCount > 0
          ? `Yes, there are currently ${upcomingCount} upcoming event${upcomingCount === 1 ? '' : 's'} listed for ${localityName}.`
          : `There are currently no upcoming events listed for ${localityName}.`,
    },
    {
      q: `Can I browse categories inside ${localityName}?`,
      a: `Yes. JaipurCircle supports locality category pages like restaurants, shopping, events, guides, health, and more for many Jaipur localities.`,
    },
    {
      q: `Can I explore nearby Jaipur localities too?`,
      a: `Yes. JaipurCircle is structured to connect localities, events, venues, and category pages across Jaipur.`,
    },
  ];
}

export async function generateMetadata(props: any) {
  const params = await props.params;
  const slug = params?.slug;

  if (!slug) return {};

  const supabase = createServerSupabaseClient();
  const localityResult = await resolveLocalitySlug(supabase, slug);
  const locality = localityResult?.locality;

  if (!locality) {
    return {
      title: 'Jaipur Locality',
      description: 'Explore Jaipur localities, events, and discovery pages.',
    };
  }

  return {
    title: `Things to do in ${locality.name}, Jaipur`,
    description: `Discover events, venues, and local category pages in ${locality.name}, Jaipur.`,
  };
}

export default async function LocalityPage(props: any) {
  const supabase = createServerSupabaseClient();
  const params = await props.params;
  const incomingSlug = params?.slug;

  if (!incomingSlug) return notFound();

  const localityResult = await resolveLocalitySlug(supabase, incomingSlug);
  const locality = localityResult?.locality;

  if (!locality) return notFound();

  if (localityResult.wasAlias && localityResult.canonicalSlug && localityResult.canonicalSlug !== incomingSlug) {
    redirect(`/jaipur/${localityResult.canonicalSlug}`);
  }

  let eventsQuery = supabase
    .from('events')
    .select('*')
    .eq('editorial_status', 'published');

  if (locality.id) {
    eventsQuery = eventsQuery.or(`locality_id.eq.${locality.id},locality.eq.${locality.slug}`);
  } else {
    eventsQuery = eventsQuery.eq('locality', locality.slug);
  }

  const { data: eventsRaw } = await eventsQuery.limit(120);

  const events = sortEvents(dedupeById(eventsRaw || []));
  const upcomingEvents = events.filter(isUpcomingEvent);
  const pastEvents = events.filter((event: any) => !isUpcomingEvent(event));

  const { data: localityCategoryPages } = await supabase
    .from('locality_category_pages')
    .select(`
      id,
      canonical_url,
      title,
      category_id,
      categories (
        id,
        name,
        slug
      )
    `)
    .eq('locality_id', locality.id)
    .eq('status', 'published')
    .eq('is_indexable', true)
    .order('created_at', { ascending: true });

  const categoryLinks: { slug: string; name: string }[] = (localityCategoryPages || [])
    .map((row: any) => {
      const cat = Array.isArray(row.categories) ? row.categories[0] : row.categories;
      if (!cat?.slug) return null;
      return {
        slug: String(cat.slug),
        name: String(cat.name || cat.slug),
      };
    })
    .filter((item): item is { slug: string; name: string } => item !== null);

  const uniqueVenues = [...new Set(events.map((e: any) => e?.venue_name).filter(Boolean))]
    .slice(0, 8)
    .map((name: string) => ({
      slug: String(name).toLowerCase().replace(/\s+/g, '-'),
      name,
    }));

  const discoveryLinks = buildLocalityDiscoveryLinks({
    locality: { slug: locality.slug, name: locality.name },
    categories: categoryLinks,
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
    description: `Discover events, venues, and local category pages in ${locality.name}, Jaipur.`,
    url: `https://www.jaipurcircle.com/jaipur/${locality.slug}`,
  };

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-6 pb-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(placeSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <nav className="mt-6 text-sm text-gray-500">
        <a href="/" className="hover:text-gray-800 transition">Home</a>
        <span className="mx-2">›</span>
        <a href="/jaipur" className="hover:text-gray-800 transition">Jaipur</a>
        <span className="mx-2">›</span>
        <span className="text-gray-800">{locality.name}</span>
      </nav>

      <section className="relative h-[320px] md:h-[420px] rounded-3xl overflow-hidden mt-4 bg-gradient-to-br from-fuchsia-600 via-purple-600 to-indigo-700 text-white">
        <div className="absolute inset-0 bg-black/15" />
        <div className="absolute top-5 left-5 flex flex-wrap gap-2">
          <span className="px-3 py-1.5 rounded-full bg-white/15 backdrop-blur text-white text-xs md:text-sm font-medium">
            Jaipur Locality Hub
          </span>
          <span className="px-3 py-1.5 rounded-full bg-emerald-500 text-white text-xs md:text-sm font-medium">
            {upcomingEvents.length} Upcoming
          </span>
          <span className="px-3 py-1.5 rounded-full bg-white/15 backdrop-blur text-white text-xs md:text-sm font-medium">
            {events.length} Published Events
          </span>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-5 md:p-8">
          <div className="max-w-4xl">
            <h1 className="text-3xl md:text-5xl font-bold leading-tight tracking-tight">
              Things to do in {locality.name}, Jaipur
            </h1>
            <p className="mt-3 text-sm md:text-base text-white/85 max-w-3xl leading-relaxed">
              Explore events, venues, and locality-based discovery in {locality.name}. JaipurCircle connects this locality to category pages, event detail pages, and the wider Jaipur discovery graph.
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

      {discoveryLinks.length > 0 ? (
        <section className="mt-6 flex flex-wrap gap-3 text-sm">
          {discoveryLinks.slice(0, 18).map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="px-4 py-2 bg-gray-100 rounded-full text-gray-700 hover:bg-gray-200 transition"
            >
              {link.label}
            </a>
          ))}
        </section>
      ) : null}

      <section className="mt-8 grid grid-cols-1 lg:grid-cols-[1.55fr_0.9fr] gap-8">
        <div className="space-y-8">
          <section className="bg-white rounded-3xl border border-gray-200 p-6 md:p-8">
            <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-4">
              About {locality.name}
            </h2>
            <p className="text-gray-600 leading-relaxed text-sm md:text-base">
              {locality.description ||
                `${locality.name} is a Jaipur locality page on JaipurCircle, designed to connect local event discovery, venues, category pages, and structured neighborhood exploration.`}
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
                <div className="text-xs uppercase tracking-wide text-gray-500">Known Venues</div>
                <div className="mt-1 text-lg font-semibold text-gray-900">{uniqueVenues.length}</div>
              </div>
            </div>
          </section>

          {categoryLinks.length > 0 ? (
            <section className="bg-white rounded-3xl border border-gray-200 p-6 md:p-8">
              <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-4">
                Explore {locality.name} by Category
              </h2>

              <div className="flex flex-wrap gap-3">
                {categoryLinks.map((category: any) => (
                  <a
                    key={category.slug}
                    href={`/jaipur/${locality.slug}/${category.slug}`}
                    className="px-4 py-2 bg-gray-100 rounded-full text-gray-700 hover:bg-gray-200 transition text-sm"
                  >
                    {category.name}
                  </a>
                ))}
              </div>
            </section>
          ) : null}

          <section id="upcoming-events" className="bg-white rounded-3xl border border-gray-200 p-6 md:p-8">
            <div className="flex items-center justify-between gap-4 mb-5">
              <h2 className="text-xl md:text-2xl font-semibold text-gray-900">
                Upcoming Events in {locality.name}
              </h2>
              <a href="/events" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                View all Jaipur events
              </a>
            </div>

            {upcomingEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {upcomingEvents.slice(0, 9).map((event: any) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-sm text-gray-600">
                No upcoming events are currently listed for {locality.name}. Browse all Jaipur events for more discovery.
              </div>
            )}
          </section>

          {pastEvents.length > 0 ? (
            <section className="bg-white rounded-3xl border border-gray-200 p-6 md:p-8">
              <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-5">
                Previously Listed in {locality.name}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {pastEvents.slice(0, 6).map((event: any) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <aside className="space-y-6">
          <section className="bg-white rounded-3xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900">Quick Explore</h3>
            <div className="mt-4 flex flex-col gap-3">
              <a href={`/events?locality=${locality.slug}`} className="text-sm text-blue-600 hover:text-blue-700">
                Events in {locality.name}
              </a>
              <a href="/events" className="text-sm text-blue-600 hover:text-blue-700">
                All Jaipur Events
              </a>
              <a href="/jaipur" className="text-sm text-blue-600 hover:text-blue-700">
                Browse Jaipur Localities
              </a>
            </div>
          </section>

          <section className="bg-white rounded-3xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900">FAQ</h3>
            <div className="mt-4 space-y-4">
              {faqItems.map((item) => (
                <div key={item.q}>
                  <h4 className="text-sm font-semibold text-gray-900">{item.q}</h4>
                  <p className="mt-1 text-sm text-gray-600 leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
}
