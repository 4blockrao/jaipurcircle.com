import { createServerSupabaseClient } from '@/lib/supabase';

export async function generateMetadata(props: any) {
  const supabase = createServerSupabaseClient();
  const params = await props.params;
  const slug = params?.slug;

  const { data } = await supabase
    .from('localities')
    .select('*')
    .eq('slug', slug)
    .single();

  if (!data) {
    return {
      title: 'Locality not found',
    };
  }

  return {
    title: data.meta_title,
    description: data.meta_description,
    alternates: {
      canonical: data.canonical_url,
    },
  };
}
