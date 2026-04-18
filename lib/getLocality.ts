import { createServerSupabaseClient } from '@/lib/supabase';

export async function getLocalityBySlug(slug: string) {
  if (!slug) return null;

  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from('localities')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  return data || null;
}

export async function getLocalitiesForSelector(limit = 12) {
  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from('localities')
    .select('id,name,slug')
    .order('name', { ascending: true })
    .limit(limit);

  return data || [];
}

