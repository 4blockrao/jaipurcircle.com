import { CATEGORY_ALIAS_MAP, LOCALITY_ALIAS_MAP } from '@/lib/legacy-slug-maps';

function normalizeInput(value: string) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[()]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function toLooseText(value: string) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[()]/g, '')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function resolveCategorySlug(
  supabase: any,
  incomingSlug: string
) {
  const raw = String(incomingSlug || '').trim();
  const normalized = normalizeInput(raw);
  const loose = toLooseText(raw);

  const trySlugs = Array.from(new Set([raw, normalized].filter(Boolean)));

  for (const slug of trySlugs) {
    const { data: directCategory } = await supabase
      .from('categories')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (directCategory) {
      return {
        canonicalSlug: directCategory.slug,
        category: directCategory,
        wasAlias: slug !== raw,
      };
    }
  }

  for (const slug of trySlugs) {
    const { data: dbAlias } = await supabase
      .from('category_aliases_view')
      .select('*')
      .eq('old_slug', slug)
      .maybeSingle();

    if (dbAlias) {
      const { data: aliasCategory } = await supabase
        .from('categories')
        .select('*')
        .eq('id', dbAlias.category_id)
        .maybeSingle();

      if (aliasCategory) {
        return {
          canonicalSlug: aliasCategory.slug,
          category: aliasCategory,
          wasAlias: true,
        };
      }
    }
  }

  const mappedSlug =
    CATEGORY_ALIAS_MAP[raw] ||
    CATEGORY_ALIAS_MAP[normalized] ||
    CATEGORY_ALIAS_MAP[loose];

  if (mappedSlug) {
    const { data: mappedCategory } = await supabase
      .from('categories')
      .select('*')
      .eq('slug', mappedSlug)
      .maybeSingle();

    if (mappedCategory) {
      return {
        canonicalSlug: mappedCategory.slug,
        category: mappedCategory,
        wasAlias: true,
      };
    }
  }

  const { data: fuzzyCategory } = await supabase
    .from('categories')
    .select('*')
    .ilike('name', loose)
    .maybeSingle();

  if (fuzzyCategory) {
    return {
      canonicalSlug: fuzzyCategory.slug,
      category: fuzzyCategory,
      wasAlias: true,
    };
  }

  return {
    canonicalSlug: null,
    category: null,
    wasAlias: false,
  };
}

export async function resolveLocalitySlug(
  supabase: any,
  incomingSlug: string
) {
  const raw = String(incomingSlug || '').trim();
  const normalized = normalizeInput(raw);
  const loose = toLooseText(raw);

  const trySlugs = Array.from(new Set([raw, normalized].filter(Boolean)));

  for (const slug of trySlugs) {
    const { data: directLocality } = await supabase
      .from('localities')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (directLocality) {
      return {
        canonicalSlug: directLocality.slug,
        locality: directLocality,
        wasAlias: slug !== raw,
      };
    }
  }

  for (const slug of trySlugs) {
    const { data: dbAlias } = await supabase
      .from('locality_aliases_view')
      .select('*')
      .eq('old_slug', slug)
      .maybeSingle();

    if (dbAlias) {
      const localityId = dbAlias.locality_id;
      const localitySlug = dbAlias.locality_slug;

      let aliasLocality = null;

      if (localityId) {
        const { data } = await supabase
          .from('localities')
          .select('*')
          .eq('id', localityId)
          .maybeSingle();
        aliasLocality = data;
      } else if (localitySlug) {
        const { data } = await supabase
          .from('localities')
          .select('*')
          .eq('slug', localitySlug)
          .maybeSingle();
        aliasLocality = data;
      }

      if (aliasLocality) {
        return {
          canonicalSlug: aliasLocality.slug,
          locality: aliasLocality,
          wasAlias: true,
        };
      }
    }
  }

  const mappedSlug =
    LOCALITY_ALIAS_MAP[raw] ||
    LOCALITY_ALIAS_MAP[normalized] ||
    LOCALITY_ALIAS_MAP[loose];

  if (mappedSlug) {
    const { data: mappedLocality } = await supabase
      .from('localities')
      .select('*')
      .eq('slug', mappedSlug)
      .maybeSingle();

    if (mappedLocality) {
      return {
        canonicalSlug: mappedLocality.slug,
        locality: mappedLocality,
        wasAlias: true,
      };
    }
  }

  const { data: fuzzyLocality } = await supabase
    .from('localities')
    .select('*')
    .ilike('name', loose)
    .maybeSingle();

  if (fuzzyLocality) {
    return {
      canonicalSlug: fuzzyLocality.slug,
      locality: fuzzyLocality,
      wasAlias: true,
    };
  }

  return {
    canonicalSlug: null,
    locality: null,
    wasAlias: false,
  };
}
