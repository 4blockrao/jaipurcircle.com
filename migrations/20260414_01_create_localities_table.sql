create table if not exists public.localities (
  id bigserial primary key,
  name text not null,
  slug text not null unique,
  zone text,
  locality_type text,
  ward_number text,
  ward_name text,
  pin_codes text[],
  assembly_constituency text,
  police_station text,
  description text,
  character_tags text[],
  event_relevance text,
  notable_landmarks text[],
  micro_localities text[],
  nearby_localities text[],
  geo_lat numeric,
  geo_lng numeric,
  created_at timestamptz default now()
);

