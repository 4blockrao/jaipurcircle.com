import { createServerSupabaseClient } from '@/lib/supabase';
import { BASE_URL } from '@/lib/config';

export default async function sitemap() {
  const supabase = createServerSupabaseClient();

  const { data: events } = await supabase.from('events').select('slug');
  const { data: categories } = await supabase.from('categories').select('slug');
  const { data: localities } = await supabase.from('localities').select('slug');

  const staticPages = [
    '',
    '/categories',
    '/localities',
  ].map((path) => ({
    url: BASE_URL + path,
    lastModified: new Date(),
  }));

  const eventPages = (events || []).map((e) => ({
    url: `${BASE_URL}/events/${e.slug}`,
    lastModified: new Date(),
  }));

  const categoryPages = (categories || []).map((c) => ({
    url: `${BASE_URL}/categories/${c.slug}`,
    lastModified: new Date(),
  }));

  const localityPages = (localities || []).map((l) => ({
    url: `${BASE_URL}/jaipur/${l.slug}`,
    lastModified: new Date(),
  }));

  const hybridPages: any[] = [];

  (categories || []).forEach((c) => {
    (localities || []).forEach((l) => {
      hybridPages.push({
        url: `${BASE_URL}/events-in/${c.slug}/${l.slug}`,
        lastModified: new Date(),
      });
    });
  });

  return [
    ...staticPages,
    ...eventPages,
    ...categoryPages,
    ...localityPages,
    ...hybridPages,
  ];
}
