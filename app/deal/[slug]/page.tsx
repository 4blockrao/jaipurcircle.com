import { createServerSupabaseClient } from '@/lib/supabase';
import { notFound } from 'next/navigation';

function DealSchema({
  deal,
  merchant,
  locality,
}: {
  deal: any;
  merchant?: any;
  locality?: any;
}) {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const isExpired =
    deal?.valid_until && new Date(deal.valid_until).getTime() < Date.now();

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Offer',
    name: deal.title,
    description:
      deal.meta_description || deal.description || deal.title,
    url: `${base}/deal/${deal.slug}`,
    availability: isExpired
      ? 'https://schema.org/SoldOut'
      : 'https://schema.org/InStock',
    seller: merchant
      ? {
          '@type': 'Organization',
          name: merchant.name,
          url: `${base}/merchant/${merchant.slug}`,
        }
      : undefined,
    areaServed: locality
      ? {
          '@type': 'Place',
          name: locality.name,
        }
      : undefined,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

function DealBreadcrumbSchema({ deal }: { deal: any }) {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Deals',
        item: `${base}/deals`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: deal.title,
        item: `${base}/deal/${deal.slug}`,
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

  const { data: deal } = await supabase
    .from('deals')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (!deal) return {};

  return {
    title: deal.meta_title || `${deal.title} - Deal in Jaipur`,
    description:
      deal.meta_description ||
      `Explore this deal in Jaipur and discover related local offers.`,
  };
}

export default async function DealPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const supabase = createServerSupabaseClient();
  const { slug } = await params;

  const { data: deal } = await supabase
    .from('deals')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (!deal) return notFound();

  let merchant: any = null;
  if (deal.merchant_id) {
    const { data } = await supabase
      .from('merchants')
      .select('*')
      .eq('id', deal.merchant_id)
      .maybeSingle();

    merchant = data || null;
  }

  let locality: any = null;
  if (deal.locality_id) {
    const { data } = await supabase
      .from('localities')
      .select('*')
      .eq('id', deal.locality_id)
      .maybeSingle();

    locality = data || null;
  }

  const isExpired =
    deal.valid_until && new Date(deal.valid_until).getTime() < Date.now();

  let relatedDeals: any[] = [];
  if (deal.locality_id) {
    const { data } = await supabase
      .from('deals')
      .select('*')
      .eq('locality_id', deal.locality_id)
      .neq('id', deal.id)
      .eq('is_indexable', true)
      .limit(6);

    relatedDeals = data || [];
  }

  return (
    <main className="max-w-5xl mx-auto px-4 md:px-6 py-10">
      <DealSchema deal={deal} merchant={merchant} locality={locality} />
      <DealBreadcrumbSchema deal={deal} />

      <section className="mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
          {deal.title}
        </h1>

        <p className="mt-3 text-gray-600 max-w-3xl leading-relaxed">
          {deal.meta_description || deal.description}
        </p>
      </section>

      {isExpired && (
        <section className="mb-8">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <p className="text-amber-900 font-medium">
              This deal is no longer available.
            </p>
            <p className="text-amber-800 mt-1 text-sm">
              Explore similar offers and local discovery options below.
            </p>
          </div>
        </section>
      )}

      <section className="mb-10">
        <div className="space-y-3 text-gray-700">
          <p>{deal.description}</p>

          {merchant?.slug && (
            <p>
              Merchant:{' '}
              <a
                href={`/merchant/${merchant.slug}`}
                className="text-blue-600 hover:underline"
              >
                {merchant.name}
              </a>
            </p>
          )}

          {locality?.slug && (
            <p>
              Locality:{' '}
              <a
                href={`/jaipur/${locality.slug}`}
                className="text-blue-600 hover:underline"
              >
                {locality.name}
              </a>
            </p>
          )}
        </div>
      </section>

      {relatedDeals.length > 0 && (
        <section className="mt-14">
          <h2 className="text-xl font-semibold mb-6">
            Similar Deals in {locality?.name || 'Jaipur'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {relatedDeals.map((item: any) => (
              <a
                key={item.id}
                href={`/deal/${item.slug}`}
                className="block bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md transition"
              >
                <h3 className="text-lg font-semibold text-gray-900">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  {item.meta_description || item.description}
                </p>
              </a>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
