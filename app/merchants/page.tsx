import { createServerSupabaseClient } from '@/lib/supabase';

export const metadata = {
  title: 'Merchants in Jaipur - Local Businesses & Discovery',
  description:
    'Explore discoverable merchants in Jaipur by locality and category.',
};

export default async function MerchantsPage() {
  const supabase = createServerSupabaseClient();

  const { data: merchants } = await supabase
    .from('merchants')
    .select('*')
    .eq('is_indexable', true)
    .order('name', { ascending: true });

  return (
    <main className="max-w-6xl mx-auto px-4 md:px-6 py-10">
      <section className="mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
          Merchants in Jaipur
        </h1>
        <p className="mt-3 text-gray-600 max-w-3xl leading-relaxed">
          Discover local merchants, business profiles and commerce-related opportunities across Jaipur.
        </p>
      </section>

      {!merchants || merchants.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <p className="text-gray-700 font-medium">No merchants available yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {merchants.map((merchant: any) => (
            <a
              key={merchant.id}
              href={`/merchant/${merchant.slug}`}
              className="block bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md transition"
            >
              <h2 className="text-lg font-semibold text-gray-900">
                {merchant.name}
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                {merchant.meta_description || merchant.description}
              </p>
            </a>
          ))}
        </div>
      )}
    </main>
  );
}
