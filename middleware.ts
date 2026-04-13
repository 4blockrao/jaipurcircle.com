import { NextRequest, NextResponse } from 'next/server';
import { CATEGORY_ALIAS_MAP, LOCALITY_ALIAS_MAP } from '@/lib/legacy-slug-maps';

function mapCategorySlug(slug: string) {
  return CATEGORY_ALIAS_MAP[slug] || slug;
}

function mapLocalitySlug(slug: string) {
  return LOCALITY_ALIAS_MAP[slug] || slug;
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // ------------------------------------------------------
  // OLD CATEGORY ROUTES
  // /events/category/music -> /categories/music-events
  // ------------------------------------------------------
  const categoryMatch = pathname.match(/^\/events\/category\/([^/]+)$/);
  if (categoryMatch) {
    const oldCategory = categoryMatch[1];
    const mappedCategory = mapCategorySlug(oldCategory);

    return NextResponse.redirect(
      new URL(`/categories/${mappedCategory}${search}`, request.url),
      308
    );
  }

  // ------------------------------------------------------
  // OLD LOCALITY EVENTS ROUTES
  // /events/in/raja-park-market -> /jaipur/raja-park
  // ------------------------------------------------------
  const localityEventsMatch = pathname.match(/^\/events\/in\/([^/]+)$/);
  if (localityEventsMatch) {
    const oldLocality = localityEventsMatch[1];
    const mappedLocality = mapLocalitySlug(oldLocality);

    return NextResponse.redirect(
      new URL(`/jaipur/${mappedLocality}${search}`, request.url),
      308
    );
  }

  // ------------------------------------------------------
  // OLD HYBRID EVENT ROUTES
  // /events/music/c-scheme -> /events-in/music-events/c-scheme
  // ------------------------------------------------------
  const hybridMatch = pathname.match(/^\/events\/([^/]+)\/([^/]+)$/);
  if (hybridMatch) {
    const oldCategory = hybridMatch[1];
    const oldLocality = hybridMatch[2];

    // Guard: do not touch actual event detail pages like /events/some-event-slug
    if (oldCategory !== 'category' && oldCategory !== 'in') {
      const mappedCategory = mapCategorySlug(oldCategory);
      const mappedLocality = mapLocalitySlug(oldLocality);

      return NextResponse.redirect(
        new URL(`/events-in/${mappedCategory}/${mappedLocality}${search}`, request.url),
        308
      );
    }
  }

  // ------------------------------------------------------
  // OLD LOCALITY SUBVERTICAL ROUTES
  // /jaipur/vaishali-nagar/shopping -> /jaipur/vaishali-nagar
  // ------------------------------------------------------
  const localitySubverticalMatch = pathname.match(/^\/jaipur\/([^/]+)\/([^/]+)$/);
  if (localitySubverticalMatch) {
    const oldLocality = localitySubverticalMatch[1];
    const mappedLocality = mapLocalitySlug(oldLocality);

    return NextResponse.redirect(
      new URL(`/jaipur/${mappedLocality}${search}`, request.url),
      308
    );
  }

  // ------------------------------------------------------
  // SIMPLE FILTER ROUTES
  // ------------------------------------------------------
  if (pathname === '/events/free' || pathname === '/events/this-week') {
    return NextResponse.redirect(
      new URL(`/events${search}`, request.url),
      308
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/events/:path*',
    '/jaipur/:path*',
  ],
};
