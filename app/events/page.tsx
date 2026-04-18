import { createServerSupabaseClient } from '@/lib/supabase';
import EventCard from '@/components/EventCard';
import EventsList from '@/components/EventsList';
import { resolveCategorySlug, resolveLocalitySlug } from '@/lib/resolve-slugs';

type SearchParams = Promise<{
  search?: string;
  q?: string;
  locality?: string;
  category?: string;
}>;

export const metadata = {
  title: 'Events in Jaipur - Discover Published Events, Shows & Experiences',
  description:
    'Browse published events in Jaipur including comedy shows, music events, workshops, nightlife and local experiences.',
};

function parseEventDate(event: any) {
  const value = event?.start_time || event?.start_date;
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isUpcomingEvent(event: any) {
  const date = parseEventDate(event);
  if (!date) return false;
  return date >= new Date();
}

function isHappeningSoon(event: any) {
  const date = parseEventDate(event);
  if (!date) return false;

  const now = new Date();
  const soon = new Date();
  soon.setDate(now.getDate() + 7);

  return date >= now && date <= soon;
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

function sortPublishedEvents(items: any[]) {
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

    if (aUpcoming && bUpcoming) {
      return aDate.getTime() - bDate.getTime();
    }

    return bDate.getTime() - aDate.getTime();
  });
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
    .limit(12);

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
    .eq('editorial_status', 'published');

  if (resolvedLocality) {
    if (resolvedLocality.id) {
      eventsQuery = eventsQuery.eq('locality_id', resolvedLocality.id);
    } else if (resolvedLocality.slug) {
      eventsQuery = eventsQuery.eq('locality', resolvedLocality.slug);
    }
  }

  if (eventIdsByCategory) {
    if (eventIdsByCategory.length === 0) {
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
              ? `Browse published events in ${resolvedLocality.name}, Jaipur.`
              : 'Browse published events in Jaipur across comedy, music, workshops, nightlife and more.';

      return (
        <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-10">
          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-fuchsia-600 via-purple-600 to-indigo-700 text-white p-6 md:p-10">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm backdrop-blur">
                <span>📅</span>
                <span>Jaipur Events</span>
              </div>

              <h1 className="mt-5 text-3xl md:text-5xl font-bold tracking-tight">
                {pageTitle}
              </h1>

              <p className="mt-4 text-sm md:text-base text-white/90 leading-relaxed max-w-2xl">
                {pageDescription}
              </p>
            </div>
          </section>

          <section className="mt-8">
            <form className="rounded-3xl border border-gray-200 bg-white p-4 md:p-5 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <input
                  name="q"
                  defaultValue={searchQuery}
                  placeholder="Search events, performers, venues..."
                  className="md:col-span-2 w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-gray-400"
                />

                <input
                  name="category"
                  defaultValue={incomingCategory}
                  placeholder="Category slug"
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-gray-400"
                />

                <input
                  name="locality"
                  defaultValue={incomingLocality}
                  placeholder="Locality slug"
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-gray-400"
                />
              </div>

              <div className="mt-3 flex flex-wrap gap-3">
                <button className="rounded-2xl bg-blue-600 px-5 py-3 text-white font-medium hover:bg-blue-700 transition">
                  Search Events
                </button>

                <a
                  href="/events"
                  className="rounded-2xl border border-gray-200 px-5 py-3 text-gray-700 font-medium hover:bg-gray-50 transition"
                >
                  Clear Filters
                </a>
              </div>
            </form>
          </section>

          <section className="mt-8">
            <div className="rounded-3xl border border-gray-200 bg-white p-6 md:p-8">
              <h2 className="text-xl font-semibold text-gray-900">
                No events found for this filter
              </h2>
              <p className="mt-2 text-gray-600 leading-relaxed">
                Try another category, a different Jaipur locality, or browse all published events.
              </p>
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
      `title.ilike.%${safeSearch}%,meta_description.ilike.%${safeSearch}%,description.ilike.%${safeSearch}%,venue_name.ilike.%${safeSearch}%`
    );
  }

  const { data: eventsRaw } = await eventsQuery.limit(36);
  const events = sortPublishedEvents(dedupeById(eventsRaw || []));

  const upcomingEvents = events.filter(isUpcomingEvent);
  const pastEvents = events.filter((event: any) => !isUpcomingEvent(event));
  const happeningSoonEvents = upcomingEvents.filter(isHappeningSoon);

  const featuredEvents = upcomingEvents.slice(0, 3);
  const exploreEvents = events.slice(0, 12);

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
      ? `Browse ${resolvedCategory.name.toLowerCase()} in ${resolvedLocality.name}, Jaipur. Discover upcoming and past published events, venues, and local experiences.`
      : resolvedCategory
        ? `Browse ${resolvedCategory.name.toLowerCase()} happening across Jaipur. Discover published events and curated experiences.`
        : resolvedLocality
          ? `Browse published events in ${resolvedLocality.name}, Jaipur.`
          : 'Browse published events in Jaipur across comedy, music, workshops, nightlife and more.';

  const totalVisibleCount = events.length;
  const happeningSoonCount = happeningSoonEvents.length;
  const hasFilters = Boolean(resolvedCategory || resolvedLocality || searchQuery);

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-10">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-fuchsia-600 via-purple-600 to-indigo-700 text-white p-6 md:p-10">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm backdrop-blur">
            <span>📅</span>
            <span>Jaipur Event Discovery</span>
          </div>

          <h1 className="mt-5 text-3xl md:text-5xl font-bold tracking-tight">
            {pageTitle}
          </h1>

          <p className="mt-4 text-sm md:text-base text-white/90 leading-relaxed max-w-2xl">
            {pageDescription}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
              <div className="text-2xl font-bold">{totalVisibleCount}</div>
              <div className="text-sm text-white/80">Published events</div>
            </div>

            <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
              <div className="text-2xl font-bold">{upcomingEvents.length}</div>
              <div className="text-sm text-white/80">Upcoming</div>
            </div>

            <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
              <div className="text-2xl font-bold">{happeningSoonCount}</div>
              <div className="text-sm text-white/80">Happening in 7 days</div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8">
        <form className="rounded-3xl border border-gray-200 bg-white p-4 md:p-5 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input
              name="q"
              defaultValue={searchQuery}
              placeholder="Search events, performers, venues..."
              className="md:col-span-2 w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-gray-400"
            />

            <input
              name="category"
              defaultValue={incomingCategory}
              placeholder="Category slug"
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-gray-400"
            />

            <input
              name="locality"
              defaultValue={incomingLocality}
              placeholder="Locality slug"
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-gray-400"
            />
          </div>

          <div className="mt-3 flex flex-wrap gap-3">
            <button className="rounded-2xl bg-blue-600 px-5 py-3 text-white font-medium hover:bg-blue-700 transition">
              Search Events
            </button>

            <a
              href="/events"
              className="rounded-2xl border border-gray-200 px-5 py-3 text-gray-700 font-medium hover:bg-gray-50 transition"
            >
              Clear Filters
            </a>
          </div>
        </form>
      </section>

      {!hasFilters && featuredEvents.length > 0 ? (
        <section className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Happening Soon</h2>
            <span className="text-sm text-gray-500">Published and upcoming in Jaipur</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {featuredEvents.map((event: any) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">
            {hasFilters ? 'Filtered Events' : 'All Published Events in Jaipur'}
          </h2>
          <span className="text-sm text-gray-500">
            {upcomingEvents.length} upcoming • {pastEvents.length} past
          </span>
        </div>

        {exploreEvents.length > 0 ? (
          <EventsList
            initialEvents={exploreEvents}
            query={searchQuery}
            category={resolvedCategory?.slug || incomingCategory || ''}
            locality={resolvedLocality?.slug || incomingLocality || ''}
          />
        ) : (
          <div className="rounded-3xl border border-gray-200 bg-white p-6 md:p-8">
            <h3 className="text-xl font-semibold text-gray-900">
              No events found
            </h3>
            <p className="mt-2 text-gray-600 leading-relaxed">
              Try another category, locality, or search term.
            </p>
          </div>
        )}
      </section>

      <section className="mt-10">
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

      <section className="mt-10">
        <h2 className="text-xl font-semibold mb-4">Top Localities</h2>
        <div className="flex flex-wrap gap-3">
          {(topLocalities || []).map((locality: any) => (
            <a
              key={locality.id}
              href={`/events/in/${locality.slug}`}
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
