import { createServerSupabaseClient } from '@/lib/supabase';
import EventCard from '@/components/EventCard';
import LocalitySelector from '@/components/LocalitySelector';

const categoryItems = [
  { name: 'Comedy', slug: 'comedy-shows', emoji: '🎭' },
  { name: 'Music', slug: 'music-events', emoji: '🎵' },
  { name: 'Workshops', slug: 'workshops', emoji: '🛠️' },
  { name: 'Nightlife', slug: 'nightlife', emoji: '🌃' },
  { name: 'Food', slug: 'food-festivals', emoji: '🍽️' },
  { name: 'Art & Culture', slug: 'art-culture', emoji: '🎨' },
];

export const metadata = {
  title: 'Jaipur Events, Shows, Workshops & Experiences | JaipurCircle',
  description:
    'Discover upcoming events in Jaipur including comedy shows, music events, workshops, nightlife, family experiences and local happenings across the city.',
};

function isUpcomingEvent(event: any) {
  const value = event?.start_time || event?.start_date;
  if (!value) return true;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return true;

  return date >= new Date();
}

function isWithinDays(event: any, days: number) {
  const value = event?.start_time || event?.start_date;
  if (!value) return false;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;

  const now = new Date();
  const boundary = new Date();
  boundary.setDate(now.getDate() + days);

  return date >= now && date <= boundary;
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

export default async function HomePage({
  searchParams,
}: {
  searchParams?: Promise<{ locality?: string }>;
}) {
  const supabase = createServerSupabaseClient();
  const sp = (await searchParams) || {};
  const selectedLocality = sp.locality || 'jaipur';
  let selectedLocalityLabel = 'Jaipur';

  let baseEventsQuery = supabase
    .from('events')
    .select('*')
    .eq('editorial_status', 'published')
    .order('start_time', { ascending: true });

  if (selectedLocality !== 'jaipur') {
    const { data: localityRow } = await supabase
      .from('localities')
      .select('id,name')
      .eq('slug', selectedLocality)
      .maybeSingle();

    if (localityRow?.name) {
      selectedLocalityLabel = localityRow.name;
    }

    if (localityRow?.id) {
      baseEventsQuery = baseEventsQuery.eq('locality_id', localityRow.id);
    } else {
      baseEventsQuery = baseEventsQuery.eq('locality_slug', selectedLocality);
    }
  }

  const { data: allEventsRaw } = await baseEventsQuery.limit(40);
  const allEvents = dedupeById(allEventsRaw || []);

  const upcomingEvents = allEvents.filter(isUpcomingEvent);
  const happeningSoonEvents = upcomingEvents.filter((event: any) => isWithinDays(event, 7));
  const weekendWindowEvents = upcomingEvents.filter((event: any) => isWithinDays(event, 14));

  const featuredEvents = upcomingEvents.slice(0, 3);
  const trendingEvents = upcomingEvents.slice(3, 9);
  const latestEvents = upcomingEvents.slice(0, 12);

  const featuredHero =
    featuredEvents[0]?.cover_image_url ||
    featuredEvents[0]?.image_url ||
    featuredEvents[0]?.cover_image ||
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1600';

  const { data: topLocalities } = await supabase
    .from('localities')
    .select('id,name,slug')
    .order('name', { ascending: true })
    .limit(8);

  const discoveryStats = [
    {
      label: 'Upcoming events',
      value: upcomingEvents.length,
    },
    {
      label: 'Happening in 7 days',
      value: happeningSoonEvents.length,
    },
    {
      label: 'Popular categories',
      value: categoryItems.length,
    },
  ];

  return (
    <main className="pb-28">
      <section className="relative overflow-hidden bg-gradient-to-br from-fuchsia-600 via-purple-600 to-indigo-700 text-white">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url('${featuredHero}')` }}
        />
        <div className="absolute inset-0 bg-black/20" />

        <div className="relative max-w-7xl mx-auto px-4 md:px-6 pt-10 md:pt-20 pb-24 md:pb-28">
          <div className="md:hidden mb-5">
            <LocalitySelector selectedLocality={selectedLocality} />
          </div>

          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 px-4 py-2 rounded-full text-sm shadow-sm">
            <span>📅</span>
            <span>Jaipur Event Discovery</span>
          </div>

          <h1 className="mt-6 text-4xl md:text-6xl font-bold leading-tight tracking-tight max-w-4xl">
            Discover {selectedLocalityLabel} Events, Shows & Experiences
          </h1>

          <p className="mt-4 text-sm md:text-lg text-white/90 max-w-3xl leading-relaxed">
            Explore upcoming events in {selectedLocalityLabel} across comedy, music, workshops,
            nightlife, family experiences and local culture. JaipurCircle helps you discover what’s happening,
            where it’s happening, and what to attend next.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#featured"
              className="inline-flex items-center gap-2 bg-white text-gray-900 px-6 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition"
            >
              <span>Explore Events</span>
              <span>→</span>
            </a>

            <a
              href="/events"
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 px-6 py-3 rounded-full font-medium text-white hover:bg-white/15 transition"
            >
              Browse All Events
            </a>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            {discoveryStats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 px-4 py-3"
              >
                <div className="text-xl md:text-2xl font-bold">{stat.value}</div>
                <div className="text-xs md:text-sm text-white/80">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 md:px-6 -mt-12 relative z-10">
        <form action="/events" className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl shadow-black/10 border border-white/60 p-3 md:p-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            <div className="flex items-center gap-3 flex-1 rounded-xl bg-white px-2">
              <div className="text-gray-400 text-lg pl-2">🔎</div>
              <input
                name="q"
                placeholder="Search events, performers, venues, localities..."
                className="w-full outline-none text-sm md:text-base bg-transparent py-3"
              />
            </div>

            <input type="hidden" name="locality" value={selectedLocality !== 'jaipur' ? selectedLocality : ''} />

            <div className="shrink-0 rounded-xl bg-gray-100 px-4 py-3 text-sm text-gray-700">
              📍 {selectedLocalityLabel}
            </div>

            <button className="shrink-0 rounded-xl bg-blue-600 px-5 py-3 text-sm md:text-base font-semibold text-white hover:bg-blue-700 transition">
              Search
            </button>
          </div>
        </form>
      </div>

      {happeningSoonEvents.length > 0 ? (
        <section className="max-w-7xl mx-auto px-4 md:px-6 mt-10">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4 md:p-6">
            <div className="flex items-end justify-between gap-4 mb-4">
              <div>
                <h2 className="text-xl md:text-2xl font-semibold text-gray-900">
                  Happening Soon
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  Upcoming events over the next 7 days in {selectedLocalityLabel}
                </p>
              </div>
              <a href="/events" className="text-sm text-blue-600 hover:underline">
                View all
              </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {happeningSoonEvents.slice(0, 6).map((event: any) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="max-w-7xl mx-auto px-4 md:px-6 mt-10">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900">
              Explore by Category
            </h2>
            <a href="/categories" className="text-sm text-blue-600 hover:underline">
              View all
            </a>
          </div>

          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            {categoryItems.map((c) => (
              <a
                key={c.slug}
                href={`/categories/${c.slug}`}
                className="group rounded-2xl bg-gradient-to-b from-white to-gray-50 border border-gray-100 shadow-sm hover:shadow-md transition p-4 text-center"
              >
                <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500 text-white flex items-center justify-center text-2xl shadow-lg shadow-purple-500/20 group-hover:scale-105 transition">
                  {c.emoji}
                </div>
                <div className="mt-3 text-xs md:text-sm font-medium text-gray-800">
                  {c.name}
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {topLocalities && topLocalities.length > 0 ? (
        <section className="max-w-7xl mx-auto px-4 md:px-6 mt-10">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg md:text-xl font-semibold text-gray-900">
                Explore by Locality
              </h2>
              <a href="/events" className="text-sm text-blue-600 hover:underline">
                Browse all
              </a>
            </div>

            <div className="flex flex-wrap gap-3">
              {topLocalities.map((locality: any) => (
                <a
                  key={locality.id}
                  href={`/jaipur/${locality.slug}`}
                  className="px-4 py-2 bg-gray-100 rounded-full text-sm text-gray-700 hover:bg-gray-200 transition"
                >
                  {locality.name}
                </a>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section id="featured" className="max-w-7xl mx-auto px-4 md:px-6 mt-12">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-900">
              Featured Events
            </h2>
            <p className="mt-1 text-sm md:text-base text-gray-600">
              High-signal picks worth checking out in {selectedLocalityLabel}
            </p>
          </div>
        </div>

        {!featuredEvents || featuredEvents.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 text-gray-500">
            No featured events available right now.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {featuredEvents.map((event: any, index: number) => {
              const image =
                event?.cover_image_url ||
                event?.image_url ||
                event?.cover_image ||
                'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1200';

              return (
                <a
                  key={event.id}
                  href={`/events/${event.slug}`}
                  className={`group relative overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm hover:shadow-lg transition ${
                    index === 0 ? 'lg:col-span-2 lg:row-span-2 min-h-[360px]' : 'min-h-[190px]'
                  }`}
                >
                  <div
                    className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition duration-500"
                    style={{ backgroundImage: `url('${image}')` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

                  <div className="absolute top-4 left-4">
                    <div className="inline-flex items-center rounded-full bg-white/15 backdrop-blur-sm px-3 py-1 text-xs text-white">
                      Featured
                    </div>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6 text-white">
                    <h3 className="text-lg md:text-2xl font-semibold leading-tight">
                      {event.title}
                    </h3>
                    <p className="mt-2 text-sm text-white/85 line-clamp-2">
                      {event.short_description || event.meta_description || event.description}
                    </p>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </section>

      {weekendWindowEvents.length > 0 ? (
        <section className="max-w-7xl mx-auto px-4 md:px-6 mt-14">
          <div className="flex items-end justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-semibold text-gray-900">
                This Week & Weekend
              </h2>
              <p className="mt-1 text-sm md:text-base text-gray-600">
                Event ideas for your next plan in {selectedLocalityLabel}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {weekendWindowEvents.slice(0, 6).map((event: any) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="max-w-7xl mx-auto px-4 md:px-6 mt-14">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-900">
              Trending Now
            </h2>
            <p className="mt-1 text-sm md:text-base text-gray-600">
              Popular upcoming picks across {selectedLocalityLabel}
            </p>
          </div>
        </div>

        {!trendingEvents || trendingEvents.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 text-gray-500">
            No trending events available right now.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {trendingEvents.map((event: any) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </section>

      <section id="events" className="max-w-7xl mx-auto px-4 md:px-6 mt-14">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-900">
              Explore {selectedLocalityLabel} Events
            </h2>
            <p className="mt-1 text-sm md:text-base text-gray-600">
              Curated upcoming events across {selectedLocalityLabel}
            </p>
          </div>

          <a href="/events" className="hidden md:inline text-sm text-blue-600 hover:underline">
            Browse all events
          </a>
        </div>

        {!latestEvents || latestEvents.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 text-gray-500">
            No events found for {selectedLocalityLabel}.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {latestEvents.map((event: any) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </section>

      <section className="max-w-7xl mx-auto px-4 md:px-6 mt-16">
        <div className="bg-white rounded-3xl border border-gray-200 p-6 md:p-8">
          <h2 className="text-2xl font-semibold text-gray-900">
            Why JaipurCircle for event discovery
          </h2>

          <div className="mt-5 grid md:grid-cols-3 gap-4">
            <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                Persistent event pages
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Event pages remain valuable even after the event ends, helping users discover similar upcoming experiences.
              </p>
            </div>

            <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                Category + locality graph
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                JaipurCircle connects events through categories, venues, localities, and artists to make discovery easier.
              </p>
            </div>

            <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                Strong local relevance
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Find what’s happening near you, across Jaipur’s active areas, without losing city-wide context.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
