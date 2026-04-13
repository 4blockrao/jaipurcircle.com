import { createServerSupabaseClient } from '@/lib/supabase';
import { resolveLocalitySlug } from '@/lib/resolve-slugs';
import { notFound, redirect } from 'next/navigation';
import EventCard from '@/components/EventCard';

function LocalitySchema({ locality }: { locality: any }) {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Place',
    name: locality.name,
    description:
      locality.meta_description ||
      locality.seo_blurb ||
      `Explore ${locality.name}, Jaipur.`,
    url: `${base}/jaipur/${locality.slug}`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: locality.name,
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

function LocalityBreadcrumbSchema({ locality }: { locality: any }) {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Jaipur',
        item: `${base}/events`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: locality.name,
        item: `${base}/jaipur/${locality.slug}`,
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

  const { locality } = await resolveLocalitySlug(supabase, slug);

  if (!locality) return {};

  return {
    title: locality.meta_title || `Things to do in ${locality.name}, Jaipur`,
    description:
      locality.meta_description ||
      `Explore events, venues, merchants, deals and things to do in ${locality.name}, Jaipur.`,
  };
}

export default async function LocalityPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const supabase = createServerSupabaseClient();
  const { slug } = await params;

  const { locality, canonicalSlug, wasAlias } = await resolveLocalitySlug(
    supabase,
    slug
  );

  if (!locality || !canonicalSlug) return notFound();

  if (wasAlias && canonicalSlug !== slug) {
    redirect(`/jaipur/${canonicalSlug}`);
  }

  const { data: events } = await supabase
    .from('events')
    .select('*')
    .eq('locality_id', locality.id)
    .order('start_time', { ascending: true })
    .limit(12);

  const { data: venues } = await supabase
    .from('venues')
    .select('*')
    .eq('locality_id', locality.id)
    .limit(6);

  const { data: merchants } = await supabase
    .from('merchants')
    .select('*')
    .eq('locality_id', locality.id)
    .eq('is_indexable', true)
    .limit(6);

  const { data: deals } = await supabase
    .from('deals')
    .select('*')
    .eq('locality_id', locality.id)
    .eq('is_indexable', true)
    .limit(6);

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('is_indexable', true)
    .limit(8);

  const featuredCategorySlugs = [
    'comedy-shows',
    'music-events',
    'workshops',
    'nightlife',
    'food-festivals',
    'art-culture',
  ];

  return (
    <main className="max-w-6xl mx-auto px-4 md:px-6 py-10">
      <LocalitySchema locality={locality} />
      <LocalityBreadcrumbSchema locality={locality} />

      <section className="mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
          Things to do in {locality.name}
        </h1>

        <p className="mt-3 text-gray-600 max-w-3xl leading-relaxed">
          {locality.meta_description || locality.seo_blurb}
        </p>
      </section>

      {categories && categories.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">
            Explore categories in {locality.name}
          </h2>

          <div className="flex flex-wrap gap-3">
            {categories.map((cat: any) => (
              <a
                key={cat.id}
                href={`/events-in/${cat.slug}/${locality.slug}`}
                className="px-4 py-2 bg-gray-100 rounded-full text-sm text-gray-700 hover:bg-gray-200 transition"
              >
                {cat.name} in {locality.name}
              </a>
            ))}
          </div>
        </section>
      )}

      <section className="mb-14">
        <h2 className="text-xl font-semibold mb-6">
          Upcoming Events in {locality.name}
        </h2>

        {!events || events.length === 0 ? (
          <p className="text-gray-500">No events found in this locality yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event: any) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </section>

      <section className="mb-14">
        <h2 className="text-xl font-semibold mb-6">
          Popular Venues in {locality.name}
        </h2>

        {!venues || venues.length === 0 ? (
          <p className="text-gray-500">No venues found in this locality yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {venues.map((venue: any) => (
              <a
                key={venue.id}
                href={`/venues/${venue.slug}`}
                className="block bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md transition"
              >
                <h3 className="text-lg font-semibold text-gray-900">
                  {venue.name}
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  {venue.meta_description ||
                    venue.description ||
                    `Discover ${venue.name} in ${locality.name}, Jaipur.`}
                </p>
              </a>
            ))}
          </div>
        )}
      </section>

      <section className="mb-14">
        <h2 className="text-xl font-semibold mb-6">
          Merchants in {locality.name}
        </h2>

        {!merchants || merchants.length === 0 ? (
          <p className="text-gray-500">No merchants found in this locality yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {merchants.map((merchant: any) => (
              <a
                key={merchant.id}
                href={`/merchant/${merchant.slug}`}
                className="block bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md transition"
              >
                <h3 className="text-lg font-semibold text-gray-900">
                  {merchant.name}
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  {merchant.meta_description || merchant.description}
                </p>
              </a>
            ))}
          </div>
        )}
      </section>

      <section className="mb-14">
        <h2 className="text-xl font-semibold mb-6">
          Deals in {locality.name}
        </h2>

        {!deals || deals.length === 0 ? (
          <p className="text-gray-500">No deals found in this locality yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

      <section className="mt-8">
        <h2 className="text-xl font-bold mb-3">Explore by Category</h2>
        <div className="flex flex-wrap gap-3">
          {featuredCategorySlugs.map((c) => (
            <a
              key={c}
              href={`/events-in/${c}/${locality.slug}`}
              className="px-3 py-1 bg-gray-100 rounded text-sm"
            >
              {c.replace(/-/g, ' ')} in {locality.name}
            </a>
          ))}
        </div>
      </section>

      <section className="mt-10 text-sm text-gray-600 leading-relaxed">
        <h2 className="text-lg font-semibold mb-2">
          Things to Do in {locality.name}
        </h2>

        <p>
          {locality.name} is one of Jaipur’s most active areas for events, nightlife,
          workshops, and cultural experiences. Discover curated events, popular venues,
          and trending activities happening in this locality.
        </p>

        <p className="mt-2">
          JaipurCircle helps you explore everything happening in {locality.name},
          from live shows to social gatherings and community events.
        </p>
      </section>

      <section className="border-t pt-10 mt-10">
        <h2 className="text-xl font-semibold mb-4">
          About {locality.name}, Jaipur
        </h2>

        <div className="max-w-3xl text-gray-600 space-y-4 leading-relaxed">
          <p>
            {locality.name} is an active part of Jaipur’s discovery landscape, bringing together local events,
            venues, merchants and commercial offers in one place.
          </p>

          <p>
            This locality hub is designed to help users discover what is happening nearby and navigate deeper
            into Jaipur’s event and local commerce graph.
          </p>
        </div>
      </section>
    </main>
  );
}
