import { createServerSupabaseClient } from '@/lib/supabase';

export default async function CategoriesPage() {
  const supabase = createServerSupabaseClient();

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('name', { ascending: true });

  return (
    <main className="max-w-6xl mx-auto px-4 md:px-6 py-10">
      <section className="mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
          Event Categories in Jaipur
        </h1>

        <p className="mt-3 text-gray-600 max-w-3xl leading-relaxed">
          Explore Jaipur events by category including comedy shows, music events,
          workshops, nightlife, food festivals, and more.
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(categories || []).map((category: any) => (
          <a
            key={category.id}
            href={`/categories/${category.slug}`}
            className="block bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md transition"
          >
            <h2 className="text-lg font-semibold text-gray-900">
              {category.name}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {category.meta_description ||
                `Browse ${category.name.toLowerCase()} happening across Jaipur.`}
            </p>
          </a>
        ))}
      </section>
    </main>
  );
}
