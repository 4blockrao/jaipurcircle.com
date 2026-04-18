import { notFound, redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase';
import EventCard from '@/components/EventCard';
import { resolveCategorySlug, resolveLocalitySlug } from '@/lib/resolve-slugs';

function parseEventDate(event: any) {
  const value = event?.start_time || event?.start_date;
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isUpcomingEvent(event: any) {
  const date = parseEventDate(event);
  if (!date) return false;
  return date >= new Date();
}

function sortEvents(items: any[]) {
  const now = new Date();

  return [...(items || [])].sort((a: any, b: any) => {
    const aDate = parseEventDate(a);
    const bDate = parseEventDate(b);

    if (!aDate && !bDate) return 0;
    if (!aDate) return 1;
    if (!bDate) return -1;

    const aUpcoming = aDate >= now;
    const bUpcoming = bDate >= now;

    if (aUpcoming && !bUpcoming) return -1;
    if (!aUpcoming && bUpcoming) return 1;

    if (aUpcoming && bUpcoming) return aDate.getTime() - bDate.getTime();
    return bDate.getTime() - aDate.getTime();
  });
}

function buildIntro(categoryName: string, localityName: string) {
  const key = categoryName.toLowerCase();

  if (key === 'news') {
    return `Explore locality-linked news, updates, and discovery related to ${localityName}, Jaipur.`;
  }

  if (key === 'shopping') {
    return `Explore shopping-related discovery, deals, and local commercial highlights in ${localityName}, Jaipur.`;
  }

  if (key === 'events') {
    return `Explore upcoming and previously listed events connected to ${localityName}, Jaipur.`;
  }

  return `Explore ${categoryName.toLowerCase()} in ${localityName}, Jaipur through JaipurCircle’s structured locality discovery layer.`;
}

export async function generateMetadata(props: any) {
  const params = await props.params;
  const incomingSlug = params?.slug;
  const incomingCategory = params?.category;

  if (!incomingSlug || !incomingCategory) return {};

  const supabase = createServerSupabaseClient();

  const localityResult = await resolveLocalitySlug(supabase, incomingSlug);
  const categoryResult = await resolveCategorySlug(supabase, incomingCategory);

  const locality = localityResult?.locality;
  const category = categoryResult?.category;

  if (!locality || !category) {
    return {
      title: 'Jaipur Discovery Page',
      description: 'Explore Jaipur category and locality pages.',
    };
  }

  return {
    title: `${category.name} in ${locality.name}, Jaipur`,
    description: buildIntro(category.name, locality.name),
  };
}

export default async function LocalityCategoryPage(props: any) {
  const params = await props.params;
  const incomingSlug = params?.slug;
  const incomingCategory = params?.category;

  if (!incomingSlug || !incomingCategory) return notFound();

  const supabase = createServerSupabaseClient();

  const localityResult = await resolveLocalitySlug(supabase, incomingSlug);
  const categoryResult = await resolveCategorySlug(supabase, incomingCategory);

  const locality = localityResult?.locality;
  const category = categoryResult?.category;

  if (!locality || !category) return notFound();

  const canonicalLocalitySlug = localityResult?.canonicalSlug || locality.slug;
  const canonicalCategorySlug = categoryResult?.canonicalSlug || category.slug;

  if (
    localityResult?.wasAlias ||
    categoryResult?.wasAlias ||
    canonicalLocalitySlug !== incomingSlug ||
    canonicalCategorySlug !== incomingCategory
  ) {
    redirect(`/jaipur/${canonicalLocalitySlug}/${canonicalCategorySlug}`);
  }

  const { data: pageRow } = await supabase
    .from('locality_category_pages')
    .select('*')
    .eq('locality_id', locality.id)
    .eq('category_id', category.id)
    .maybeSingle();

  let eventIdsByCategory: string[] = [];
  const { data: eventLinks } = await supabase
    .from('event_categories')
    .select('event_id')
    .eq('category_id', category.id);

  eventIdsByCategory = (eventLinks || []).map((x: any) => x.event_id);

  let events: any[] = [];
  if (eventIdsByCategory.length > 0) {
    const { data: eventsRaw } = await supabase
      .from('events')
      .select('*')
      .eq('editorial_status', 'published')
      .or(`locality_id.eq.${locality.id},locality.eq.${locality.slug}`)
      .in('id', eventIdsByCategory)
      .limit(60);

    events = sortEvents(eventsRaw || []);
  }

  const upcomingEvents = events.filter(isUpcomingEvent);
  const pastEvents = events.filter((event: any) => !isUpcomingEvent(event));

  let newsArticles: any[] = [];
  if (category.slug === 'news') {
    const { data: newsRaw } = await supabase
      .from('news')
      .select('*')
      .eq('is_indexable', true)
      .order('published_at', { ascending: false })
      .limit(24);

    newsArticles = (newsRaw || []).filter((article: any) => {
      const haystack = [
        article?.title,
        article?.meta_description,
        article?.description,
        article?.content,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return (
        haystack.includes(String(locality.name || '').toLowerCase()) ||
        haystack.includes(String(locality.slug || '').toLowerCase())
      );
    });
  }

  let deals: any[] = [];
  if (category.slug === 'shopping') {
    const { data: dealsRaw } = await supabase
      .from('deals')
      .select('*')
      .eq('is_indexable', true)
      .eq('editorial_status', 'published')
      .eq('locality_id', locality.id)
      .order('created_at', { ascending: false })
      .limit(24);

    deals = dealsRaw || [];
  }

  const title = pageRow?.title || `${category.name} in ${locality.name}, Jaipur`;
  const description =
    pageRow?.description ||
    buildIntro(category.name, locality.name);

  const showNews = category.slug === 'news';
  const showShopping = category.slug === 'shopping';
  const showEvents = category.slug === 'events';

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-6 pb-24">
      <nav className="mt-6 text-sm text-gray-500">
        <a href="/" className="hover:text-gray-800 transition">Home</a>
        <span className="mx-2">›</span>
        <a href="/jaipur" className="hover:text-gray-800 transition">Jaipur</a>
        <span className="mx-2">›</span>
        <a href={`/jaipur/${locality.slug}`} className="hover:text-gray-800 transition">{locality.name}</a>
        <span className="mx-2">›</span>
        <span className="text-gray-800">{category.name}</span>
      </nav>

      <section className="relative h-[280px] md:h-[360px] rounded-3xl overflow-hidden mt-4 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white">
        <div className="absolute inset-0 bg-black/10" />

        <div className="absolute top-5 left-5 flex flex-wrap gap-2">
          <span className="px-3 py-1.5 rounded-full bg-white/15 backdrop-blur text-white text-xs md:text-sm font-medium">
            Locality Category
          </span>

          {showEvents ? (
            <span className="px-3 py-1.5 rounded-full bg-emerald-500 text-white text-xs md:text-sm font-medium">
              {upcomingEvents.length} Upcoming
            </span>
          ) : null}

          {showNews ? (
            <span className="px-3 py-1.5 rounded-full bg-emerald-500 text-white text-xs md:text-sm font-medium">
              {newsArticles.length} Articles
            </span>
          ) : null}

          {showShopping ? (
            <span className="px-3 py-1.5 rounded-full bg-emerald-500 text-white text-xs md:text-sm font-medium">
              {deals.length} Deals
            </span>
          ) : null}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-5 md:p-8">
          <div className="max-w-4xl">
            <h1 className="text-3xl md:text-5xl font-bold leading-tight tracking-tight">
              {title}
            </h1>
            <p className="mt-3 text-sm md:text-base text-white/85 max-w-3xl leading-relaxed">
              {description}
            </p>
          </div>
        </div>
      </section>

      <section className="mt-8 grid grid-cols-1 lg:grid-cols-[1.55fr_0.9fr] gap-8">
        <div className="space-y-8">
          <section className="bg-white rounded-3xl border border-gray-200 p-6 md:p-8">
            <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-4">
              About this page
            </h2>
            <p className="text-gray-600 leading-relaxed text-sm md:text-base">
              This page helps users explore {category.name.toLowerCase()} in {locality.name}, Jaipur. It is part of JaipurCircle’s structured locality and category discovery system.
            </p>
          </section>

          {showNews ? (
            <section className="bg-white rounded-3xl border border-gray-200 p-6 md:p-8">
              <div className="flex items-center justify-between gap-4 mb-5">
                <h2 className="text-xl md:text-2xl font-semibold text-gray-900">
                  News related to {locality.name}
                </h2>
                <a href={`/jaipur/${locality.slug}`} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  Back to {locality.name}
                </a>
              </div>

              {newsArticles.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {newsArticles.map((article: any) => (
                    <a
                      key={article.id}
                      href={`/news/${article.category || 'city'}/${article.slug}`}
                      className="block rounded-2xl border border-gray-200 bg-white p-5 hover:shadow-md transition"
                    >
                      <h3 className="text-lg font-semibold text-gray-900">
                        {article.title}
                      </h3>
                      <p className="mt-2 text-sm text-gray-600">
                        {article.meta_description || article.description}
                      </p>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-sm text-gray-600">
                  No locality-linked news articles currently appear for {locality.name}. This page is live and ready as the local news layer expands.
                </div>
              )}
            </section>
          ) : null}

          {showShopping ? (
            <section className="bg-white rounded-3xl border border-gray-200 p-6 md:p-8">
              <div className="flex items-center justify-between gap-4 mb-5">
                <h2 className="text-xl md:text-2xl font-semibold text-gray-900">
                  Shopping deals in {locality.name}
                </h2>
                <a href={`/jaipur/${locality.slug}`} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  Back to {locality.name}
                </a>
              </div>

              {deals.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {deals.map((deal: any) => (
                    <a
                      key={deal.id}
                      href={`/deal/${deal.slug || deal.id}`}
                      className="block rounded-2xl border border-gray-200 bg-white p-5 hover:shadow-md transition"
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
              ) : (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-sm text-gray-600">
                  No shopping deals are currently mapped to {locality.name}. This page is live and ready as more deal data is added.
                </div>
              )}
            </section>
          ) : null}

          {showEvents || (!showNews && !showShopping) ? (
            <section className="bg-white rounded-3xl border border-gray-200 p-6 md:p-8">
              <div className="flex items-center justify-between gap-4 mb-5">
                <h2 className="text-xl md:text-2xl font-semibold text-gray-900">
                  {category.name} Related Events in {locality.name}
                </h2>
                <a href={`/jaipur/${locality.slug}`} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  Back to {locality.name}
                </a>
              </div>

              {events.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {events.slice(0, 12).map((event: any) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-sm text-gray-600">
                  No mapped event listings currently appear for this category in {locality.name}. This page is live and ready as the locality-category discovery layer expands.
                </div>
              )}
            </section>
          ) : null}

          {pastEvents.length > 0 && (showEvents || (!showNews && !showShopping)) ? (
            <section className="bg-white rounded-3xl border border-gray-200 p-6 md:p-8">
              <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-5">
                Previously Listed
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {pastEvents.slice(0, 6).map((event: any) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <aside className="space-y-6">
          <section className="bg-white rounded-3xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900">Quick Explore</h3>
            <div className="mt-4 flex flex-col gap-3">
              <a href={`/jaipur/${locality.slug}`} className="text-sm text-blue-600 hover:text-blue-700">
                {locality.name} Locality Hub
              </a>
              <a href={`/events?locality=${locality.slug}`} className="text-sm text-blue-600 hover:text-blue-700">
                Events in {locality.name}
              </a>
              {showShopping ? (
                <a href={`/deals?location=${locality.slug}`} className="text-sm text-blue-600 hover:text-blue-700">
                  Deals in {locality.name}
                </a>
              ) : null}
              {showNews ? (
                <a href="/news" className="text-sm text-blue-600 hover:text-blue-700">
                  All Jaipur News
                </a>
              ) : null}
              <a href="/events" className="text-sm text-blue-600 hover:text-blue-700">
                All Jaipur Events
              </a>
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
}
