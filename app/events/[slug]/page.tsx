import { notFound } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase';

export default async function EventPage({ params }: { params: { slug: string } }) {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase.rpc('get_event_page', {
    p_slug: params.slug,
  });

  if (error || !data || !data.event) {
    console.error(error);
    return notFound();
  }

  const { event, venue, locality } = data;

  return (
    <main style={{ maxWidth: 900, margin: '40px auto', padding: 20 }}>
      <h1>{event.title}</h1>

      <p>📍 {venue?.name}, {locality?.name}</p>

      <p style={{ marginTop: 10 }}>{event.description}</p>

      <p style={{ marginTop: 20 }}>
        Starts at: {new Date(event.start_time).toLocaleString()}
      </p>
    </main>
  );
}
