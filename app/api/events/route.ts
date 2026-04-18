import { createServerSupabaseClient } from '@/lib/supabase';
import { resolveCategorySlug, resolveLocalitySlug } from '@/lib/resolve-slugs';

function parseEventDate(event: any) {
  const value = event?.start_time || event?.start_date;
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function sortPublishedEvents(items: any[]) {
  const now = new Date();

  return [...(items || [])].sort((a: any, b: any) => {
    const aDate = parseEventDate(a);
    const bDate = parseEventDate(b);

    if (!aDate && !bDate) return 0;
    if (!aDate) return 1;
    if (!bDate) return -1;

    const aUpcoming = aDate >= now;
    const bUpcoming = bDate >= now;

    if (aUpcoming && !bUpcoming) return -1;
    if (!aUpcoming && bUpcoming) return 1;

    if (aUpcoming && bUpcoming) return aDate.getTime() - bDate.getTime();
    return bDate.getTime() - aDate.getTime();
  });
}

export async function GET(req: Request) {
  const supabase = createServerSupabaseClient();
  const { searchParams } = new URL(req.url);

  const page = Number(searchParams.get('page') || '1');
  const limit = 12;
  const offset = (page - 1) * limit;

  const query = (searchParams.get('q') || '').trim();
  const category = (searchParams.get('category') || '').trim();
  const locality = (searchParams.get('locality') || '').trim();

  let resolvedCategory: any = null;
  let resolvedLocality: any = null;

  if (category) {
    const categoryResult = await resolveCategorySlug(supabase, category);
    resolvedCategory = categoryResult.category;
  }

  if (locality) {
    const localityResult = await resolveLocalitySlug(supabase, locality);
    resolvedLocality = localityResult.locality;
  }

  let eventIdsByCategory: string[] | null = null;

  if (resolvedCategory) {
    const { data: eventLinks } = await supabase
      .from('event_categories')
      .select('event_id')
      .eq('category_id', resolvedCategory.id);

    eventIdsByCategory = (eventLinks || []).map((x: any) => x.event_id);

    if (eventIdsByCategory.length === 0) {
      return Response.json({ events: [], page, limit });
    }
  }

  let eventsQuery = supabase
    .from('events')
    .select('*')
    .eq('editorial_status', 'published');

  if (resolvedLocality) {
    if (resolvedLocality.id) {
      eventsQuery = eventsQuery.eq('locality_id', resolvedLocality.id);
    } else if (resolvedLocality.slug) {
      eventsQuery = eventsQuery.eq('locality', resolvedLocality.slug);
    }
  }

  if (eventIdsByCategory) {
    eventsQuery = eventsQuery.in('id', eventIdsByCategory);
  }

  if (query) {
    const safeSearch = query.replace(/,/g, ' ').trim();
    eventsQuery = eventsQuery.or(
      `title.ilike.%${safeSearch}%,meta_description.ilike.%${safeSearch}%,description.ilike.%${safeSearch}%,venue_name.ilike.%${safeSearch}%`
    );
  }

  const { data: eventsRaw, error } = await eventsQuery.limit(240);

  if (error) {
    return Response.json({ events: [], page, limit, error: error.message }, { status: 500 });
  }

  const sorted = sortPublishedEvents(eventsRaw || []);
  const paged = sorted.slice(offset, offset + limit);

  return Response.json({
    events: paged,
    page,
    limit,
  });
}
