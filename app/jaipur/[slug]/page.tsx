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
    description: `Discover events, nightlife, workshops, and experiences in ${locality.name}, Jaipur.`,
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

  const { data: rawEvents } = await supabase
    .from('events')
    .select('*')
    .or(`locality.eq.${slug},locality_id.eq.${locality.id}`)
    .order('start_time', { ascending: true })
    .limit(30);

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .limit(6);

  const now = new Date();

  const events = (rawEvents || []).filter(
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

  /* =========================
     SCHEMA
     ========================= */

  const placeSchema = {
    '@context': 'https://schema.org',
    '@type': 'Place',
    name: `${locality.name}, Jaipur`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: locality.name,
      addressRegion: 'Rajasthan',
      addressCountry: 'India',
    },
    url: `https://www.jaipurcircle.com/jaipur/${locality.slug}`,
  };

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: upcomingEvents.map((e: any, i: number) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: e.title,
      url: `https://www.jaipurcircle.com/events/${e.slug}`,
    })),
  };

  return (
    <main className="max-w-6xl mx-auto px-4 md:px-6 py-10">

      {/* SCHEMA */}
      <script type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(placeSchema) }} />
      <script type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />

      {/* HERO */}
      <section className="mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
          Things to Do in {locality.name}, Jaipur
        </h1>

        <p className="mt-3 text-gray-600 max-w-3xl leading-relaxed">
          Discover the best events, nightlife, workshops, and experiences in {locality.name}.
          Explore what’s happening today and upcoming in this area.
        </p>
      </section>

      {/* 🔗 INTERNAL NAV (CRITICAL) */}
      <section className="mb-8">
        <div className="flex flex-wrap gap-3 text-sm">

          <a href="/events" className="px-4 py-2 bg-gray-100 rounded-full">
            All Jaipur Events
          </a>

          <a href="/categories" className="px-4 py-2 bg-gray-100 rounded-full">
            All Categories
          </a>

        </div>
      </section>

      {/* UPCOMING EVENTS */}
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

      {/* 🔥 CATEGORY LOOP (VERY IMPORTANT) */}
      {categories && categories.length > 0 && (
        <section className="mb-12">
          <h2 className="text-lg font-semibold mb-4">
            Explore by Category in {locality.name}
          </h2>

          <div className="flex flex-wrap gap-3 text-sm">
            {categories.map((cat: any) => (
              <a
                key={cat.id}
                href={`/events-in/${cat.slug}/${locality.slug}`}
                className="px-4 py-2 bg-gray-100 rounded-full hover:bg-gray-200 transition"
              >
                {cat.name} in {locality.name}
              </a>
            ))}
          </div>
        </section>
      )}

      {/* PAST EVENTS */}
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

      {/* 🔗 SEO BOOST LINKS */}
      <section className="mt-14">
        <h2 className="text-lg font-semibold mb-4">
          Explore More in Jaipur
        </h2>

        <div className="flex flex-wrap gap-3 text-sm">

          <a href="/categories/comedy-shows" className="px-4 py-2 bg-gray-100 rounded-full">
            Comedy Shows Jaipur
          </a>

          <a href="/categories/music-events" className="px-4 py-2 bg-gray-100 rounded-full">
            Music Events Jaipur
          </a>

          <a href="/categories/workshops" className="px-4 py-2 bg-gray-100 rounded-full">
            Workshops Jaipur
          </a>

        </div>
      </section>

    </main>
  );
}
