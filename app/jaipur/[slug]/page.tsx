import { createServerSupabaseClient } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import EventCard from '@/components/EventCard';

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

  const { data: events } = await supabase
    .from('events')
    .select('*')
    .eq('locality_id', locality.id)
    .order('start_time', { ascending: true });

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .limit(8);

  return (
    <main className="max-w-6xl mx-auto px-4 md:px-6 py-10">
      <h1 className="text-3xl font-bold mb-6">
        Events in {locality.name}, Jaipur
      </h1>

      {/* EVENTS */}
      <section className="mb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events?.map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
        </div>
      </section>

      {/* 🔥 SEO LINK BLOCK */}
      <section>
        <h2 className="text-lg font-semibold mb-4">
          Explore categories in {locality.name}
        </h2>

        <div className="flex flex-wrap gap-3">
          {categories?.map((cat) => (
            <a
              key={cat.id}
              href={`/events-in/${cat.slug}/${locality.slug}`}
              className="px-4 py-2 bg-gray-100 rounded-full hover:bg-gray-200 text-sm"
            >
              {cat.name} in {locality.name}
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
