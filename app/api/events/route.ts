import { createServerSupabaseClient } from '@/lib/supabase';

export async function GET(req: Request) {
  const supabase = createServerSupabaseClient();

  const { searchParams } = new URL(req.url);

  const page = Number(searchParams.get('page') || '1');
  const limit = 6;
  const offset = (page - 1) * limit;

  const query = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  const locality = searchParams.get('locality') || '';

  let eventsQuery = supabase
    .from('events')
    .select('*')
    .range(offset, offset + limit - 1);

  if (query) {
    eventsQuery = eventsQuery.or(
      `title.ilike.%${query}%,meta_description.ilike.%${query}%`
    );
  }

  const { data: events } = await eventsQuery;

  return Response.json({ events });
}
