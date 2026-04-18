import { createServerSupabaseClient } from '@/lib/supabase';

export async function GET() {
  const supabase = createServerSupabaseClient();
  const base = 'https://jaipurcircle.com';

  const { data, error } = await supabase
    .from('localities')
    .select('slug, updated_at')
    .eq('should_index', true)
    .limit(5000);

  if (error) {
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?>
<error>
  <message>${String(error.message || 'Unknown error')}</message>
</error>`,
      {
        status: 500,
        headers: { 'Content-Type': 'application/xml; charset=utf-8' },
      }
    );
  }

  const urls = (data || [])
    .filter((row: any) => row?.slug)
    .map(
      (row: any) => `<url>
  <loc>${base}/jaipur/${row.slug}</loc>
  <lastmod>${new Date(row.updated_at || Date.now()).toISOString()}</lastmod>
</url>`
    )
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
}
