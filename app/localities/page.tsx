import { createServerSupabaseClient } from '@/lib/supabase';

export default async function LocalitiesPage() {
  const supabase = createServerSupabaseClient();

  const { data: localities } = await supabase
    .from('localities')
    .select('*')
    .order('name', { ascending: true });

  return (
    <main className="max-w-6xl mx-auto px-4 md:px-6 py-10">
      <section className="mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
          Explore Jaipur by Locality
        </h1>

        <p className="mt-3 text-gray-600 max-w-3xl leading-relaxed">
          Discover events, venues, and things to do across Jaipur localities such as
          C-Scheme, Malviya Nagar, Vaishali Nagar, Mansarovar, and more.
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(localities || []).map((locality: any) => (
          <a
            key={locality.id}
            href={`/jaipur/${locality.slug}`}
            className="block bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md transition"
          >
            <h2 className="text-lg font-semibold text-gray-900">
              {locality.name}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {locality.description ||
                `Things to do in ${locality.name}, Jaipur.`}
            </p>
          </a>
        ))}
      </section>
    </main>
  );
}
