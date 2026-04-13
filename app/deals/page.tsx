import { createServerSupabaseClient } from '@/lib/supabase';

export const metadata = {
  title: 'Deals in Jaipur - Offers, Promotions & Local Discovery',
  description:
    'Explore deals in Jaipur linked to merchants, localities and commercial discovery.',
};

export default async function DealsPage() {
  const supabase = createServerSupabaseClient();

  const { data: deals } = await supabase
    .from('deals')
    .select('*')
    .eq('is_indexable', true)
    .order('created_at', { ascending: false });

  return (
    <main className="max-w-6xl mx-auto px-4 md:px-6 py-10">
      <section className="mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
          Deals in Jaipur
        </h1>
        <p className="mt-3 text-gray-600 max-w-3xl leading-relaxed">
          Explore local offers, business promotions and commercial discovery across Jaipur.
        </p>
      </section>

      {!deals || deals.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <p className="text-gray-700 font-medium">No deals available yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {deals.map((deal: any) => (
            <a
              key={deal.id}
              href={`/deal/${deal.slug}`}
              className="block bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md transition"
            >
              <h2 className="text-lg font-semibold text-gray-900">
                {deal.title}
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                {deal.meta_description || deal.description}
              </p>
            </a>
          ))}
        </div>
      )}
    </main>
  );
}
