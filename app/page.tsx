import { createServerSupabaseClient } from '@/lib/supabase';
import EventCard from '@/components/EventCard';
import LocalitySelector from '@/components/LocalitySelector';

const categoryItems = [
  { name: 'Comedy', slug: 'comedy-shows', emoji: '🎭' },
  { name: 'Music', slug: 'music-events', emoji: '🎵' },
  { name: 'Workshops', slug: 'workshops', emoji: '🛠️' },
  { name: 'Nightlife', slug: 'nightlife', emoji: '🌃' },
  { name: 'Food', slug: 'food-festivals', emoji: '🍽️' },
  { name: 'Art', slug: 'art-culture', emoji: '🎨' },
];

const LOCALITY_LABELS: Record<string, string> = {
  jaipur: 'Jaipur',
  'c-scheme': 'C-Scheme',
  'malviya-nagar': 'Malviya Nagar',
  'vaishali-nagar': 'Vaishali Nagar',
  mansarovar: 'Mansarovar',
  jagatpura: 'Jagatpura',
};

export default async function HomePage({
  searchParams,
}: {
  searchParams?: Promise<{ locality?: string }>;
}) {
  const supabase = createServerSupabaseClient();
  const sp = (await searchParams) || {};
  const selectedLocality = sp.locality || 'jaipur';
  const selectedLocalityLabel =
    LOCALITY_LABELS[selectedLocality] || 'Jaipur';

  let baseEventsQuery = supabase
    .from('events')
    .select('*')
    .order('start_time', { ascending: true });

  if (selectedLocality !== 'jaipur') {
    const { data: localityRow } = await supabase
      .from('localities')
      .select('id')
      .eq('slug', selectedLocality)
      .maybeSingle();

    if (localityRow?.id) {
      baseEventsQuery = baseEventsQuery.eq('locality_id', localityRow.id);
    }
  }

  const { data: allEvents } = await baseEventsQuery.limit(18);

  const featuredEvents = (allEvents || []).slice(0, 3);
  const trendingEvents = (allEvents || []).slice(3, 9);
  const latestEvents = (allEvents || []).slice(0, 12);

  const featuredHero =
    featuredEvents[0]?.cover_image ||
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1600';

  return (
    <main className="pb-28">
      <section className="relative overflow-hidden bg-gradient-to-br from-fuchsia-600 via-purple-600 to-indigo-700 text-white">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url('${featuredHero}')` }}
        />
        <div className="absolute inset-0 bg-black/15" />

        <div className="relative max-w-6xl mx-auto px-4 md:px-6 pt-10 md:pt-20 pb-24 md:pb-28">
          <div className="md:hidden mb-5">
            <LocalitySelector selectedLocality={selectedLocality} />
          </div>

          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 px-4 py-2 rounded-full text-sm shadow-sm">
            <span>📅</span>
            <span>Live Events</span>
          </div>

          <h1 className="mt-6 text-4xl md:text-6xl font-bold leading-tight tracking-tight max-w-3xl">
            Discover {selectedLocalityLabel} Events
          </h1>

          <p className="mt-4 text-sm md:text-lg text-white/90 max-w-2xl leading-relaxed">
            Concerts, comedy shows, workshops, nightlife and local experiences happening across {selectedLocalityLabel}.
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
              href="/categories"
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 px-6 py-3 rounded-full font-medium text-white hover:bg-white/15 transition"
            >
              Browse Categories
            </a>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 md:px-6 -mt-12 relative z-10">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl shadow-black/10 border border-white/60 p-3 md:p-4 flex items-center gap-3">
          <div className="text-gray-400 text-lg pl-2">🔎</div>
          <input
            placeholder="Search events, venues, places..."
            className="w-full outline-none text-sm md:text-base bg-transparent"
          />
          <div className="shrink-0 rounded-xl bg-gray-100 px-4 py-2 text-sm text-gray-700">
            📍 {selectedLocalityLabel}
          </div>
        </div>
      </div>

      <section className="max-w-6xl mx-auto px-4 md:px-6 mt-8">
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

      <section id="featured" className="max-w-6xl mx-auto px-4 md:px-6 mt-12">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-900">
              Featured Events
            </h2>
            <p className="mt-1 text-sm md:text-base text-gray-600">
              Handpicked events worth checking out in {selectedLocalityLabel}
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
                event.cover_image ||
                'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1200';

              return (
                <a
                  key={event.id}
                  href={`/events/${event.slug}`}
                  className={`group relative overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm hover:shadow-lg transition ${
                    index === 0 ? 'lg:col-span-2 lg:row-span-2 min-h-[360px]' : 'min-h-[170px]'
                  }`}
                >
                  <div
                    className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition duration-500"
                    style={{ backgroundImage: `url('${image}')` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                  <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6 text-white">
                    <div className="inline-flex items-center rounded-full bg-white/15 backdrop-blur-sm px-3 py-1 text-xs mb-3">
                      Featured
                    </div>
                    <h3 className="text-lg md:text-2xl font-semibold leading-tight">
                      {event.title}
                    </h3>
                    <p className="mt-2 text-sm text-white/85 line-clamp-2">
                      {event.meta_description}
                    </p>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </section>

      <section className="max-w-6xl mx-auto px-4 md:px-6 mt-14">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-900">
              Trending Now
            </h2>
            <p className="mt-1 text-sm md:text-base text-gray-600">
              Popular event picks across {selectedLocalityLabel}
            </p>
          </div>
        </div>

        {!trendingEvents || trendingEvents.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 text-gray-500">
            No trending events available right now.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trendingEvents.map((event: any) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </section>

      <section id="events" className="max-w-6xl mx-auto px-4 md:px-6 mt-14">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-900">
              Explore {selectedLocalityLabel} Events
            </h2>
            <p className="mt-1 text-sm md:text-base text-gray-600">
              Curated upcoming events across {selectedLocalityLabel}
            </p>
          </div>

          <a href="/categories" className="hidden md:inline text-sm text-blue-600 hover:underline">
            Browse all categories
          </a>
        </div>

        {!latestEvents || latestEvents.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 text-gray-500">
            No events found for {selectedLocalityLabel}.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {latestEvents.map((event: any) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

{/* 🔥 Popular Categories */}
<section className="px-4 py-6">
  <h2 className="text-xl font-bold mb-3">Explore Categories</h2>
  <div className="flex gap-3 overflow-x-auto">
    {['comedy-shows','music-events','workshops','nightlife','food-festivals','art-culture'].map((c) => (
      <a
        key={c}
        href={`/categories/${c}`}
        className="px-4 py-2 bg-gray-100 rounded-full whitespace-nowrap text-sm"
      >
        {c.replace('-', ' ')}
      </a>
    ))}
  </div>
</section>

{/* 📍 Top Localities */}
<section className="px-4 py-6">
  <h2 className="text-xl font-bold mb-3">Popular Areas in Jaipur</h2>
  <div className="flex gap-3 overflow-x-auto">
    {['vaishali-nagar','malviya-nagar','c-scheme','mansarovar','jagatpura'].map((l) => (
      <a
        key={l}
        href={`/jaipur/${l}`}
        className="px-4 py-2 bg-gray-100 rounded-full whitespace-nowrap text-sm"
      >
        {l.replace('-', ' ')}
      </a>
    ))}
  </div>
</section>

