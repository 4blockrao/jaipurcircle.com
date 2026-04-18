import { createServerSupabaseClient } from '@/lib/supabase';

export async function generateMetadata(props: any) {
  const supabase = createServerSupabaseClient();
  const params = await props.params;
  const slug = params?.slug;

  const { data: event } = await supabase
    .from('events')
    .select('title, meta_title, meta_description, canonical_url, is_indexable, index_status')
    .eq('slug', slug)
    .maybeSingle();

  if (!event) {
    return {
      title: 'Event not found',
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  return {
    title: event.meta_title || event.title,
    description: event.meta_description || `Explore event details for ${event.title} in Jaipur.`,
    alternates: {
      canonical: event.canonical_url || `/events/${slug}`,
    },
    robots: {
      index: event.is_indexable !== false && event.index_status !== 'noindex',
      follow: true,
    },
  };
}
