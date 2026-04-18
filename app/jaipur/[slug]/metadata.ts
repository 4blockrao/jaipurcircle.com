import { getLocalityBySlug } from '@/lib/getLocality';

export async function generateMetadata(props: any) {
  const params = await props.params;
  const slug = params?.slug;

  const data = await getLocalityBySlug(slug);

  if (!data) {
    return {
      title: 'Locality not found',
    };
  }

  return {
    title: `Things to do in ${data.name}, Jaipur`,
    description: data.description || `Discover events and experiences in ${data.name}, Jaipur.`,
  };
}
