import { createServerSupabaseClient } from '@/lib/supabase';

export async function generateMetadata(props: any) {
  const supabase = createServerSupabaseClient();
  const params = await props.params;
  const slug = params?.slug;

  const { data } = await supabase.rpc('get_category_page', {
    p_slug: slug,
  });

  const category = data?.category;

  if (!category) {
    return {
      title: 'Category not found',
    };
  }

  return {
    title: category.meta_title,
    description: category.meta_description,
    alternates: {
      canonical: category.canonical_url,
    },
  };
}
