import { notFound } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase';
import EventCard from '@/components/EventCard';
import { resolveCategorySlug, resolveLocalitySlug } from '@/lib/resolve-slugs';
import {
  buildEventParentLinks,
  buildHybridLinksForCategory,
  buildHybridLinksForLocality,
} from '@/lib/internal-linking';
import { getHybridSEO } from '@/lib/seo-content';

function isPublishedOrLegacyLive(event: any) {
  return !event?.editorial_status || event.editorial_status === 'published';
}

function resolveEventStatus(event: any) {
  if (event?.status) return event.status;

  const startValue = event?.start_time || event?.start_date;
  if (!startValue) return 'upcoming';

  const now = new Date();
  const start = new Date(startValue);

  if (Number.isNaN(start.getTime())) return 'upcoming';
  return start.getTime() < now.getTime() ? 'past' : 'upcoming';
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; locality: string }>;
}) {
  const supabase = createServerSupabaseClient();
  const { category, locality } = await params;

  const categoryResult = await resolveCategorySlug(supabase, category);
  const localityResult = await resolveLocalitySlug(supabase, locality);

  const resolvedCategory = categoryResult.category;
  const resolvedLocality = localityResult.locality;

  if (!resolvedCategory || !resolvedLocality) {
    return {
      title: 'Events in Jaipur',
      description: 'Browse events in Jaipur by category and locality.',
    };
  }

  return {
    title: `${resolvedCategory.name} in ${resolvedLocality.name}, Jaipur`,
    description: `Browse ${resolvedCategory.name.toLowerCase()} in ${resolvedLocality.name}, Jaipur. Explore upcoming events, local experiences, and related recommendations.`,
  };
}

