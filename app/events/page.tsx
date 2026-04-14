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

function isUpcomingEvent(event: any) {
  const value = event?.start_time || event?.start_date;
  if (!value) return true;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return true;

  return date >= new Date();
}

function isHappeningSoon(event: any) {
  const value = event?.start_time || event?.start_date;
  if (!value) return false;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;

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
    .eq('editorial_status', 'published')
    .order('start_time', { ascending: true });

  if (resolvedLocality) {
    eventsQuery = eventsQuery.eq('locality_id', resolvedLocality.id);
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
          ? `Browse upcoming events in ${resolvedLocality.name}, Jaipur.`
          : 'Browse upcoming events in Jaipur across comedy, music, workshops, nightlife and more.';

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
                Try another category, a different Jaipur locality, or browse all upcoming events.
              </p>
            </div>
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
      `title.ilike.%${safeSearch}%,meta_description.ilike.%${safeSearch}%,description.ilike.%${safeSearch}%,venue_name.ilike.%${safeSearch}%`
    );
  }

  const { data: eventsRaw } = await eventsQuery.limit(36);
  const events = dedupeById(eventsRaw || []);

  const upcomingEvents = events.filter(isUpcomingEvent);
  const pastEvents = events.filter((event: any) => !isUpcomingEvent(event));
  const happeningSoonEvents = upcomingEvents.filter(isHappeningSoon);

  const featuredEvents = upcomingEvents.slice(0, 3);
  const exploreEvents = upcomingEvents.slice(0, 12);

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
      ? `Browse ${resolvedCategory.name.toLowerCase()} in ${resolvedLocality.name}, Jaipur. Discover upcoming events, venues, and local experiences.`
      : resolvedCategory
      ? `Browse ${resolvedCategory.name.toLowerCase()} happening across Jaipur. Discover upcoming events and curated experiences.`
      : resolvedLocality
      ? `Browse upcoming events in ${resolvedLocality.name}, Jaipur.`
      : 'Browse upcoming events in Jaipur across comedy, music, workshops, nightlife and more.';

  const totalVisibleCount = upcomingEvents.length;
  const happeningSoonCount = happeningSoonEvents.length;
  const hasFilters = Boolean(resolvedCategory || resolvedLocality || searchQuery);

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

          <div className="mt-6 flex flex-wrap gap-3 text-sm">
            <div className="rounded-full bg-white/15 px-4 py-2 backdrop-blur">
              {totalVisibleCount} upcoming event{totalVisibleCount === 1 ? '' : 's'}
            </div>
            <div className="rounded-full bg-white/15 px-4 py-2 backdrop-blur">
              {happeningSoonCount} happening in the next 7 days
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

      {hasFilters ? (
        <section className="mt-6">
          <div className="flex flex-wrap gap-3">
            {resolvedCategory ? (
              <a
                href={`/categories/${resolvedCategory.slug}`}
                className="px-4 py-2 bg-gray-100 rounded-full text-sm text-gray-700 hover:bg-gray-200 transition"
              >
                {resolvedCategory.name}
              </a>
            ) : null}

            {resolvedLocality ? (
              <a
                href={`/jaipur/${resolvedLocality.slug}`}
                className="px-4 py-2 bg-gray-100 rounded-full text-sm text-gray-700 hover:bg-gray-200 transition"
              >
                {resolvedLocality.name}
              </a>
            ) : null}

            {resolvedCategory && resolvedLocality ? (
              <a
                href={`/events-in/${resolvedCategory.slug}/${resolvedLocality.slug}`}
                className="px-4 py-2 bg-gray-100 rounded-full text-sm text-gray-700 hover:bg-gray-200 transition"
              >
                {resolvedCategory.name} in {resolvedLocality.name}
              </a>
            ) : null}

            <a
              href="/events"
              className="px-4 py-2 bg-gray-100 rounded-full text-sm text-gray-700 hover:bg-gray-200 transition"
            >
              Clear all filters
            </a>
          </div>
        </section>
      ) : null}

      {featuredEvents.length > 0 ? (
        <section className="mt-10">
          <div className="flex items-end justify-between gap-4 mb-5">
            <div>
              <h2 className="text-2xl md:text-3xl font-semibold text-gray-900">
                Featured Upcoming Events
              </h2>
              <p className="mt-1 text-sm md:text-base text-gray-600">
                Strong picks worth opening first
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {featuredEvents.map((event: any, index: number) => {
              const image =
                event?.cover_image_url ||
                event?.image_url ||
                event?.cover_image ||
                'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1600';

              const dateValue = event?.start_time || event?.start_date;
              const formattedDate = dateValue
                ? new Date(dateValue).toLocaleDateString('en-IN', { dateStyle: 'medium' })
                : 'Date TBA';

              return (
                <a
                  key={event.id}
                  href={`/events/${event.slug}`}
                  className={`group relative overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm hover:shadow-xl transition ${
                    index === 0 ? 'lg:col-span-2 min-h-[360px]' : 'min-h-[280px]'
                  }`}
                >
                  <div
                    className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-105"
                    style={{ backgroundImage: `url('${image}')` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/10" />

                  <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                    {event?.category ? (
                      <span className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium text-white backdrop-blur">
                        {String(event.category).replace(/-/g, ' ')}
                      </span>
                    ) : null}
                    <span className="rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-medium text-white">
                      Upcoming
                    </span>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6 text-white">
                    <div className="text-xs md:text-sm text-white/85">
                      {formattedDate}
                    </div>

                    <h3 className="mt-2 text-xl md:text-2xl font-semibold leading-tight">
                      {event.title}
                    </h3>

                    <p className="mt-2 text-sm text-white/85 line-clamp-2 max-w-2xl">
                      {event?.short_description || event?.meta_description || event?.description}
                    </p>
                  </div>
                </a>
              );
            })}
          </div>
        </section>
      ) : null}

      {happeningSoonEvents.length > 0 ? (
        <section className="mt-12">
          <div className="flex items-end justify-between gap-4 mb-5">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">
                Happening Soon
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Events taking place over the next 7 days
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {happeningSoonEvents.slice(0, 6).map((event: any) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-12">
        <div className="flex items-end justify-between gap-4 mb-5">
          <div>
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-900">
              Explore Jaipur Events
            </h2>
            <p className="mt-1 text-sm md:text-base text-gray-600">
              Curated upcoming events across comedy, music, workshops, lifestyle and more
            </p>
          </div>
        </div>

        {exploreEvents.length === 0 ? (
          <div className="rounded-3xl border border-gray-200 bg-white p-6 md:p-8">
            <h3 className="text-lg font-semibold text-gray-900">
              No upcoming events found
            </h3>
            <p className="mt-2 text-gray-600 leading-relaxed">
              Try a different filter combination or browse Jaipur categories and localities below.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {exploreEvents.map((event: any) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </section>

      {(allCategories || []).length > 0 ? (
        <section className="mt-14">
          <div className="flex items-end justify-between gap-4 mb-5">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">
                Browse by Category
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Jump directly into the event type you care about
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {(allCategories || []).slice(0, 12).map((category: any) => (
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
      ) : null}

      {(topLocalities || []).length > 0 ? (
        <section className="mt-14">
          <div className="flex items-end justify-between gap-4 mb-5">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">
                Explore Events by Locality
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Discover what’s happening across Jaipur’s most active areas
              </p>
            </div>
          </div>

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
      ) : null}

      {pastEvents.length > 0 ? (
        <section className="mt-14">
          <div className="flex items-end justify-between gap-4 mb-5">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">
                Recent Past Events
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Persistent archive pages that continue to support discovery
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {pastEvents.slice(0, 6).map((event: any) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
