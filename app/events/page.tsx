export const metadata = {
  title: 'Events in Jaipur',
  description: 'Explore upcoming and past events across Jaipur with permanent event pages, venue context, and locality discovery.',
  robots: {
    index: true,
    follow: true,
  },
};

import { createServerSupabaseClient } from '@/lib/supabase';
import EventCard from '@/components/EventCard';

function parseEventDate(event: any) {
  const value = event?.start_time || event?.start_date;
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function sortEvents(items: any[]) {
  const now = new Date();

  return [...(items || [])].sort((a: any, b: any) => {
    const aDate = parseEventDate(a);
    const bDate = parseEventDate(b);

    if (!aDate && !bDate) return 0;
    if (!aDate) return 1;
    if (!bDate) return -1;

    const aUpcoming = aDate >= now;
    const bUpcoming = bDate >= now;

    if (aUpcoming && !bUpcoming) return -1;
    if (!aUpcoming && bUpcoming) return 1;

    if (aUpcoming && bUpcoming) return aDate.getTime() - bDate.getTime();
    return bDate.getTime() - aDate.getTime();
  });
}

export default async function EventsPage() {
  const supabase = createServerSupabaseClient();

  const { data: events } = await supabase
    .from('events')
    .select('*')
    .eq('editorial_status', 'published')
    .eq('status', 'published')
    .limit(120);

  const sorted = sortEvents(events || []);

  return (
    <main className="max-w-7xl mx-auto px-4 py-10">
      <h1 className="text-3xl md:text-4xl font-bold">Events in Jaipur</h1>
      <p className="mt-3 max-w-3xl text-gray-600">
        Explore upcoming events, recurring experiences, and permanent event archives across Jaipur. JaipurCircle keeps event pages live even after the event ends, so the city builds a searchable memory over time.
      </p>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sorted.map((event: any) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </main>
  );
}
