import { createServerSupabaseClient } from '@/lib/supabase';
import EventCard from '@/components/EventCard';
import { resolveCategorySlug, resolveLocalitySlug } from '@/lib/resolve-slugs';

type SearchParams = Promise<{
  search?: string;
  q?: string;
  locality?: string;
  category?: string;
}>;

export const metadata = {
  title: 'Events in Jaipur - Discover Upcoming Events, Shows & Experiences',
  description:
    'Browse upcoming events in Jaipur including comedy shows, music events, workshops, nightlife and local experiences.',
};

function isPublishedOrLegacyLive(event: any) {
  return !event?.editorial_status || event.editorial_status === 'published';
}

function resolveEventStatus(event: any) {
  if (event?.status) return event.status;

  const startValue = event?.start_time || event?.start_date;
  if (!startValue) return 'upcoming';

  const now = new Date();
  const start = new Date(startValue);

  if (Number.isNaN(start.getTime())) return 'upcoming';
  return start.getTime() < now.getTime() ? 'past' : 'upcoming';
}

export default async function EventsHubPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const supabase = createServerSupabaseClient();
  const sp = (await searchParams) || {};

  const searchQuery = (sp.search || sp.q || '').trim();
  const incomingCategory = (sp.category || '').trim();
  const incomingLocality = (sp.locality || '').trim();

  let resolvedCategory: any = null;
  let resolvedLocality: any = null;

  if (incomingCategory) {
    const categoryResult = await resolveCategorySlug(supabase, incomingCategory);
    resolvedCategory = categoryResult.category;
  }

  if (incomingLocality) {
    const localityResult = await resolveLocalitySlug(supabase, incomingLocality);
    resolvedLocality = localityResult.locality;
  }

  const { data: allCategories } = await supabase
    .from('categories')
    .select('*')
    .eq('is_indexable', true)
    .order('name', { ascending: true });

  const { data: topLocalities } = await supabase
    .from('localities')
    .select('*')
    .eq('is_indexable', true)
    .order('quality_score', { ascending: false })
    .limit(10);

  let eventIdsByCategory: string[] | null = null;

  if (resolvedCategory) {
    const { data: eventLinks } = await supabase
      .from('event_categories')
      .select('event_id')
      .eq('category_id', resolvedCategory.id);

    eventIdsByCategory = (eventLinks || []).map((x: any) => x.event_id);

    if (eventIdsByCategory.length === 0) {
      eventIdsByCategory = [];
    }
  }

  let eventsQuery = supabase
    .from('events')
    .select('*')
    .order('start_time', { ascending: true });

  if (resolvedLocality) {
    eventsQuery = eventsQuery.eq('locality_id', resolvedLocality.id);
  }

  if (eventIdsByCategory) {
    if (eventIdsByCategory.length === 0) {
      const events: any[] = [];
      const itemListSchema = {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        itemListElement: [] as any[],
      };

      return (
        <main className="max-w-6xl mx-auto px-4 md:px-6 py-10">
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
          />

          <section className="mb-10">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              Events in Jaipur
            </h1>
            <p className="mt-3 text-gray-600 max-w-3xl leading-relaxed">
              Browse upcoming events in Jaipur across music, comedy, workshops, nightlife and more.
            </p>
          </section>

          <section className="mb-10">
            <form className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <input
                  name="q"
                  defaultValue={searchQuery}
                  placeholder="Search events..."
                  className="md:col-span-2 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-gray-400"
                />

                <input
                  name="category"
                  defaultValue={incomingCategory}
                  placeholder="Category slug"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-gray-400"
                />

                <input
                  name="locality"
                  defaultValue={incomingLocality}
                  placeholder="Locality slug"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-gray-400"
                />
              </div>

              <div className="mt-3">
                <button className="rounded-xl bg-blue-600 px-5 py-3 text-white font-medium hover:bg-blue-700 transition">
                  Search Events
                </button>
              </div>
            </form>
          </section>

          <section className="mb-10">
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <p className="text-gray-700 font-medium">
                No events found for this category filter.
              </p>
              <p className="text-gray-500 mt-2">
                Try another category, remove filters, or explore events by locality below.
              </p>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-xl font-semibold mb-4">Popular Categories</h2>
            <div className="flex flex-wrap gap-3">
              {(allCategories || []).map((category: any) => (
                <a
                  key={category.id}
                  href={`/categories/${category.slug}`}
                  className="px-4 py-2 bg-gray-100 rounded-full text-sm text-gray-700 hover:bg-gray-200 transition"
                >
                  {category.name}
                </a>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Top Localities</h2>
            <div className="flex flex-wrap gap-3">
              {(topLocalities || []).map((locality: any) => (
                <a
                  key={locality.id}
                  href={`/jaipur/${locality.slug}`}
                  className="px-4 py-2 bg-gray-100 rounded-full text-sm text-gray-700 hover:bg-gray-200 transition"
                >
                  {locality.name}
                </a>
              ))}
            </div>
          </section>
        </main>
      );
    }

    eventsQuery = eventsQuery.in('id', eventIdsByCategory);
  }

  if (searchQuery) {
    const safeSearch = searchQuery.replace(/,/g, ' ').trim();
    eventsQuery = eventsQuery.or(
      `title.ilike.%${safeSearch}%,meta_description.ilike.%${safeSearch}%,description.ilike.%${safeSearch}%,short_description.ilike.%${safeSearch}%,venue_name.ilike.%${safeSearch}%,locality.ilike.%${safeSearch}%`
    );
  }

  const { data: rawEvents } = await eventsQuery.limit(24);

  const events = (rawEvents || [])
    .filter(isPublishedOrLegacyLive)
    .sort((a: any, b: any) => {
      const aStatus = resolveEventStatus(a);
      const bStatus = resolveEventStatus(b);

      if (aStatus === 'upcoming' && bStatus !== 'upcoming') return -1;
      if (aStatus !== 'upcoming' && bStatus === 'upcoming') return 1;

      const aDate = new Date(a.start_time || a.start_date || 0).getTime();
      const bDate = new Date(b.start_time || b.start_date || 0).getTime();

      return aDate - bDate;
    });

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: events.map((event: any, index: number) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: event.title,
      url: `https://www.jaipurcircle.com/events/${event.slug}`,
    })),
  };

  const pageTitle =
    resolvedCategory && resolvedLocality
      ? `${resolvedCategory.name} in ${resolvedLocality.name}, Jaipur`
      : resolvedCategory
      ? `${resolvedCategory.name} in Jaipur`
      : resolvedLocality
      ? `Events in ${resolvedLocality.name}, Jaipur`
      : 'Events in Jaipur';

  const pageDescription =
    resolvedCategory && resolvedLocality
      ? `Browse ${resolvedCategory.name.toLowerCase()} in ${resolvedLocality.name}, Jaipur.`
      : resolvedCategory
      ? `Browse ${resolvedCategory.name.toLowerCase()} happening across Jaipur.`
      : resolvedLocality
      ? `Browse upcoming events in ${resolvedLocality.name}, Jaipur.`
      : 'Browse upcoming events in Jaipur across comedy, music, workshops, nightlife and more.';

  return (
    <main className="max-w-6xl mx-auto px-4 md:px-6 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />

      <section className="mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
          {pageTitle}
        </h1>

        <p className="mt-3 text-gray-600 max-w-3xl leading-relaxed">
          {pageDescription}
        </p>
      </section>

      <section className="mb-10">
        <form className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input
              name="q"
              defaultValue={searchQuery}
              placeholder="Search events..."
              className="md:col-span-2 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-gray-400"
            />

            <input
              name="category"
              defaultValue={incomingCategory}
              placeholder="Category slug"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-gray-400"
            />

            <input
              name="locality"
              defaultValue={incomingLocality}
              placeholder="Locality slug"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-gray-400"
            />
          </div>

          <div className="mt-3">
            <button className="rounded-xl bg-blue-600 px-5 py-3 text-white font-medium hover:bg-blue-700 transition">
              Search Events
            </button>
          </div>
        </form>
      </section>

      <section className="mb-10">
        <p className="text-gray-600 leading-relaxed max-w-3xl">
          Jaipur offers a vibrant mix of events including comedy shows, live music,
          workshops, nightlife experiences and cultural festivals. Discover what’s happening
          today, this week, and upcoming across popular localities like Vaishali Nagar,
          C-Scheme, Malviya Nagar, Mansarovar and more.
        </p>
      </section>

      {(resolvedCategory || resolvedLocality) && (
        <section className="mb-8">
          <div className="flex flex-wrap gap-3">
            {resolvedCategory && (
              <a
                href={`/categories/${resolvedCategory.slug}`}
                className="px-4 py-2 bg-gray-100 rounded-full text-sm text-gray-700 hover:bg-gray-200 transition"
              >
                {resolvedCategory.name}
              </a>
            )}

            {resolvedLocality && (
              <a
                href={`/jaipur/${resolvedLocality.slug}`}
                className="px-4 py-2 bg-gray-100 rounded-full text-sm text-gray-700 hover:bg-gray-200 transition"
              >
                {resolvedLocality.name}
              </a>
            )}

            {resolvedCategory && resolvedLocality && (
              <a
                href={`/events-in/${resolvedCategory.slug}/${resolvedLocality.slug}`}
                className="px-4 py-2 bg-gray-100 rounded-full text-sm text-gray-700 hover:bg-gray-200 transition"
              >
                {resolvedCategory.name} in {resolvedLocality.name}
              </a>
            )}

            <a
              href="/events"
              className="px-4 py-2 bg-gray-100 rounded-full text-sm text-gray-700 hover:bg-gray-200 transition"
            >
              Clear filters
            </a>
          </div>
        </section>
      )}

      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">Popular Categories</h2>
        <div className="flex flex-wrap gap-3">
          {(allCategories || []).map((category: any) => (
            <a
              key={category.id}
              href={`/categories/${category.slug}`}
              className="px-4 py-2 bg-gray-100 rounded-full text-sm text-gray-700 hover:bg-gray-200 transition"
            >
              {category.name}
            </a>
          ))}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">Top Localities</h2>
        <div className="flex flex-wrap gap-3">
          {(topLocalities || []).map((locality: any) => (
            <a
              key={locality.id}
              href={`/jaipur/${locality.slug}`}
              className="px-4 py-2 bg-gray-100 rounded-full text-sm text-gray-700 hover:bg-gray-200 transition"
            >
              {locality.name}
            </a>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-6">Upcoming Events</h2>

        {!events || events.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <p className="text-gray-700 font-medium">
              No events found right now for this combination.
            </p>
            <p className="text-gray-500 mt-2">
              Try a different category, locality, or browse all Jaipur events.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event: any) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </section>

      <section className="mt-14">
        <h2 className="text-lg font-semibold mb-4">
          Explore More Events in Jaipur
        </h2>

        <div className="flex flex-wrap gap-3 text-sm">
          <a
            href="/categories/comedy-shows"
            className="px-4 py-2 bg-gray-100 rounded-full text-gray-700 hover:bg-gray-200 transition"
          >
            Comedy Shows
          </a>
          <a
            href="/categories/music-events"
            className="px-4 py-2 bg-gray-100 rounded-full text-gray-700 hover:bg-gray-200 transition"
          >
            Music Events
          </a>
          <a
            href="/categories/workshops"
            className="px-4 py-2 bg-gray-100 rounded-full text-gray-700 hover:bg-gray-200 transition"
          >
            Workshops
          </a>
          <a
            href="/categories/nightlife"
            className="px-4 py-2 bg-gray-100 rounded-full text-gray-700 hover:bg-gray-200 transition"
          >
            Nightlife
          </a>

          <a
            href="/jaipur/vaishali-nagar"
            className="px-4 py-2 bg-gray-100 rounded-full text-gray-700 hover:bg-gray-200 transition"
          >
            Vaishali Nagar Events
          </a>
          <a
            href="/jaipur/c-scheme"
            className="px-4 py-2 bg-gray-100 rounded-full text-gray-700 hover:bg-gray-200 transition"
          >
            C-Scheme Events
          </a>
          <a
            href="/jaipur/malviya-nagar"
            className="px-4 py-2 bg-gray-100 rounded-full text-gray-700 hover:bg-gray-200 transition"
          >
            Malviya Nagar Events
          </a>
        </div>
      </section>
    </main>
  );
}
