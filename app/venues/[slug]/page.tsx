import { createServerSupabaseClient } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import EventCard from '@/components/EventCard';

function VenueSchema({
  venue,
  locality,
}: {
  venue: any;
  locality?: any;
}) {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Place',
    name: venue.name,
    description:
      venue.meta_description ||
      venue.description ||
      `${venue.name} is a venue in Jaipur.`,
    url: `${base}/venues/${venue.slug}`,
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

function VenueBreadcrumbSchema({
  venue,
  locality,
}: {
  venue: any;
  locality?: any;
}) {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const items: any[] = [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Venues',
      item: `${base}/events`,
    },
  ];

  if (locality?.slug) {
    items.push({
      '@type': 'ListItem',
      position: items.length + 1,
      name: locality.name,
      item: `${base}/jaipur/${locality.slug}`,
    });
  }

  items.push({
    '@type': 'ListItem',
    position: items.length + 1,
    name: venue.name,
    item: `${base}/venues/${venue.slug}`,
  });

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: items,
        }),
      }}
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

  const { data: venue } = await supabase
    .from('venues')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (!venue) return {};

  return {
    title: venue.meta_title || `${venue.name} - Venue in Jaipur`,
    description:
      venue.meta_description ||
      `Discover ${venue.name} in Jaipur with hosted events, venue details and nearby local discovery.`,
  };
}

export default async function VenuePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const supabase = createServerSupabaseClient();
  const { slug } = await params;

  const { data: venue } = await supabase
    .from('venues')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (!venue) return notFound();

  let locality: any = null;

  if (venue.locality_id) {
    const { data } = await supabase
      .from('localities')
      .select('*')
      .eq('id', venue.locality_id)
      .maybeSingle();

    locality = data || null;
  }

  const { data: events } = await supabase
    .from('events')
    .select('*')
    .eq('venue_id', venue.id)
    .order('start_time', { ascending: false });

  const eventIds = (events || []).map((e: any) => e.id);

  let categories: any[] = [];

  if (eventIds.length > 0) {
    const { data: eventCategoryLinks } = await supabase
      .from('event_categories')
      .select('category_id')
      .in('event_id', eventIds);

    const categoryIds = [...new Set((eventCategoryLinks || []).map((x: any) => x.category_id))];

    if (categoryIds.length > 0) {
      const { data: cats } = await supabase
        .from('categories')
        .select('*')
        .in('id', categoryIds);

      categories = cats || [];
    }
  }

  const upcomingEvents = (events || []).filter(
    (e: any) => e.status === 'upcoming' || e.status === 'ongoing'
  );
  const pastEvents = (events || []).filter((e: any) => e.status === 'past');

  return (
    <main className="max-w-6xl mx-auto px-4 md:px-6 py-10">
      <VenueSchema venue={venue} locality={locality} />
      <VenueBreadcrumbSchema venue={venue} locality={locality} />

      <section className="mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
          {venue.name}
        </h1>

        <p className="mt-3 text-gray-600 max-w-3xl leading-relaxed">
          {venue.meta_description ||
            venue.description ||
            `Discover ${venue.name} in Jaipur with hosted events, location details and nearby local discovery.`}
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
            <a
              key={category.id}
              href={`/categories/${category.slug}`}
              className="px-4 py-2 bg-gray-100 rounded-full hover:bg-gray-200 transition"
            >
              {category.name}
            </a>
          ))}
        </div>
      </section>

      <section className="mb-14">
        <h2 className="text-xl font-semibold mb-6">
          Upcoming Events at {venue.name}
        </h2>

        {upcomingEvents.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <p className="text-gray-700 font-medium">
              No upcoming events are listed for {venue.name} right now.
            </p>

            <p className="text-gray-500 mt-2">
              Explore past events at this venue or browse more events happening in Jaipur.
            </p>

            <div className="mt-4 flex flex-wrap gap-3">
              <a
                href="/events"
                className="px-4 py-2 bg-gray-100 rounded-full hover:bg-gray-200 text-sm"
              >
                Explore all events
              </a>

              {locality?.slug && (
                <a
                  href={`/jaipur/${locality.slug}`}
                  className="px-4 py-2 bg-gray-100 rounded-full hover:bg-gray-200 text-sm"
                >
                  Things to do in {locality.name}
                </a>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingEvents.map((event: any) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </section>

      <section className="mb-14">
        <h2 className="text-xl font-semibold mb-6">
          Past Events at {venue.name}
        </h2>

        {pastEvents.length === 0 ? (
          <p className="text-gray-500">No past events found yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pastEvents.map((event: any) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </section>

      <section className="border-t pt-10">
        <h2 className="text-xl font-semibold mb-4">
          Explore more
        </h2>

        <div className="flex flex-wrap gap-3 text-sm">
          <a
            href="/events"
            className="px-4 py-2 bg-gray-100 rounded-full hover:bg-gray-200"
          >
            Browse events
          </a>

          <a
            href="/categories"
            className="px-4 py-2 bg-gray-100 rounded-full hover:bg-gray-200"
          >
            Browse categories
          </a>

          {locality?.slug && (
            <a
              href={`/jaipur/${locality.slug}`}
              className="px-4 py-2 bg-gray-100 rounded-full hover:bg-gray-200"
            >
              Things to do in {locality.name}
            </a>
          )}
        </div>
      </section>
    </main>
  );
}
