import { notFound } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase';
import EventCard from '@/components/EventCard';

import {
  buildLocalityDiscoveryLinks,
} from '@/lib/internal-linking';

export default async function LocalityPage({ params }: any) {
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
    .eq('locality', slug)
    .eq('editorial_status', 'published')
    .limit(30);

  const discoveryLinks = buildLocalityDiscoveryLinks({
    locality,
    categories: events?.map((e: any) => ({ slug: e.category })) || [],
    venues: events?.map((e: any) => ({
      slug: e.venue_name?.toLowerCase().replace(/\s+/g, '-'),
      name: e.venue_name,
    })) || [],
  });

  return (
    <main className="max-w-7xl mx-auto px-4 py-10">

      <h1 className="text-3xl font-bold">
        Things to do in {locality.name}
      </h1>

      {/* Discovery */}
      <div className="mt-6 flex flex-wrap gap-2">
        {discoveryLinks.map((l, i) => (
          <a key={i} href={l.href} className="px-3 py-1 bg-gray-100 rounded-full text-sm">
            {l.label}
          </a>
        ))}
      </div>

      {/* Events */}
      <div className="mt-8 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events?.map((e: any) => (
          <EventCard key={e.id} event={e} />
        ))}
      </div>

    </main>
  );
}
