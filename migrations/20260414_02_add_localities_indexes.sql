create index if not exists idx_localities_slug on public.localities using btree (slug);
create index if not exists idx_localities_zone on public.localities using btree (zone);
create index if not exists idx_localities_event_relevance on public.localities using btree (event_relevance);
create index if not exists idx_localities_character_tags on public.localities using gin (character_tags);

