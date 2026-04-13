import { notFound } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase';
import EventCard from '@/components/EventCard';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const supabase = createServerSupabaseClient();
  const { slug } = await params;

  const { data: category } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (!category) {
    return {
      title: 'Event Categories Jaipur',
      description: 'Browse event categories in Jaipur',
    };
  }

  return {
    title: `${category.name} in Jaipur | Events & Shows`,
    description: `Discover ${category.name.toLowerCase()} in Jaipur. Explore upcoming events, shows, and experiences.`,
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const supabase = createServerSupabaseClient();
  const { slug } = await params;

  const { data: category } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (!category) return notFound();

  /* =========================
     FETCH EVENT IDS
     ========================= */
  const { data: eventLinks } = await supabase
    .from('event_categories')
    .select('event_id')
    .eq('category_id', category.id);

  const eventIds = (eventLinks || []).map((x: any) => x.event_id);

  let rawEvents: any[] = [];

  if (eventIds.length > 0) {
    const { data } = await supabase
      .from('events')
      .select('*')
      .in('id', eventIds)
      .order('start_time', { ascending: true })
      .limit(30);

    rawEvents = data || [];
  }

  const now = new Date();

  const events = rawEvents.filter(
    (e: any) => !e.editorial_status || e.editorial_status === 'published'
  );

  const upcomingEvents = events.filter((e: any) => {
    const date = new Date(e.start_time || e.start_date);
    return date >= now;
  });

  const pastEvents = events.filter((e: any) => {
    const date = new Date(e.start_time || e.start_date);
    return date < now;
  });

  return (
    <main className="max-w-6xl mx-auto px-4 md:px-6 py-10">

      {/* =========================
         TITLE
         ========================= */}
      <section className="mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
          {category.name} in Jaipur
        </h1>

        <p className="mt-3 text-gray-600 max-w-3xl leading-relaxed">
          Discover the best {category.name.toLowerCase()} happening across Jaipur.
          Explore upcoming events, popular shows, and trending experiences.
        </p>
      </section>

      {/* =========================
         INTERNAL NAV
         ========================= */}
      <section className="mb-8">
        <div className="flex flex-wrap gap-3 text-sm">

          <a href="/events" className="px-4 py-2 bg-gray-100 rounded-full">
            All Events
          </a>

          <a href="/categories" className="px-4 py-2 bg-gray-100 rounded-full">
            All Categories
          </a>

        </div>
      </section>

      {/* =========================
         UPCOMING EVENTS
         ========================= */}
      {upcomingEvents.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-6">
            Upcoming {category.name}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingEvents.map((event: any) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </section>
      )}

      {/* =========================
         LOCALITY LINKS
         ========================= */}
      <section className="mb-12">
        <h2 className="text-lg font-semibold mb-4">
          Explore {category.name} by Area
        </h2>

        <div className="flex flex-wrap gap-3 text-sm">

          <a href={`/events-in/${slug}/vaishali-nagar`} className="px-4 py-2 bg-gray-100 rounded-full">
            Vaishali Nagar
          </a>

          <a href={`/events-in/${slug}/c-scheme`} className="px-4 py-2 bg-gray-100 rounded-full">
            C-Scheme
          </a>

          <a href={`/events-in/${slug}/malviya-nagar`} className="px-4 py-2 bg-gray-100 rounded-full">
            Malviya Nagar
          </a>

          <a href={`/events-in/${slug}/mansarovar`} className="px-4 py-2 bg-gray-100 rounded-full">
            Mansarovar
          </a>

        </div>
      </section>

      {/* =========================
         PAST EVENTS
         ========================= */}
      {pastEvents.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-6">
            Past {category.name}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pastEvents.slice(0, 9).map((event: any) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </section>
      )}

      {/* =========================
         FALLBACK
         ========================= */}
      {events.length === 0 && (
        <section>
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <p className="text-gray-700 font-medium">
              No {category.name.toLowerCase()} found right now.
            </p>

            <p className="text-gray-500 mt-2">
              Try exploring all Jaipur events or other categories.
            </p>
          </div>
        </section>
      )}

      {/* =========================
         SEO LINKS
         ========================= */}
      <section className="mt-14">
        <h2 className="text-lg font-semibold mb-4">
          Explore More in Jaipur
        </h2>

        <div className="flex flex-wrap gap-3 text-sm">

          <a href="/events" className="px-4 py-2 bg-gray-100 rounded-full">
            All Events
          </a>

          <a href="/categories/comedy-shows" className="px-4 py-2 bg-gray-100 rounded-full">
            Comedy Shows
          </a>

          <a href="/categories/music-events" className="px-4 py-2 bg-gray-100 rounded-full">
            Music Events
          </a>

        </div>
      </section>

    </main>
  );
}
