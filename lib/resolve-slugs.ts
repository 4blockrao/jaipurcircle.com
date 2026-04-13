import { CATEGORY_ALIAS_MAP, LOCALITY_ALIAS_MAP } from '@/lib/legacy-slug-maps';

export async function resolveCategorySlug(
  supabase: any,
  incomingSlug: string
) {
  // 1) Try canonical category directly
  const { data: directCategory } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', incomingSlug)
    .maybeSingle();

  if (directCategory) {
    return {
      canonicalSlug: directCategory.slug,
      category: directCategory,
      wasAlias: false,
    };
  }

  // 2) Try DB alias table
  const { data: dbAlias } = await supabase
    .from('category_aliases_view')
    .select('*')
    .eq('old_slug', incomingSlug)
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

  // 3) Try code alias map
  const mappedSlug = CATEGORY_ALIAS_MAP[incomingSlug];
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
  // 1) Try canonical locality directly
  const { data: directLocality } = await supabase
    .from('localities')
    .select('*')
    .eq('slug', incomingSlug)
    .maybeSingle();

  if (directLocality) {
    return {
      canonicalSlug: directLocality.slug,
      locality: directLocality,
      wasAlias: false,
    };
  }

  // 2) Try DB alias table
  const { data: dbAlias } = await supabase
    .from('locality_aliases_view')
    .select('*')
    .eq('old_slug', incomingSlug)
    .maybeSingle();

  if (dbAlias) {
    const { data: aliasLocality } = await supabase
      .from('localities')
      .select('*')
      .eq('id', dbAlias.locality_id)
      .maybeSingle();

    if (aliasLocality) {
      return {
        canonicalSlug: aliasLocality.slug,
        locality: aliasLocality,
        wasAlias: true,
      };
    }
  }

  // 3) Try code alias map
  const mappedSlug = LOCALITY_ALIAS_MAP[incomingSlug];
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

  return {
    canonicalSlug: null,
    locality: null,
    wasAlias: false,
  };
}
