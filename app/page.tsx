import { createServerSupabaseClient } from '@/lib/supabase';
import Script from 'next/script';

export default async function HomePage() {
  const supabase = createServerSupabaseClient();

  // Fetch homepage data
  const { data: events } = await supabase
    .from('events')
    .select('id, title, slug')
    .eq('is_indexable', true)
    .limit(10);

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, slug')
    .eq('is_indexable', true)
    .limit(10);

  const { data: localities } = await supabase
    .from('localities')
    .select('id, name, slug')
    .eq('is_indexable', true)
    .limit(10);

  return (
    <>
      {/* ✅ EVENT LIST SCHEMA */}
      <Script
        id="homepage-events-schema"
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
        <h1>Jaipur Events & Things to Do</h1>
        <p>Discover the latest events, venues and experiences happening across Jaipur.</p>

        {/* EVENTS */}
        <div style={{ marginTop: 40 }}>
          <h2>Latest Events in Jaipur</h2>
          <ul>
            {events?.map((e: any) => (
              <li key={e.id}>
                <a href={`/events/${e.slug}`}>{e.title}</a>
              </li>
            ))}
          </ul>
        </div>

        {/* CATEGORIES */}
        <div style={{ marginTop: 40 }}>
          <h2>Explore Event Categories</h2>
          <ul>
            {categories?.map((c: any) => (
              <li key={c.id}>
                <a href={`/categories/${c.slug}`}>{c.name}</a>
              </li>
            ))}
          </ul>
        </div>

        {/* LOCALITIES */}
        <div style={{ marginTop: 40 }}>
          <h2>Popular Areas in Jaipur</h2>
          <ul>
            {localities?.map((l: any) => (
              <li key={l.id}>
                <a href={`/jaipur/${l.slug}`}>{l.name}</a>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </>
  );
}
