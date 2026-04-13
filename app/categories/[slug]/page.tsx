import { createServerSupabaseClient } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import EventCard from '@/components/EventCard';

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

  let events: any[] = [];

  if (eventIds.length > 0) {
    const { data } = await supabase
      .from('events')
      .select('*')
      .in('id', eventIds)
      .order('start_time', { ascending: true });

    events = data || [];
  }

  const { data: localities } = await supabase
    .from('localities')
    .select('*')
    .limit(8);

  return (
    <main className="max-w-6xl mx-auto px-4 md:px-6 py-10">
      <h1 className="text-3xl font-bold mb-6">
        {category.name} in Jaipur
      </h1>

      {/* EVENTS */}
      <section className="mb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
        </div>
      </section>

      {/* 🔥 SEO LINK BLOCK */}
      <section>
        <h2 className="text-lg font-semibold mb-4">
          Explore {category.name} by locality
        </h2>

        <div className="flex flex-wrap gap-3">
          {localities?.map((loc) => (
            <a
              key={loc.id}
              href={`/events-in/${category.slug}/${loc.slug}`}
              className="px-4 py-2 bg-gray-100 rounded-full hover:bg-gray-200 text-sm"
            >
              {category.name} in {loc.name}
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
