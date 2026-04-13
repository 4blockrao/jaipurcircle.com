import { createServerSupabaseClient } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import EventCard from '@/components/EventCard';

export default async function VenuePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const supabase = createServerSupabaseClient();
  const { slug } = await params;

  if (!slug) return notFound();

  const { data: venue } = await supabase
    .from('venues')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (!venue) return notFound();

  let locality: any = null;

  if (venue.locality_id) {
    const { data } = await supabase
      .from('localities')
      .select('*')
      .eq('id', venue.locality_id)
      .maybeSingle();

    locality = data || null;
  }

  const { data: events } = await supabase
    .from('events')
    .select('*')
    .eq('venue_id', venue.id)
    .order('start_time', { ascending: true });

  return (
    <main className="max-w-6xl mx-auto px-4 md:px-6 py-10">
      <section className="mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
          {venue.name}
        </h1>

        <p className="mt-3 text-gray-600 max-w-3xl leading-relaxed">
          {venue.meta_description ||
            venue.description ||
            `Discover ${venue.name} in Jaipur with events, location and venue details.`}
        </p>

        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          {locality?.slug && (
            <a
              href={`/jaipur/${locality.slug}`}
              className="px-4 py-2 bg-gray-100 rounded-full hover:bg-gray-200 transition"
            >
              {locality.name}
            </a>
          )}
        </div>
      </section>

      <section className="mb-14">
        <h2 className="text-xl font-semibold mb-6">
          Events at {venue.name}
        </h2>

        {!events || events.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <p className="text-gray-700 font-medium">
              No events are listed for {venue.name} right now.
            </p>

            <p className="text-gray-500 mt-2">
              Check back soon, or explore more events across Jaipur.
            </p>

            <div className="mt-4 flex flex-wrap gap-3">
              <a
                href="/"
                className="px-4 py-2 bg-gray-100 rounded-full hover:bg-gray-200 text-sm"
              >
                Explore all events
              </a>

              {locality?.slug && (
                <a
                  href={`/jaipur/${locality.slug}`}
                  className="px-4 py-2 bg-gray-100 rounded-full hover:bg-gray-200 text-sm"
                >
                  Things to do in {locality.name}
                </a>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event: any) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </section>

      <section className="border-t pt-10">
        <h2 className="text-xl font-semibold mb-4">
          Explore more
        </h2>

        <div className="flex flex-wrap gap-3 text-sm">
          <a
            href="/categories"
            className="px-4 py-2 bg-gray-100 rounded-full hover:bg-gray-200"
          >
            Browse categories
          </a>

          <a
            href="/localities"
            className="px-4 py-2 bg-gray-100 rounded-full hover:bg-gray-200"
          >
            Browse localities
          </a>

          {locality?.slug && (
            <a
              href={`/jaipur/${locality.slug}`}
              className="px-4 py-2 bg-gray-100 rounded-full hover:bg-gray-200"
            >
              Things to do in {locality.name}
            </a>
          )}
        </div>
      </section>
    </main>
  );
}
