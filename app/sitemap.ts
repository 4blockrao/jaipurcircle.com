import type { MetadataRoute } from 'next';
import { createServerSupabaseClient } from '@/lib/supabase';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createServerSupabaseClient();
  const base = 'https://jaipurcircle.com';

  const [eventsRes, localitiesRes, dealsRes] = await Promise.all([
    supabase
      .from('events')
      .select('slug, updated_at')
      .eq('editorial_status', 'published')
      .limit(5000),

    supabase
      .from('localities')
      .select('slug, updated_at')
      .eq('should_index', true)
      .limit(5000),

    supabase
      .from('deals')
      .select('slug, updated_at')
      .eq('editorial_status', 'published')
      .eq('is_indexable', true)
      .limit(5000),
  ]);

  const events = (eventsRes.data || [])
    .filter((row: any) => row?.slug)
    .map((row: any) => ({
      url: `${base}/events/${row.slug}`,
      lastModified: row.updated_at ? new Date(row.updated_at) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

  const localities = (localitiesRes.data || [])
    .filter((row: any) => row?.slug)
    .map((row: any) => ({
      url: `${base}/jaipur/${row.slug}`,
      lastModified: row.updated_at ? new Date(row.updated_at) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

  const deals = (dealsRes.data || [])
    .filter((row: any) => row?.slug)
    .map((row: any) => ({
      url: `${base}/deal/${row.slug}`,
      lastModified: row.updated_at ? new Date(row.updated_at) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));

  return [
    {
      url: `${base}/`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${base}/events`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.6,
    },
    {
      url: `${base}/deals`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.5,
    },
    ...events,
    ...localities,
    ...deals,
  ];
}
