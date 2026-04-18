export const metadata = {
  title: 'Deals in Jaipur',
  description: 'Explore local offers, promotions and commercial discovery.',
  robots: {
    index: false,
    follow: true,
  },
};

import { createServerSupabaseClient } from '@/lib/supabase';

export default async function DealsPage() {
  const supabase = createServerSupabaseClient();

  const { data: deals } = await supabase
    .from('deals')
    .select('*')
    .eq('editorial_status', 'published')
    .eq('is_indexable', true)
    .limit(60);

  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold">Deals in Jaipur</h1>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {(deals || []).map((deal: any) => (
          <div key={deal.id} className="border p-4 rounded-xl">
            <h2 className="font-semibold">{deal.title}</h2>
          </div>
        ))}
      </div>
    </main>
  );
}
