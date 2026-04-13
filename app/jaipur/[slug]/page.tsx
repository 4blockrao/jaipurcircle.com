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

  const { data: locality } = await supabase
    .from('localities')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (!locality) {
    return {
      title: 'Jaipur Localities',
      description: 'Explore localities in Jaipur',
    };
  }

  return {
    title: `Things to Do in ${locality.name}, Jaipur`,
    description: `Discover events, activities, nightlife, and things to do in ${locality.name}, Jaipur.`,
  };
}

export default async function LocalityPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const supabase = createServerSupabaseClient();
  const { slug } = await params;

  const { data: locality } = await supabase
    .from('localities')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (!locality) return notFound();

  /* =========================
     EVENTS FETCH
     ========================= */
  const { data: rawEvents } = await supabase
    .from('events')
    .select('*')
    .or(`locality.eq.${slug},locality_id.eq.${locality.id}`)
    .order('start_time', { ascending: true })
    .limit(30);

  const now = new Date();

  const events = (rawEvents || []).filter(
    (e: any) =>
      !e.editorial_status || e.editorial_status === 'published'
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
         HERO / TITLE
         ========================= */}
      <section className="mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
          Things to Do in {locality.name}, Jaipur
        </h1>

        <p className="mt-3 text-gray-600 max-w-3xl leading-relaxed">
          Explore events, nightlife, workshops, and experiences happening in {locality.name}.
          Discover what’s trending, upcoming, and worth exploring.
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
            Categories
          </a>

          <a href={`/events?locality=${slug}`} className="px-4 py-2 bg-gray-100 rounded-full">
            Filter This Area
          </a>

        </div>
      </section>

      {/* =========================
         UPCOMING EVENTS
         ========================= */}
      {upcomingEvents.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-6">
            Upcoming Events in {locality.name}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingEvents.map((event: any) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </section>
      )}

      {/* =========================
         CATEGORY LINKS
         ========================= */}
      <section className="mb-12">
        <h2 className="text-lg font-semibold mb-4">
          Explore by Category in {locality.name}
        </h2>

        <div className="flex flex-wrap gap-3 text-sm">

          <a href={`/events-in/comedy-shows/${slug}`} className="px-4 py-2 bg-gray-100 rounded-full">
            Comedy Shows
          </a>

          <a href={`/events-in/music-events/${slug}`} className="px-4 py-2 bg-gray-100 rounded-full">
            Music Events
          </a>

          <a href={`/events-in/workshops/${slug}`} className="px-4 py-2 bg-gray-100 rounded-full">
            Workshops
          </a>

          <a href={`/events-in/nightlife/${slug}`} className="px-4 py-2 bg-gray-100 rounded-full">
            Nightlife
          </a>

        </div>
      </section>

      {/* =========================
         PAST EVENTS
         ========================= */}
      {pastEvents.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-6">
            Past Events in {locality.name}
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
              No events found in {locality.name} right now.
            </p>

            <p className="text-gray-500 mt-2">
              Try exploring all Jaipur events or nearby areas.
            </p>
          </div>
        </section>
      )}

      {/* =========================
         SEO BOOST LINKS
         ========================= */}
      <section className="mt-14">
        <h2 className="text-lg font-semibold mb-4">
          Explore More in Jaipur
        </h2>

        <div className="flex flex-wrap gap-3 text-sm">

          <a href="/events" className="px-4 py-2 bg-gray-100 rounded-full">
            All Jaipur Events
          </a>

          <a href="/categories/comedy-shows" className="px-4 py-2 bg-gray-100 rounded-full">
            Comedy Shows Jaipur
          </a>

          <a href="/categories/music-events" className="px-4 py-2 bg-gray-100 rounded-full">
            Music Events Jaipur
          </a>

        </div>
      </section>

    </main>
  );
}
