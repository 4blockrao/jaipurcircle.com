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

  const events = rawEvents.filter(
    (e: any) => !e.editorial_status || e.editorial_status === 'published'
  );

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: events.map((e: any, i: number) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: e.title,
      url: `https://www.jaipurcircle.com/events/${e.slug}`,
    })),
  };

  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${category.name} in Jaipur`,
    url: `https://www.jaipurcircle.com/categories/${category.slug}`,
  };

  return (
    <main className="max-w-6xl mx-auto px-4 md:px-6 py-10">

      {/* ✅ SCHEMA */}
      <script type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }} />
      <script type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />

      <section className="mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
          {category.name} in Jaipur
        </h1>

        <p className="mt-3 text-gray-600">
          Discover the best {category.name.toLowerCase()} in Jaipur.
        </p>
      </section>

      <section>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event: any) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </section>

    </main>
  );
}
