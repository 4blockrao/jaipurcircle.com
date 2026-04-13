import { createServerSupabaseClient } from '@/lib/supabase';
import { resolveCategorySlug } from '@/lib/resolve-slugs';
import { notFound, redirect } from 'next/navigation';
import EventCard from '@/components/EventCard';

function CategorySchema({ category }: { category: any }) {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${category.name} in Jaipur`,
    description:
      category.meta_description ||
      `Explore ${category.name.toLowerCase()} in Jaipur.`,
    url: `${base}/categories/${category.slug}`,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

function CategoryBreadcrumbSchema({ category }: { category: any }) {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Categories',
        item: `${base}/categories`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: category.name,
        item: `${base}/categories/${category.slug}`,
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

  const { category } = await resolveCategorySlug(supabase, slug);

  if (!category) return {};

  return {
    title: category.meta_title || `${category.name} in Jaipur`,
    description:
      category.meta_description ||
      `Explore ${category.name.toLowerCase()} in Jaipur.`,
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const supabase = createServerSupabaseClient();
  const { slug } = await params;

  const { category, canonicalSlug, wasAlias } = await resolveCategorySlug(
    supabase,
    slug
  );

  if (!category || !canonicalSlug) return notFound();

  if (wasAlias && canonicalSlug !== slug) {
    redirect(`/categories/${canonicalSlug}`);
  }

  const { data: eventLinks } = await supabase
    .from('event_categories')
    .select('event_id')
    .eq('category_id', category.id);

  const eventIds = (eventLinks || []).map((x: any) => x.event_id);

  let events: any[] = [];

  if (eventIds.length > 0) {
    const { data } = await supabase
      .from('events')
      .select('*')
      .in('id', eventIds)
      .order('start_time', { ascending: true });

    events = data || [];
  }

  const { data: localities } = await supabase
    .from('localities')
    .select('*')
    .eq('is_indexable', true)
    .order('quality_score', { ascending: false })
    .limit(8);

  const featuredLocalitySlugs = [
    'vaishali-nagar',
    'malviya-nagar',
    'c-scheme',
    'mansarovar',
    'jagatpura',
  ];

  return (
    <main className="max-w-6xl mx-auto px-4 md:px-6 py-10">
      <CategorySchema category={category} />
      <CategoryBreadcrumbSchema category={category} />

      <section className="mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
          {category.name} in Jaipur
        </h1>

        <p className="mt-3 text-gray-600 max-w-3xl leading-relaxed">
          {category.meta_description ||
            `Explore the best ${category.name.toLowerCase()} happening across Jaipur, including upcoming events, local venues, and popular areas.`}
        </p>
      </section>

      {localities && localities.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">
            Explore {category.name} by locality
          </h2>

          <div className="flex flex-wrap gap-3">
            {localities.map((loc: any) => (
              <a
                key={loc.id}
                href={`/events-in/${category.slug}/${loc.slug}`}
                className="px-4 py-2 bg-gray-100 rounded-full text-sm text-gray-700 hover:bg-gray-200 transition"
              >
                {category.name} in {loc.name}
              </a>
            ))}
          </div>
        </section>
      )}

      <section className="mb-14">
        <h2 className="text-xl font-semibold mb-6">
          Upcoming {category.name} Events in Jaipur
        </h2>

        {events.length === 0 ? (
          <p className="text-gray-500">No events found in this category yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((e: any) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-bold mb-3">Explore by Area</h2>
        <div className="flex flex-wrap gap-3">
          {featuredLocalitySlugs.map((l) => (
            <a
              key={l}
              href={`/events-in/${category.slug}/${l}`}
              className="px-3 py-1 bg-gray-100 rounded text-sm"
            >
              {category.name} in {l.replace(/-/g, ' ')}
            </a>
          ))}
        </div>
      </section>

      <section className="mt-10 text-sm text-gray-600 leading-relaxed">
        <h2 className="text-lg font-semibold mb-2">
          {category.name} Events in Jaipur
        </h2>

        <p>
          Discover the best {category.name.toLowerCase()} events happening across Jaipur.
          From top venues to upcoming performances, JaipurCircle helps you explore,
          compare, and attend the most relevant experiences in your city.
        </p>

        <p className="mt-2">
          Browse events by locality, date, and popularity to find what fits your plan.
        </p>
      </section>
    </main>
  );
}
