import { notFound } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase';
import EventCard from '@/components/EventCard';
import { resolveCategorySlug, resolveLocalitySlug } from '@/lib/resolve-slugs';

function isPublishedOrLegacyLive(event: any) {
  return !event?.editorial_status || event.editorial_status === 'published';
}

function resolveEventStatus(event: any) {
  if (event?.status) return event.status;

  const startValue = event?.start_time || event?.start_date;
  if (!startValue) return 'upcoming';

  const now = new Date();
  const start = new Date(startValue);

  if (Number.isNaN(start.getTime())) return 'upcoming';
  return start.getTime() < now.getTime() ? 'past' : 'upcoming';
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; locality: string }>;
}) {
  const supabase = createServerSupabaseClient();
  const { category, locality } = await params;

  const categoryResult = await resolveCategorySlug(supabase, category);
  const localityResult = await resolveLocalitySlug(supabase, locality);

  const resolvedCategory = categoryResult.category;
  const resolvedLocality = localityResult.locality;

  if (!resolvedCategory || !resolvedLocality) {
    return {
      title: 'Events in Jaipur',
      description: 'Browse events in Jaipur by category and locality.',
    };
  }

  return {
    title: `${resolvedCategory.name} in ${resolvedLocality.name}, Jaipur`,
    description: `Browse ${resolvedCategory.name.toLowerCase()} in ${resolvedLocality.name}, Jaipur. Discover upcoming and past events, shows and experiences.`,
  };
}

export default async function CategoryLocalityEventsPage({
  params,
}: {
  params: Promise<{ category: string; locality: string }>;
}) {
  const supabase = createServerSupabaseClient();
  const { category, locality } = await params;

  const categoryResult = await resolveCategorySlug(supabase, category);
  const localityResult = await resolveLocalitySlug(supabase, locality);

  const resolvedCategory = categoryResult.category;
  const resolvedLocality = localityResult.locality;

  if (!resolvedCategory || !resolvedLocality) {
    return notFound();
  }

  const { data: categoryLinks } = await supabase
    .from('event_categories')
    .select('event_id')
    .eq('category_id', resolvedCategory.id);

  const categoryEventIds = (categoryLinks || []).map((row: any) => row.event_id);

  let rawEvents: any[] = [];

  if (categoryEventIds.length > 0) {
    const { data } = await supabase
      .from('events')
      .select('*')
      .in('id', categoryEventIds)
      .eq('locality_id', resolvedLocality.id)
      .order('start_time', { ascending: true });

    rawEvents = data || [];
  }

  const events = rawEvents
    .filter(isPublishedOrLegacyLive)
    .sort((a: any, b: any) => {
      const aStatus = resolveEventStatus(a);
      const bStatus = resolveEventStatus(b);

      if (aStatus === 'upcoming' && bStatus !== 'upcoming') return -1;
      if (aStatus !== 'upcoming' && bStatus === 'upcoming') return 1;

      const aDate = new Date(a.start_time || a.start_date || 0).getTime();
      const bDate = new Date(b.start_time || b.start_date || 0).getTime();

      return aDate - bDate;
    });

  const upcomingEvents = events.filter((event: any) => resolveEventStatus(event) === 'upcoming');
  const pastEvents = events.filter((event: any) => resolveEventStatus(event) === 'past');

  return (
    <main className="max-w-6xl mx-auto px-4 md:px-6 py-10">
      <section className="mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
          {resolvedCategory.name} in {resolvedLocality.name}, Jaipur
        </h1>

        <p className="mt-3 text-gray-600 max-w-3xl leading-relaxed">
          Discover {resolvedCategory.name.toLowerCase()} in {resolvedLocality.name}, Jaipur.
          Browse upcoming shows, experiences and local events, and explore related event hubs across Jaipur.
        </p>
      </section>

      <section className="mb-8">
        <div className="flex flex-wrap gap-3 text-sm">
          <a
            href="/events"
            className="px-4 py-2 bg-gray-100 rounded-full text-gray-700 hover:bg-gray-200 transition"
          >
            All Events
          </a>

          <a
            href={`/categories/${resolvedCategory.slug}`}
            className="px-4 py-2 bg-gray-100 rounded-full text-gray-700 hover:bg-gray-200 transition"
          >
            All {resolvedCategory.name}
          </a>

          <a
            href={`/jaipur/${resolvedLocality.slug}`}
            className="px-4 py-2 bg-gray-100 rounded-full text-gray-700 hover:bg-gray-200 transition"
          >
            Events in {resolvedLocality.name}
          </a>
        </div>
      </section>

      <section className="mb-10">
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Explore {resolvedCategory.name} in {resolvedLocality.name}
          </h2>
          <p className="text-gray-600 leading-relaxed">
            This page brings together event discovery for people specifically looking for{' '}
            {resolvedCategory.name.toLowerCase()} in {resolvedLocality.name}. It is designed as a
            persistent discovery page, so even when some events end, the hub remains useful for
            finding related upcoming options.
          </p>
        </div>
      </section>

      {upcomingEvents.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-6">Upcoming {resolvedCategory.name}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingEvents.map((event: any) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </section>
      )}

      {pastEvents.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-6">Past {resolvedCategory.name}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pastEvents.map((event: any) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </section>
      )}

      {events.length === 0 && (
        <section className="mb-12">
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <p className="text-gray-700 font-medium">
              No events found right now for this combination.
            </p>
            <p className="text-gray-500 mt-2">
              Try browsing all {resolvedCategory.name.toLowerCase()} across Jaipur or explore more
              events in {resolvedLocality.name}.
            </p>
          </div>
        </section>
      )}

      <section className="mt-14">
        <h2 className="text-lg font-semibold mb-4">
          Continue Exploring Jaipur
        </h2>

        <div className="flex flex-wrap gap-3 text-sm">
          <a
            href={`/categories/${resolvedCategory.slug}`}
            className="px-4 py-2 bg-gray-100 rounded-full text-gray-700 hover:bg-gray-200 transition"
          >
            More {resolvedCategory.name} in Jaipur
          </a>

          <a
            href={`/jaipur/${resolvedLocality.slug}`}
            className="px-4 py-2 bg-gray-100 rounded-full text-gray-700 hover:bg-gray-200 transition"
          >
            More events in {resolvedLocality.name}
          </a>

          <a
            href="/events"
            className="px-4 py-2 bg-gray-100 rounded-full text-gray-700 hover:bg-gray-200 transition"
          >
            Browse all Jaipur events
          </a>
        </div>
      </section>
    </main>
  );
}
