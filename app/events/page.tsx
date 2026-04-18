export const metadata = {
  title: 'Events in Jaipur',
  description: 'Explore events, experiences and activities across Jaipur.',
  robots: {
    index: false,
    follow: true,
  },
};

import { createServerSupabaseClient } from '@/lib/supabase';

export default async function EventsPage() {
  const supabase = createServerSupabaseClient();

  const { data: events } = await supabase
    .from('events')
    .select('*')
    .eq('editorial_status', 'published')
    .order('start_time', { ascending: true })
    .limit(60);

  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold">Events in Jaipur</h1>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {(events || []).map((event: any) => (
          <div key={event.id} className="border p-4 rounded-xl">
            <h2 className="font-semibold">{event.title}</h2>
          </div>
        ))}
      </div>
    </main>
  );
}
