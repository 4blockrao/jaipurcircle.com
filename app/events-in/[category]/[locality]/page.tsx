import { createServerSupabaseClient } from '@/lib/supabase';
import { resolveCategorySlug, resolveLocalitySlug } from '@/lib/resolve-slugs';
import { notFound, redirect } from 'next/navigation';
import EventCard from '@/components/EventCard';
import { BASE_URL } from '@/lib/config';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; locality: string }>;
}) {
  const supabase = createServerSupabaseClient();
  const { category, locality } = await params;

  if (category === 'in') {
    const localityResolved = await resolveLocalitySlug(supabase, locality);
    if (localityResolved.locality) {
      return {
        title: `Things to do in ${localityResolved.locality.name}, Jaipur`,
        description:
          localityResolved.locality.meta_description ||
          `Explore events, venues and things to do in ${localityResolved.locality.name}, Jaipur.`,
        alternates: {
          canonical: `${BASE_URL}/jaipur/${localityResolved.locality.slug}`,
        },
      };
    }
    return {};
  }

  const { category: cat } = await resolveCategorySlug(supabase, category);
  const { locality: loc } = await resolveLocalitySlug(supabase, locality);

  if (!cat || !loc) return {};

  return {
    title: `${cat.name} in ${loc.name}, Jaipur`,
    description: `Explore ${cat.name.toLowerCase()} in ${loc.name}, Jaipur. Find upcoming events, venues, and local experiences.`,
    alternates: {
      canonical: `${BASE_URL}/events-in/${cat.slug}/${loc.slug}`,
    },
  };
}

export default async function HybridPage({
  params,
}: {
  params: Promise<{ category: string; locality: string }>;
}) {
  const supabase = createServerSupabaseClient();
  const { category, locality } = await params;

  // Safety fallback for bad legacy path like /events-in/in/raja-park-market
  if (category === 'in') {
    const localityResolved = await resolveLocalitySlug(supabase, locality);

    if (!localityResolved.locality || !localityResolved.canonicalSlug) {
      return notFound();
    }

    redirect(`/jaipur/${localityResolved.canonicalSlug}`);
  }

  const categoryResolved = await resolveCategorySlug(supabase, category);
  const localityResolved = await resolveLocalitySlug(supabase, locality);

  const cat = categoryResolved.category;
  const loc = localityResolved.locality;

  if (!cat || !loc) return notFound();

  if (
    (categoryResolved.wasAlias && categoryResolved.canonicalSlug !== category) ||
    (localityResolved.wasAlias && localityResolved.canonicalSlug !== locality)
  ) {
    redirect(`/events-in/${categoryResolved.canonicalSlug}/${localityResolved.canonicalSlug}`);
  }

  const { data: eventLinks } = await supabase
    .from('event_categories')
    .select('event_id')
    .eq('category_id', cat.id);

  const eventIds = (eventLinks || []).map((x: any) => x.event_id);

  let events: any[] = [];

  if (eventIds.length > 0) {
    const { data: matchedEvents } = await supabase
      .from('events')
      .select('*')
      .in('id', eventIds)
      .eq('locality_id', loc.id)
      .order('start_time', { ascending: true });

    events = matchedEvents || [];
  }

  return (
    <main className="max-w-6xl mx-auto px-4 md:px-6 py-10">
      <section className="mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
          {cat.name} in {loc.name}, Jaipur
        </h1>

        <p className="mt-3 text-gray-600 max-w-3xl leading-relaxed">
          Discover the best {cat.name.toLowerCase()} happening in {loc.name}. Explore upcoming events,
          venues, and local experiences.
        </p>
      </section>

      <section className="mb-14">
        <h2 className="text-xl font-semibold mb-6">
          Upcoming {cat.name} in {loc.name}
        </h2>

        {events.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <p className="text-gray-700 font-medium">
              No {cat.name.toLowerCase()} are listed in {loc.name} right now.
            </p>
            <p className="text-gray-500 mt-2">
              Check back soon, or explore all {cat.name.toLowerCase()} in Jaipur and more things to do in {loc.name}.
            </p>

            <div className="mt-4 flex flex-wrap gap-3">
              <a
                href={`/categories/${cat.slug}`}
                className="px-4 py-2 bg-gray-100 rounded-full hover:bg-gray-200 text-sm"
              >
                All {cat.name} in Jaipur
              </a>

              <a
                href={`/jaipur/${loc.slug}`}
                className="px-4 py-2 bg-gray-100 rounded-full hover:bg-gray-200 text-sm"
              >
                Things to do in {loc.name}
              </a>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((e: any) => (
              <EventCard key={e.id} event={e} />
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
            href={`/categories/${cat.slug}`}
            className="px-4 py-2 bg-gray-100 rounded-full hover:bg-gray-200"
          >
            All {cat.name} in Jaipur
          </a>

          <a
            href={`/jaipur/${loc.slug}`}
            className="px-4 py-2 bg-gray-100 rounded-full hover:bg-gray-200"
          >
            Things to do in {loc.name}
          </a>
        </div>
      </section>
    </main>
  );
}

{/* 🔗 Navigation */}
<div className="text-sm text-gray-500 mb-4 flex gap-3 flex-wrap">
  <a href={`/categories/${category.slug}`} className="underline">
    All {category.name}
  </a>

  <a href={`/jaipur/${locality.slug}`} className="underline">
    All in {locality.name}
  </a>
</div>


{/* 🧠 Hybrid SEO */}
<section className="mt-10 text-sm text-gray-600 leading-relaxed">
  <h2 className="text-lg font-semibold mb-2">
    {category.name} in {locality.name}
  </h2>

  <p>
    Explore the best {category.name.toLowerCase()} events happening in {locality.name}, Jaipur.
    Find curated listings, upcoming events, and trending experiences all in one place.
  </p>

  <p className="mt-2">
    Stay updated with what’s happening in {locality.name} and never miss out on
    exciting {category.name.toLowerCase()} events near you.
  </p>
</section>

