import { notFound } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase';
import Script from 'next/script';

export default async function CategoryPage({ params }: any) {
  const { slug } = await params;

  if (!slug) return notFound();

  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase.rpc('get_category_page', {
    p_slug: slug,
  });

  if (error || !data || !data.category) {
    console.error('❌ RPC ERROR:', error);
    return notFound();
  }

  const { category, events, top_localities } = data;

  return (
    <>
      {/* ✅ CATEGORY ITEM LIST SCHEMA */}
      <Script
        id="category-schema"
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
        <h1>{category.name}</h1>
        <p>{category.meta_description}</p>

        {/* EVENTS */}
        <div style={{ marginTop: 40 }}>
          <h2>Upcoming {category.name} Events in Jaipur</h2>
          <ul>
            {events?.map((e: any) => (
              <li key={e.id}>
                <a href={`/events/${e.slug}`}>{e.title}</a>
              </li>
            ))}
          </ul>
        </div>

        {/* LOCALITIES */}
        <div style={{ marginTop: 40 }}>
          <h2>Popular Areas for {category.name}</h2>
          <ul>
            {top_localities?.map((l: any) => (
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
