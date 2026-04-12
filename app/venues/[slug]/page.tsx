import { notFound } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase';
import Script from 'next/script';

export default async function VenuePage({ params }: any) {
  const { slug } = await params;

  if (!slug) return notFound();

  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase.rpc('get_venue_page', {
    p_slug: slug,
  });

  console.log('VENUE DEBUG', { slug, data, error });

  if (error || !data || !data.venue) {
    console.error('❌ VENUE ERROR:', error);
    return notFound();
  }

  const { venue, events, locality, categories } = data;

  return (
    <>
      <Script
        id="venue-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Place",
            name: venue.name,
            description: venue.meta_description || venue.name,
            address: venue.address,
            url: `https://www.jaipurcircle.com/venues/${venue.slug}`,
          }),
        }}
      />

      <Script
        id="venue-event-list"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            itemListElement: (events || []).map((e: any, i: number) => ({
              "@type": "ListItem",
              position: i + 1,
              url: `https://www.jaipurcircle.com/events/${e.slug}`,
              name: e.title,
            })),
          }),
        }}
      />

      <main style={{ maxWidth: 900, margin: '40px auto', padding: 20 }}>
        <h1>{venue.name}</h1>
        <p>{venue.meta_description}</p>

        {locality && (
          <p>
            📍 <a href={`/jaipur/${locality.slug}`}>{locality.name}</a>
          </p>
        )}

        <div style={{ marginTop: 40 }}>
          <h2>Events at {venue.name}</h2>
          <ul>
            {events?.map((e: any) => (
              <li key={e.id}>
                <a href={`/events/${e.slug}`}>{e.title}</a>
              </li>
            ))}
          </ul>
        </div>

        <div style={{ marginTop: 40 }}>
          <h2>Explore Categories</h2>
          <ul>
            {categories?.map((c: any) => (
              <li key={c.id}>
                <a href={`/categories/${c.slug}`}>{c.name}</a>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </>
  );
}
