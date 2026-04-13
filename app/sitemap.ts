import { createServerSupabaseClient } from '@/lib/supabase';
import { BASE_URL } from '@/lib/config';

export default async function sitemap() {
  const supabase = createServerSupabaseClient();

  const staticPages = [
    { url: `${BASE_URL}/`, lastModified: new Date() },
    { url: `${BASE_URL}/events`, lastModified: new Date() },
    { url: `${BASE_URL}/categories`, lastModified: new Date() },
    { url: `${BASE_URL}/merchants`, lastModified: new Date() },
    { url: `${BASE_URL}/deals`, lastModified: new Date() },
  ];

  const { data: events } = await supabase
    .from('events')
    .select('slug, updated_at')
    .eq('is_indexable', true)
    .limit(5000);

  const { data: localities } = await supabase
    .from('localities')
    .select('slug, updated_at')
    .eq('should_index', true)
    .limit(5000);

  const { data: venues } = await supabase
    .from('venues')
    .select('slug, updated_at')
    .eq('is_indexable', true)
    .limit(5000);

  const { data: artists } = await supabase
    .from('artists')
    .select('slug, updated_at')
    .eq('is_indexable', true)
    .limit(5000);

  const { data: merchants } = await supabase
    .from('merchants')
    .select('slug, updated_at')
    .eq('is_indexable', true)
    .limit(5000);

  const { data: deals } = await supabase
    .from('deals')
    .select('slug, updated_at')
    .eq('is_indexable', true)
    .limit(5000);

  const { data: categories } = await supabase
    .from('categories')
    .select('slug, updated_at')
    .eq('is_indexable', true)
    .limit(5000);

  const eventPages = (events || []).map((e: any) => ({
    url: `${BASE_URL}/events/${e.slug}`,
    lastModified: e.updated_at ? new Date(e.updated_at) : new Date(),
  }));

  const localityPages = (localities || []).map((l: any) => ({
    url: `${BASE_URL}/jaipur/${l.slug}`,
    lastModified: l.updated_at ? new Date(l.updated_at) : new Date(),
  }));

  const venuePages = (venues || []).map((v: any) => ({
    url: `${BASE_URL}/venues/${v.slug}`,
    lastModified: v.updated_at ? new Date(v.updated_at) : new Date(),
  }));

  const artistPages = (artists || []).map((a: any) => ({
    url: `${BASE_URL}/artists/${a.slug}`,
    lastModified: a.updated_at ? new Date(a.updated_at) : new Date(),
  }));

  const merchantPages = (merchants || []).map((m: any) => ({
    url: `${BASE_URL}/merchant/${m.slug}`,
    lastModified: m.updated_at ? new Date(m.updated_at) : new Date(),
  }));

  const dealPages = (deals || []).map((d: any) => ({
    url: `${BASE_URL}/deal/${d.slug}`,
    lastModified: d.updated_at ? new Date(d.updated_at) : new Date(),
  }));

  const categoryPages = (categories || []).map((c: any) => ({
    url: `${BASE_URL}/categories/${c.slug}`,
    lastModified: c.updated_at ? new Date(c.updated_at) : new Date(),
  }));

  return [
    ...staticPages,
    ...eventPages,
    ...localityPages,
    ...venuePages,
    ...artistPages,
    ...merchantPages,
    ...dealPages,
    ...categoryPages,
  ];
}
