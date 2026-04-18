update public.venues
set locality_slug = trim(both '-' from regexp_replace(lower(coalesce(locality, '')), '[^a-z0-9]+', '-', 'g'))
where locality_slug is null
  and coalesce(locality, '') <> '';

