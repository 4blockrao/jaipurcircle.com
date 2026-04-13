export type LinkItem = {
  label: string;
  href: string;
};

export type CategoryLike = {
  id?: string;
  name?: string;
  slug?: string;
};

export type LocalityLike = {
  id?: string;
  name?: string;
  slug?: string;
};

export function safeSlug(value?: string | null) {
  if (!value) return '';
  return String(value).trim().toLowerCase();
}

export function dedupeLinks(items: LinkItem[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (!item?.href) return false;
    if (seen.has(item.href)) return false;
    seen.add(item.href);
    return true;
  });
}

export function buildCategoryLinks(categories: CategoryLike[] = []) {
  return dedupeLinks(
    categories
      .filter((c) => c?.slug && c?.name)
      .map((c) => ({
        label: String(c.name),
        href: `/categories/${safeSlug(c.slug)}`,
      }))
  );
}

export function buildLocalityLinks(localities: LocalityLike[] = []) {
  return dedupeLinks(
    localities
      .filter((l) => l?.slug && l?.name)
      .map((l) => ({
        label: String(l.name),
        href: `/jaipur/${safeSlug(l.slug)}`,
      }))
  );
}

export function buildHybridLinksForLocality(
  locality: LocalityLike | null | undefined,
  categories: CategoryLike[] = []
) {
  if (!locality?.slug || !locality?.name) return [];

  return dedupeLinks(
    categories
      .filter((c) => c?.slug && c?.name)
      .map((c) => ({
        label: `${c.name} in ${locality.name}`,
        href: `/events-in/${safeSlug(c.slug)}/${safeSlug(locality.slug)}`,
      }))
  );
}

export function buildHybridLinksForCategory(
  category: CategoryLike | null | undefined,
  localities: LocalityLike[] = []
) {
  if (!category?.slug || !category?.name) return [];

  return dedupeLinks(
    localities
      .filter((l) => l?.slug && l?.name)
      .map((l) => ({
        label: `${category.name} in ${l.name}`,
        href: `/events-in/${safeSlug(category.slug)}/${safeSlug(l.slug)}`,
      }))
  );
}

export function buildEventParentLinks(args: {
  category?: CategoryLike | null;
  locality?: LocalityLike | null;
  venue?: { slug?: string | null; name?: string | null } | null;
}) {
  const links: LinkItem[] = [{ label: 'All Events', href: '/events' }];

  if (args.category?.slug && args.category?.name) {
    links.push({
      label: `${args.category.name} in Jaipur`,
      href: `/categories/${safeSlug(args.category.slug)}`,
    });
  }

  if (args.locality?.slug && args.locality?.name) {
    links.push({
      label: `Things to do in ${args.locality.name}`,
      href: `/jaipur/${safeSlug(args.locality.slug)}`,
    });
  }

  if (
    args.category?.slug &&
    args.category?.name &&
    args.locality?.slug &&
    args.locality?.name
  ) {
    links.push({
      label: `${args.category.name} in ${args.locality.name}`,
      href: `/events-in/${safeSlug(args.category.slug)}/${safeSlug(args.locality.slug)}`,
    });
  }

  if (args.venue?.slug && args.venue?.name) {
    links.push({
      label: `More at ${args.venue.name}`,
      href: `/venues/${safeSlug(args.venue.slug)}`,
    });
  }

  return dedupeLinks(links);
}
