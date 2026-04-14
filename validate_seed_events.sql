select slug, title, status, locality, venue_name, ticket_price, is_free
from public.events
where slug in (
  'filmish-play-shivam-dhall-raja-subramaniyam-jaipur-apr-2026',
  'ar-rahman-harmony-of-hearts-jaipur-apr-2026',
  'gaurav-gupta-live-india-tour-jaipur-apr-2026',
  'truck-trailer-tyre-expo-jaipur-jun-2026'
)
order by start_time;

select c.slug as category_slug, count(*) as linked_events
from public.event_categories ec
join public.categories c on c.id = ec.category_id
join public.events e on e.id = ec.event_id
where e.slug in (
  'filmish-play-shivam-dhall-raja-subramaniyam-jaipur-apr-2026',
  'ar-rahman-harmony-of-hearts-jaipur-apr-2026',
  'gaurav-gupta-live-india-tour-jaipur-apr-2026',
  'truck-trailer-tyre-expo-jaipur-jun-2026'
)
group by c.slug
order by c.slug;
