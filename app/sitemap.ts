import { createServerSupabaseClient } from '@/lib/supabase';

export default async function sitemap() {
  const supabase = createServerSupabaseClient();

  const baseUrl = 'https://www.jaipurcircle.com';

  // Fetch all slugs
  const [
    { data: events },
    { data: localities },
    { data: categories },
    { data: venues },
  ] = await Promise.all([
    supabase.from('events').select('slug, updated_at').eq('is_indexable', true),
    supabase.from('localities').select('slug, updated_at').eq('is_indexable', true),
    supabase.from('categories').select('slug, updated_at').eq('is_indexable', true),
    supabase.from('venues').select('slug, updated_at').eq('status', 'published'),
  ]);

  const urls = [
    // Homepage
    {
      url: baseUrl,
      lastModified: new Date(),
    },

    // Events
    ...(events || []).map((e) => ({
      url: `${baseUrl}/events/${e.slug}`,
      lastModified: e.updated_at || new Date(),
    })),

    // Localities
    ...(localities || []).map((l) => ({
      url: `${baseUrl}/jaipur/${l.slug}`,
      lastModified: l.updated_at || new Date(),
    })),

    // Categories
    ...(categories || []).map((c) => ({
      url: `${baseUrl}/categories/${c.slug}`,
      lastModified: c.updated_at || new Date(),
    })),

    // Venues
    ...(venues || []).map((v) => ({
      url: `${baseUrl}/venues/${v.slug}`,
      lastModified: v.updated_at || new Date(),
    })),
  ];

  return urls;
}
