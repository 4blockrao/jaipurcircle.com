import { notFound } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase';
import EventCard from '@/components/EventCard';
import {
  buildHybridLinksForCategory,
  buildLocalityLinks,
} from '@/lib/internal-linking';
import { getCategorySEO } from '@/lib/seo-content';

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
    title: `${category.name} in Jaipur`,
    description: `Explore ${category.name.toLowerCase()} events in Jaipur.`,
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

  const { data: localities } = await supabase
    .from('localities')
    .select('*')
    .limit(8);

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

  /* =========================
     SEO CONTENT
     ========================= */
  const seo = getCategorySEO(category);

  /* =========================
     SCHEMA
     ========================= */
  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${category.name} in Jaipur`,
    url: `https://www.jaipurcircle.com/categories/${category.slug}`,
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

  const localityLinks = buildLocalityLinks(localities || []);
  const hybridLinks = buildHybridLinksForCategory(category, localities || []);

  return (
    <main className="max-w-6xl mx-auto px-4 md:px-6 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />

      <section className="mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
          {category.name} in Jaipur
        </h1>

        <p className="mt-3 text-gray-600 max-w-3xl leading-relaxed">
          Discover the best {category.name.toLowerCase()} events happening across Jaipur.
          Explore upcoming shows, trending experiences, and popular venues.
        </p>
      </section>

      {/* 🔥 SEO CONTENT BLOCK */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">
          About {category.name} in Jaipur
        </h2>

        <p className="text-gray-600 mb-4 leading-relaxed">
          {seo.intro}
        </p>

        <ul className="list-disc pl-5 text-gray-600 space-y-2">
          {seo.highlights.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>

        <p className="text-gray-600 mt-4 leading-relaxed">
          {seo.outro}
        </p>
      </section>

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

      {hybridLinks.length > 0 && (
        <section className="mb-12">
          <h2 className="text-lg font-semibold mb-4">
            Explore {category.name} by Area
          </h2>

          <div className="flex flex-wrap gap-3 text-sm">
            {hybridLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="px-4 py-2 bg-gray-100 rounded-full hover:bg-gray-200 transition"
              >
                {link.label}
              </a>
            ))}
          </div>
        </section>
      )}

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

      <section className="mt-14">
        <h2 className="text-lg font-semibold mb-4">
          Explore More in Jaipur
        </h2>

        <div className="flex flex-wrap gap-3 text-sm">
          {localityLinks.slice(0, 3).map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="px-4 py-2 bg-gray-100 rounded-full"
            >
              {link.label} Events
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