export default async function HybridEventsPage({
  params,
}: {
  params: Promise<{ category: string; locality: string }>;
}) {
  const supabase = createServerSupabaseClient();
  const { category, locality } = await params;

  const categoryResult = await resolveCategorySlug(supabase, category);
  const localityResult = await resolveLocalitySlug(supabase, locality);

  const resolvedCategory = categoryResult.category;
  const resolvedLocality = localityResult.locality;

  if (!resolvedCategory || !resolvedLocality) {
    return notFound();
  }

  const { data: eventLinks } = await supabase
    .from('event_categories')
    .select('event_id')
    .eq('category_id', resolvedCategory.id);

  const eventIds = (eventLinks || []).map((row: any) => row.event_id);

  let rawEvents: any[] = [];

  if (eventIds.length > 0) {
    let query = supabase
      .from('events')
      .select('*')
      .in('id', eventIds)
      .order('start_time', { ascending: true })
      .limit(36);

    if (resolvedLocality?.id) {
      query = query.eq('locality_id', resolvedLocality.id);
    } else if (resolvedLocality?.slug) {
      query = query.eq('locality', resolvedLocality.slug);
    }

    const { data } = await query;
    rawEvents = data || [];
  }

  const { data: siblingCategories } = await supabase
    .from('categories')
    .select('*')
    .neq('id', resolvedCategory.id)
    .limit(8);

  const { data: siblingLocalities } = await supabase
    .from('localities')
    .select('*')
    .neq('id', resolvedLocality.id)
    .limit(8);

  const events = (rawEvents || [])
    .filter(isPublishedOrLegacyLive)
    .sort((a: any, b: any) => {
      const aStatus = resolveEventStatus(a);
      const bStatus = resolveEventStatus(b);

      if (aStatus === 'upcoming' && bStatus !== 'upcoming') return -1;
      if (aStatus !== 'upcoming' && bStatus === 'upcoming') return 1;

      const aDate = new Date(a.start_time || a.start_date || 0).getTime();
      const bDate = new Date(b.start_time || b.start_date || 0).getTime();

      return aDate - bDate;
    });

  const upcomingEvents = events.filter(
    (event: any) => resolveEventStatus(event) === 'upcoming'
  );
  const pastEvents = events.filter(
    (event: any) => resolveEventStatus(event) === 'past'
  );

  const parentLinks = buildEventParentLinks({
    category: resolvedCategory,
    locality: resolvedLocality,
    venue: null,
  });

  const sameLocalityOtherCategoryLinks = buildHybridLinksForLocality(
    resolvedLocality,
    siblingCategories || []
  ).slice(0, 6);

  const sameCategoryOtherLocalityLinks = buildHybridLinksForCategory(
    resolvedCategory,
    siblingLocalities || []
  ).slice(0, 6);

  const seo = getHybridSEO(resolvedCategory, resolvedLocality);

  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${resolvedCategory.name} in ${resolvedLocality.name}, Jaipur`,
    description: `Browse ${resolvedCategory.name.toLowerCase()} in ${resolvedLocality.name}, Jaipur.`,
    url: `https://www.jaipurcircle.com/events-in/${resolvedCategory.slug}/${resolvedLocality.slug}`,
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Events',
        item: 'https://www.jaipurcircle.com/events',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: resolvedCategory.name,
        item: `https://www.jaipurcircle.com/categories/${resolvedCategory.slug}`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: resolvedLocality.name,
        item: `https://www.jaipurcircle.com/jaipur/${resolvedLocality.slug}`,
      },
      {
        '@type': 'ListItem',
        position: 4,
        name: `${resolvedCategory.name} in ${resolvedLocality.name}`,
        item: `https://www.jaipurcircle.com/events-in/${resolvedCategory.slug}/${resolvedLocality.slug}`,
      },
    ],
  };

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: upcomingEvents.map((event: any, index: number) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: event.title,
      url: `https://www.jaipurcircle.com/events/${event.slug}`,
    })),
  };

  return (
    <main className="max-w-6xl mx-auto px-4 md:px-6 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />

      <section className="mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
          {resolvedCategory.name} in {resolvedLocality.name}, Jaipur
        </h1>

        <p className="mt-3 text-gray-600 max-w-3xl leading-relaxed">
          Discover {resolvedCategory.name.toLowerCase()} in {resolvedLocality.name}, Jaipur.
          This page brings together the most relevant upcoming events, past event history,
          and discovery links to help users explore this niche locally.
        </p>
      </section>

      {/* 🔥 SEO CONTENT BLOCK */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">
          About {resolvedCategory.name} in {resolvedLocality.name}
        </h2>

        <p className="text-gray-600 mb-4 leading-relaxed">
          {seo.intro}
        </p>

        <ul className="list-disc pl-5 text-gray-600 space-y-2">
          {seo.highlights.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>

        <p className="text-gray-600 mt-4 leading-relaxed">
          {seo.outro}
        </p>
      </section>

      {parentLinks.length > 0 && (
        <section className="mb-8">
          <div className="flex flex-wrap gap-3 text-sm">
            {parentLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="px-4 py-2 bg-gray-100 rounded-full text-gray-700 hover:bg-gray-200 transition"
              >
                {link.label}
              </a>
            ))}
          </div>
        </section>
      )}

      <section className="mb-10">
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Why this page matters
          </h2>
          <p className="text-gray-600 leading-relaxed">
            This is a persistent discovery page for people specifically looking for{' '}
            {resolvedCategory.name.toLowerCase()} in {resolvedLocality.name}. Even as individual
            events expire, the page remains useful by linking users to current and related options.
          </p>
        </div>
      </section>

      {upcomingEvents.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-6">
            Upcoming {resolvedCategory.name} in {resolvedLocality.name}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingEvents.map((event: any) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </section>
      )}

      {sameLocalityOtherCategoryLinks.length > 0 && (
        <section className="mb-12">
          <h2 className="text-lg font-semibold mb-4">
            Explore more in {resolvedLocality.name}
          </h2>

          <div className="flex flex-wrap gap-3 text-sm">
            {sameLocalityOtherCategoryLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="px-4 py-2 bg-gray-100 rounded-full text-gray-700 hover:bg-gray-200 transition"
              >
                {link.label}
              </a>
            ))}
          </div>
        </section>
      )}

      {sameCategoryOtherLocalityLinks.length > 0 && (
        <section className="mb-12">
          <h2 className="text-lg font-semibold mb-4">
            Explore {resolvedCategory.name} in other Jaipur areas
          </h2>

          <div className="flex flex-wrap gap-3 text-sm">
            {sameCategoryOtherLocalityLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="px-4 py-2 bg-gray-100 rounded-full text-gray-700 hover:bg-gray-200 transition"
              >
                {link.label}
              </a>
            ))}
          </div>
        </section>
      )}

      {pastEvents.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-6">
            Past {resolvedCategory.name} in {resolvedLocality.name}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pastEvents.slice(0, 9).map((event: any) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </section>
      )}

      {events.length === 0 && (
        <section className="mb-12">
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <p className="text-gray-700 font-medium">
              No events found right now for this combination.
            </p>
            <p className="text-gray-500 mt-2">
              Try browsing all {resolvedCategory.name.toLowerCase()} across Jaipur or explore more
              events in {resolvedLocality.name}.
            </p>
          </div>
        </section>
      )}
    </main>
  );
}
