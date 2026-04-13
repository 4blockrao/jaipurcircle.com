import type { MetadataRoute } from 'next';
import { BASE_URL } from '@/lib/config';

export default function robots(): MetadataRoute.Robots {
  const isProd = BASE_URL.startsWith('https://www.jaipurcircle.com');

  return {
    rules: isProd
      ? [
          {
            userAgent: '*',
            allow: '/',
            disallow: [
              '/api/',
              '/admin/',
              '/_next/',
            ],
          },
        ]
      : [
          {
            userAgent: '*',
            disallow: '/',
          },
        ],
    sitemap: isProd ? `${BASE_URL}/sitemap.xml` : undefined,
    host: isProd ? BASE_URL : undefined,
  };
}
