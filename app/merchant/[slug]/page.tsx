import { createServerSupabaseClient } from '@/lib/supabase';
import { notFound } from 'next/navigation';

function MerchantSchema({
  merchant,
  locality,
}: {
  merchant: any;
  locality?: any;
}) {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: merchant.name,
    description:
      merchant.meta_description ||
      merchant.description ||
      `${merchant.name} business profile in Jaipur.`,
    url: `${base}/merchant/${merchant.slug}`,
    image: merchant.image_url || undefined,
    address: {
      '@type': 'PostalAddress',
      addressLocality: locality?.name || 'Jaipur',
      addressRegion: 'Rajasthan',
      addressCountry: 'IN',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

function MerchantBreadcrumbSchema({ merchant }: { merchant: any }) {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Merchants',
        item: `${base}/merchants`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: merchant.name,
        item: `${base}/merchant/${merchant.slug}`,
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const supabase = createServerSupabaseClient();
  const { slug } = await params;

  const { data: merchant } = await supabase
    .from('merchants')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (!merchant) return {};

  return {
    title: merchant.meta_title || `${merchant.name} - Merchant in Jaipur`,
    description:
      merchant.meta_description ||
      `Discover ${merchant.name}, offers and local business context in Jaipur.`,
  };
}

export default async function MerchantPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const supabase = createServerSupabaseClient();
  const { slug } = await params;

  const { data: merchant } = await supabase
    .from('merchants')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (!merchant) return notFound();

  let locality: any = null;
  if (merchant.locality_id) {
    const { data } = await supabase
      .from('localities')
      .select('*')
      .eq('id', merchant.locality_id)
      .maybeSingle();

    locality = data || null;
  }

  const { data: categoryLinks } = await supabase
    .from('merchant_category_links')
    .select('merchant_category_id')
    .eq('merchant_id', merchant.id);

  let categories: any[] = [];
  const categoryIds = (categoryLinks || []).map((x: any) => x.merchant_category_id);

  if (categoryIds.length > 0) {
    const { data } = await supabase
      .from('merchant_categories')
      .select('*')
      .in('id', categoryIds);

    categories = data || [];
  }

  const { data: deals } = await supabase
    .from('deals')
    .select('*')
    .eq('merchant_id', merchant.id)
    .eq('is_indexable', true)
    .order('created_at', { ascending: false });

  return (
    <main className="max-w-6xl mx-auto px-4 md:px-6 py-10">
      <MerchantSchema merchant={merchant} locality={locality} />
      <MerchantBreadcrumbSchema merchant={merchant} />

      <section className="mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
          {merchant.name}
        </h1>

        <p className="mt-3 text-gray-600 max-w-3xl leading-relaxed">
          {merchant.meta_description || merchant.description}
        </p>

        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          {locality?.slug && (
            <a
              href={`/jaipur/${locality.slug}`}
              className="px-4 py-2 bg-gray-100 rounded-full hover:bg-gray-200 transition"
            >
              {locality.name}
            </a>
          )}

          {categories.map((category: any) => (
            <span
              key={category.id}
              className="px-4 py-2 bg-gray-100 rounded-full"
            >
              {category.name}
            </span>
          ))}
        </div>
      </section>

      <section className="mb-14">
        <h2 className="text-xl font-semibold mb-6">
          Available Deals
        </h2>

        {!deals || deals.length === 0 ? (
          <p className="text-gray-500">No deals available right now.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {deals.map((deal: any) => (
              <a
                key={deal.id}
                href={`/deal/${deal.slug}`}
                className="block bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md transition"
              >
                <h3 className="text-lg font-semibold text-gray-900">
                  {deal.title}
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  {deal.meta_description || deal.description}
                </p>
              </a>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
