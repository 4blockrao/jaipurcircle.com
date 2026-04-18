import { createServerSupabaseClient } from '@/lib/supabase';
import { resolveLocalitySlug } from '@/lib/resolve-slugs';

type SearchParams = Promise<{
  location?: string;
  q?: string;
  search?: string;
  type?: string;
}>;

export const metadata = {
  title: 'Deals in Jaipur - Offers, Promotions & Local Discovery',
  description:
    'Explore deals in Jaipur linked to merchants, localities and commercial discovery.',
};

export default async function DealsPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const supabase = createServerSupabaseClient();
  const sp = (await searchParams) || {};

  const incomingLocation = String(sp.location || '').trim();
  const incomingSearch = String(sp.search || sp.q || '').trim();
  const incomingType = String(sp.type || '').trim();

  let resolvedLocality: any = null;

  if (incomingLocation) {
    const localityResult = await resolveLocalitySlug(supabase, incomingLocation);
    resolvedLocality = localityResult.locality;
  }

  let query = supabase
    .from('deals')
    .select(`
      *,
      localities (
        id,
        name,
        slug
      )
    `)
    .eq('is_indexable', true)
    .eq('editorial_status', 'published')
    .order('created_at', { ascending: false });

  if (incomingSearch) {
    const safe = incomingSearch.replace(/,/g, ' ').trim();
    query = query.or(
      `title.ilike.%${safe}%,meta_description.ilike.%${safe}%,description.ilike.%${safe}%`
    );
  }

  if (incomingType) {
    query = query.eq('deal_type', incomingType);
  }

  if (resolvedLocality?.id) {
    query = query.eq('locality_id', resolvedLocality.id);
  }

  const { data: deals } = await query.limit(60);

  const pageTitle = resolvedLocality
    ? `Deals in ${resolvedLocality.name}, Jaipur`
    : 'Deals in Jaipur';

  const pageDescription = resolvedLocality
    ? `Explore local offers, promotions and commercial discovery in ${resolvedLocality.name}, Jaipur.`
    : 'Explore local offers, business promotions and commercial discovery across Jaipur.';

  return (
    <main className="max-w-6xl mx-auto px-4 md:px-6 py-10">
      <section className="mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
          {pageTitle}
        </h1>
        <p className="mt-3 text-gray-600 max-w-3xl leading-relaxed">
          {pageDescription}
        </p>

        <form className="mt-6 rounded-3xl border border-gray-200 bg-white p-4 md:p-5 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input
              name="search"
              defaultValue={incomingSearch}
              placeholder="Search deals..."
              className="md:col-span-2 w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-gray-400"
            />
            <input
              name="location"
              defaultValue={incomingLocation}
              placeholder="Locality"
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-gray-400"
            />
            <input
              name="type"
              defaultValue={incomingType}
              placeholder="Deal type"
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-gray-400"
            />
          </div>

          <div className="mt-3 flex flex-wrap gap-3">
            <button className="rounded-2xl bg-blue-600 px-5 py-3 text-white font-medium hover:bg-blue-700 transition">
              Search Deals
            </button>
            <a
              href="/deals"
              className="rounded-2xl border border-gray-200 px-5 py-3 text-gray-700 font-medium hover:bg-gray-50 transition"
            >
              Clear Filters
            </a>
            {resolvedLocality ? (
              <a
                href={`/jaipur/${resolvedLocality.slug}/shopping`}
                className="rounded-2xl border border-gray-200 px-5 py-3 text-gray-700 font-medium hover:bg-gray-50 transition"
              >
                View {resolvedLocality.name} shopping page
              </a>
            ) : null}
          </div>
        </form>
      </section>

      {!deals || deals.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <p className="text-gray-700 font-medium">No deals available for this filter yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {deals.map((deal: any) => {
            const locality = Array.isArray(deal.localities) ? deal.localities[0] : deal.localities;

            return (
              <a
                key={deal.id}
                href={`/deal/${deal.slug || deal.id}`}
                className="block bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md transition"
              >
                <h2 className="text-lg font-semibold text-gray-900">
                  {deal.title}
                </h2>

                <p className="mt-2 text-sm text-gray-600">
                  {deal.meta_description || deal.description}
                </p>

                {locality?.name ? (
                  <p className="mt-3 text-xs font-medium text-blue-600">
                    {locality.name}, Jaipur
                  </p>
                ) : null}
              </a>
            );
          })}
        </div>
      )}
    </main>
  );
}
