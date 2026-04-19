export async function GET() {
  const base = 'https://jaipurcircle.com';

  const sitemaps = [
    '/sitemap-events.xml',
    '/sitemap-localities.xml',
    '/sitemap-deals.xml',
    '/sitemap-artists.xml',
    '/sitemap-stories.xml',
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
  <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${sitemaps
      .map(
        (sm) => `
      <sitemap>
        <loc>${base}${sm}</loc>
      </sitemap>`
      )
      .join('')}
  </sitemapindex>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml' },
  });
}
