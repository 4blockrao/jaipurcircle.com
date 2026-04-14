type BasicEntity = {
  id?: string;
  name?: string;
  slug?: string;
};

type EventLike = {
  id?: string;
  slug?: string;
  title?: string;
  category?: string;
  locality?: string;
  venue_name?: string;
};

type LinkItem = {
  href: string;
  label: string;
};

function safeName(value?: string) {
  return value || '';
}

function titleCaseFromSlug(value?: string) {
  if (!value) return '';
  return value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function normalizeCategoryLabel(category: any) {
  return safeName(category?.name) || titleCaseFromSlug(category?.slug);
}

function normalizeLocalityLabel(locality: any) {
  return safeName(locality?.name) || titleCaseFromSlug(locality?.slug);
}

function normalizeVenueLabel(venue: any) {
  return safeName(venue?.name) || titleCaseFromSlug(venue?.slug);
}

function dedupeLinks(links: LinkItem[]) {
  const seen = new Set<string>();
  return links.filter((link) => {
    if (!link?.href || !link?.label) return false;
    if (seen.has(link.href)) return false;
    seen.add(link.href);
    return true;
  });
}

/* =========================
   BASE ENTITY LINKS
   ========================= */

export function buildCategoryLinks(categories: BasicEntity[] = []): LinkItem[] {
  return dedupeLinks(
    categories.map((category) => ({
      href: `/categories/${category.slug}`,
      label: normalizeCategoryLabel(category),
    }))
  );
}

export function buildLocalityLinks(localities: BasicEntity[] = []): LinkItem[] {
  return dedupeLinks(
    localities.map((locality) => ({
      href: `/jaipur/${locality.slug}`,
      label: normalizeLocalityLabel(locality),
    }))
  );
}

export function buildVenueLinks(venues: BasicEntity[] = []): LinkItem[] {
  return dedupeLinks(
    venues.map((venue) => ({
      href: `/venues/${venue.slug}`,
      label: normalizeVenueLabel(venue),
    }))
  );
}

export function buildArtistLinks(artists: BasicEntity[] = []): LinkItem[] {
  return dedupeLinks(
    artists.map((artist) => ({
      href: `/artists/${artist.slug}`,
      label: safeName(artist?.name) || titleCaseFromSlug(artist?.slug),
    }))
  );
}

/* =========================
   HYBRID PAGE LINKS
   ========================= */

export function buildHybridLinksForLocality(
  locality: BasicEntity,
  categories: BasicEntity[] = []
): LinkItem[] {
  const localityLabel = normalizeLocalityLabel(locality);

  return dedupeLinks(
    categories.map((category) => ({
      href: `/events-in/${category.slug}/${locality.slug}`,
      label: `${normalizeCategoryLabel(category)} in ${localityLabel}`,
    }))
  );
}

export function buildHybridLinksForCategory(
  category: BasicEntity,
  localities: BasicEntity[] = []
): LinkItem[] {
  const categoryLabel = normalizeCategoryLabel(category);

  return dedupeLinks(
    localities.map((locality) => ({
      href: `/events-in/${category.slug}/${locality.slug}`,
      label: `${categoryLabel} in ${normalizeLocalityLabel(locality)}`,
    }))
  );
}

/* =========================
   EVENT PAGE PARENT LINKS
   ========================= */

export function buildEventParentLinks({
  category,
  locality,
  venue,
}: {
  category?: BasicEntity | null;
  locality?: BasicEntity | null;
  venue?: BasicEntity | null;
}): LinkItem[] {
  const links: LinkItem[] = [{ href: '/events', label: 'All Events' }];

  if (category?.slug) {
    links.push({
      href: `/categories/${category.slug}`,
      label: normalizeCategoryLabel(category),
    });
  }

  if (locality?.slug) {
    links.push({
      href: `/jaipur/${locality.slug}`,
      label: normalizeLocalityLabel(locality),
    });
  }

  if (venue?.slug) {
    links.push({
      href: `/venues/${venue.slug}`,
      label: normalizeVenueLabel(venue),
    });
  }

  if (category?.slug && locality?.slug) {
    links.push({
      href: `/events-in/${category.slug}/${locality.slug}`,
      label: `${normalizeCategoryLabel(category)} in ${normalizeLocalityLabel(locality)}`,
    });
  }

  return dedupeLinks(links);
}

/* =========================
   ARTIST PAGE LINKS
   ========================= */

export function buildArtistDiscoveryLinks({
  categories = [],
  localities = [],
  venues = [],
}: {
  categories?: BasicEntity[];
  localities?: BasicEntity[];
  venues?: BasicEntity[];
}): LinkItem[] {
  const links: LinkItem[] = [{ href: '/events', label: 'All Jaipur Events' }];

  categories.slice(0, 6).forEach((category) => {
    links.push({
      href: `/categories/${category.slug}`,
      label: normalizeCategoryLabel(category),
    });
  });

  localities.slice(0, 6).forEach((locality) => {
    links.push({
      href: `/jaipur/${locality.slug}`,
      label: normalizeLocalityLabel(locality),
    });
  });

  venues.slice(0, 4).forEach((venue) => {
    links.push({
      href: `/venues/${venue.slug}`,
      label: normalizeVenueLabel(venue),
    });
  });

  return dedupeLinks(links);
}

/* =========================
   VENUE PAGE LINKS
   ========================= */

export function buildVenueDiscoveryLinks({
  locality,
  categories = [],
}: {
  locality?: BasicEntity | null;
  categories?: BasicEntity[];
}): LinkItem[] {
  const links: LinkItem[] = [
    { href: '/events', label: 'All Jaipur Events' },
  ];

  if (locality?.slug) {
    links.push({
      href: `/jaipur/${locality.slug}`,
      label: `Things to do in ${normalizeLocalityLabel(locality)}`,
    });
  }

  categories.slice(0, 6).forEach((category) => {
    links.push({
      href: `/categories/${category.slug}`,
      label: normalizeCategoryLabel(category),
    });

    if (locality?.slug) {
      links.push({
        href: `/events-in/${category.slug}/${locality.slug}`,
        label: `${normalizeCategoryLabel(category)} in ${normalizeLocalityLabel(locality)}`,
      });
    }
  });

  return dedupeLinks(links);
}

/* =========================
   LOCALITY PAGE LINKS
   ========================= */

export function buildLocalityDiscoveryLinks({
  locality,
  categories = [],
  venues = [],
}: {
  locality: BasicEntity;
  categories?: BasicEntity[];
  venues?: BasicEntity[];
}): LinkItem[] {
  const links: LinkItem[] = [
    { href: '/events', label: 'All Jaipur Events' },
  ];

  categories.slice(0, 8).forEach((category) => {
    links.push({
      href: `/categories/${category.slug}`,
      label: normalizeCategoryLabel(category),
    });

    if (locality?.slug) {
      links.push({
        href: `/events-in/${category.slug}/${locality.slug}`,
        label: `${normalizeCategoryLabel(category)} in ${normalizeLocalityLabel(locality)}`,
      });
    }
  });

  venues.slice(0, 6).forEach((venue) => {
    links.push({
      href: `/venues/${venue.slug}`,
      label: normalizeVenueLabel(venue),
    });
  });

  return dedupeLinks(links);
}

/* =========================
   CATEGORY PAGE LINKS
   ========================= */

export function buildCategoryDiscoveryLinks({
  category,
  localities = [],
  venues = [],
}: {
  category: BasicEntity;
  localities?: BasicEntity[];
  venues?: BasicEntity[];
}): LinkItem[] {
  const links: LinkItem[] = [
    { href: '/events', label: 'All Jaipur Events' },
  ];

  localities.slice(0, 8).forEach((locality) => {
    links.push({
      href: `/jaipur/${locality.slug}`,
      label: normalizeLocalityLabel(locality),
    });

    if (category?.slug) {
      links.push({
        href: `/events-in/${category.slug}/${locality.slug}`,
        label: `${normalizeCategoryLabel(category)} in ${normalizeLocalityLabel(locality)}`,
      });
    }
  });

  venues.slice(0, 6).forEach((venue) => {
    links.push({
      href: `/venues/${venue.slug}`,
      label: normalizeVenueLabel(venue),
    });
  });

  return dedupeLinks(links);
}

/* =========================
   EVENT-LEVEL CONTEXTUAL LINKS
   ========================= */

export function buildEventContextualLinks(event: EventLike): LinkItem[] {
  const links: LinkItem[] = [{ href: '/events', label: 'All Jaipur Events' }];

  if (event?.category) {
    const categorySlug = String(event.category).toLowerCase();
    links.push({
      href: `/events?category=${encodeURIComponent(categorySlug)}`,
      label: `More ${String(event.category).replace(/-/g, ' ')}`,
    });
  }

  if (event?.locality) {
    links.push({
      href: `/events?locality=${encodeURIComponent(event.locality)}`,
      label: `More in ${String(event.locality).replace(/-/g, ' ')}`,
    });
  }

  return dedupeLinks(links);
}

/* =========================
   BREADCRUMB HELPERS
   ========================= */

export function buildEventBreadcrumbs({
  eventTitle,
  category,
  locality,
}: {
  eventTitle: string;
  category?: BasicEntity | null;
  locality?: BasicEntity | null;
}): LinkItem[] {
  const links: LinkItem[] = [
    { href: '/', label: 'Home' },
    { href: '/events', label: 'Events' },
  ];

  if (category?.slug) {
    links.push({
      href: `/categories/${category.slug}`,
      label: normalizeCategoryLabel(category),
    });
  }

  if (locality?.slug) {
    links.push({
      href: `/jaipur/${locality.slug}`,
      label: normalizeLocalityLabel(locality),
    });
  }

  links.push({
    href: '#',
    label: eventTitle,
  });

  return links;
}

export function buildArtistBreadcrumbs(artistName: string): LinkItem[] {
  return [
    { href: '/', label: 'Home' },
    { href: '/events', label: 'Events' },
    { href: '/artists', label: 'Artists' },
    { href: '#', label: artistName },
  ];
}

export function buildVenueBreadcrumbs(venueName: string): LinkItem[] {
  return [
    { href: '/', label: 'Home' },
    { href: '/events', label: 'Events' },
    { href: '/venues', label: 'Venues' },
    { href: '#', label: venueName },
  ];
}

/* =========================
   CROSS-ENTITY SUPPORT
   ========================= */

export function buildCrossEntityLinks({
  artist,
  venue,
  locality,
  category,
}: {
  artist?: BasicEntity | null;
  venue?: BasicEntity | null;
  locality?: BasicEntity | null;
  category?: BasicEntity | null;
}): LinkItem[] {
  const links: LinkItem[] = [];

  if (artist?.slug) {
    links.push({
      href: `/artists/${artist.slug}`,
      label: safeName(artist?.name) || titleCaseFromSlug(artist?.slug),
    });
  }

  if (venue?.slug) {
    links.push({
      href: `/venues/${venue.slug}`,
      label: normalizeVenueLabel(venue),
    });
  }

  if (locality?.slug) {
    links.push({
      href: `/jaipur/${locality.slug}`,
      label: normalizeLocalityLabel(locality),
    });
  }

  if (category?.slug) {
    links.push({
      href: `/categories/${category.slug}`,
      label: normalizeCategoryLabel(category),
    });
  }

  if (category?.slug && locality?.slug) {
    links.push({
      href: `/events-in/${category.slug}/${locality.slug}`,
      label: `${normalizeCategoryLabel(category)} in ${normalizeLocalityLabel(locality)}`,
    });
  }

  return dedupeLinks(links);
}
