import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase';
import { resolveLocalitySlug } from '@/lib/resolve-slugs';

type SearchParams = Promise<{
  locality?: string;
  q?: string;
  search?: string;
}>;

export const metadata = {
  title: 'Jaipur News - Local Updates, Stories & City Discovery',
  description:
    'Explore Jaipur news, local updates and city discovery pages.',
};

export default async function NewsPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const supabase = createServerSupabaseClient();
  const sp = (await searchParams) || {};

  const incomingLocality = String(sp.locality || '').trim();
  const incomingSearch = String(sp.search || sp.q || '').trim();

  if (incomingLocality) {
    const localityResult = await resolveLocalitySlug(supabase, incomingLocality);

    if (localityResult?.locality?.slug) {
      redirect(`/jaipur/${localityResult.locality.slug}/news`);
    }
  }

  let query = supabase
    .from('news')
    .select('*')
    .eq('is_indexable', true)
    .order('published_at', { ascending: false });

  if (incomingSearch) {
    const safe = incomingSearch.replace(/,/g, ' ').trim();
    query = query.or(
      `title.ilike.%${safe}%,meta_description.ilike.%${safe}%,content.ilike.%${safe}%`
    );
  }

  const { data: articles } = await query.limit(60);

  return (
    <main className="max-w-6xl mx-auto px-4 md:px-6 py-10">
      <section className="mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
          Jaipur News
        </h1>
        <p className="mt-3 text-gray-600 max-w-3xl leading-relaxed">
          Explore Jaipur news, city stories and locally relevant updates.
        </p>

        <form className="mt-6 rounded-3xl border border-gray-200 bg-white p-4 md:p-5 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              name="search"
              defaultValue={incomingSearch}
              placeholder="Search news..."
              className="md:col-span-2 w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-gray-400"
            />
            <input
              name="locality"
              defaultValue={incomingLocality}
              placeholder="Locality"
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-gray-400"
            />
          </div>

          <div className="mt-3 flex flex-wrap gap-3">
            <button className="rounded-2xl bg-blue-600 px-5 py-3 text-white font-medium hover:bg-blue-700 transition">
              Search News
            </button>
            <a
              href="/news"
              className="rounded-2xl border border-gray-200 px-5 py-3 text-gray-700 font-medium hover:bg-gray-50 transition"
            >
              Clear Filters
            </a>
          </div>
        </form>
      </section>

      {!articles || articles.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <p className="text-gray-700 font-medium">No news available yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {articles.map((article: any) => (
            <a
              key={article.id}
              href={`/news/${article.category || 'city'}/${article.slug}`}
              className="block bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md transition"
            >
              <h2 className="text-lg font-semibold text-gray-900">
                {article.title}
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                {article.meta_description || article.description}
              </p>
            </a>
          ))}
        </div>
      )}
    </main>
  );
}
