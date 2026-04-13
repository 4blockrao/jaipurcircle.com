import { createServerSupabaseClient } from '@/lib/supabase';

export async function generateMetadata(props: any) {
  const supabase = createServerSupabaseClient();
  const params = await props.params;
  const slug = params?.slug;

  const { data } = await supabase.rpc('get_event_page', {
    p_slug: slug,
  });

  const event = data?.event;

  if (!event) {
    return {
      title: 'Event not found',
    };
  }

  return {
    title: event.meta_title || event.title,
    description: event.meta_description,
    alternates: {
      canonical: event.canonical_url,
    },
  };
}
