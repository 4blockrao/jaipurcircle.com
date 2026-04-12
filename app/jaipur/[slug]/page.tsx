import { notFound } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase';
import Script from 'next/script';

export default async function LocalityPage({ params }: any) {
  const { slug } = await params;

  if (!slug) {
    console.error('❌ Missing locality slug');
    return notFound();
  }

  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase.rpc('get_locality_page', {
    p_slug: slug,
  });

  console.log('LOCALITY DEBUG', { slug, data, error });

  // 🚨 IMPORTANT: Only 404 if STRICTLY no data
  if (error || !data || !data.locality) {
    console.error('❌ LOCALITY ERROR:', error);
    return notFound();
  }

  const { locality, events, venues, categories } = data;

  return (
    <>
      {/* ✅ PLACE SCHEMA */}
      <Script
        id="place-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Place",
            name: locality.name,
            description: locality.seo_blurb,
            url: `https://www.jaipurcircle.com/jaipur/${locality.slug}`,
          }),
        }}
      />

      {/* ✅ EVENT LIST SCHEMA */}
      <Script
        id="event-list-schema"
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
        <h1>{locality.name}</h1>
        <p>{locality.seo_blurb}</p>

        {/* EVENTS */}
        <div style={{ marginTop: 40 }}>
          <h2>Things to Do in {locality.name}</h2>
          <ul>
            {events?.map((e: any) => (
              <li key={e.id}>
                <a href={`/events/${e.slug}`}>{e.title}</a>
              </li>
            ))}
          </ul>
        </div>

        {/* VENUES */}
        <div style={{ marginTop: 40 }}>
          <h2>Popular Venues in {locality.name}</h2>
          <ul>
            {venues?.map((v: any) => (
              <li key={v.id}>
                <a href={`/venues/${v.slug}`}>{v.name}</a>
              </li>
            ))}
          </ul>
        </div>

        {/* CATEGORIES */}
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
