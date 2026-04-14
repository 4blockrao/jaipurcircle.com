begin;

create temporary table seed_events (
  slug text,
  title text,
  category_name text,
  category_slug text,
  status text,
  start_at timestamptz,
  end_at timestamptz,
  ticket_price numeric,
  is_free boolean,
  short_description text,
  description text,
  cover_image text,
  source_url text,
  source_label text,
  locality text,
  venue_name text,
  venue_address text,
  organizer_name text,
  registration_url text,
  tags text[]
);

insert into seed_events (
  slug, title, category_name, category_slug, status, start_at, end_at,
  ticket_price, is_free, short_description, description, cover_image,
  source_url, source_label, locality, venue_name, venue_address,
  organizer_name, registration_url, tags
)
values
(
  'lagan-mandap-summer-exhibition-jaipur-apr-2026',
  'Lagan Mandap Summer Exhibition 2026',
  'Exhibitions',
  'exhibitions',
  'upcoming',
  '2026-04-14 10:30:00+05:30',
  '2026-04-15 21:00:00+05:30',
  0,
  true,
  'Summer fashion shopping extravaganza featuring ethnic wear, designer outfits, wedding collections, handcrafted jewellery and accessories.',
  'Get ready to experience the ultimate summer fashion destination at the Lagan Mandap Exhibition in Jaipur with designer outfits, wedding collections, jewellery and lifestyle products.',
  'https://cdn2.allevents.in/thumbs/thumb69be47bdda5fe.jpg',
  'https://allevents.in/jaipur/lagan-mandap-summer-exhibition/80004582808600',
  'AllEvents.in',
  'c-scheme',
  'Birla Auditorium',
  'BM Birla Auditorium, Statue Circle, C Scheme, Rambagh, Jaipur, Rajasthan 302015',
  'Lagan Mandap',
  'https://allevents.in/jaipur/lagan-mandap-summer-exhibition/80004582808600',
  array['exhibition','fashion','ethnic wear','bridal','shopping','jaipur']
),
(
  'ghazals-more-pratibha-singh-baghel-deepak-pandit-jaipur-apr-2026',
  'Ghazals & More – Pratibha Singh Baghel & Deepak Pandit',
  'Music Events',
  'music-events',
  'upcoming',
  '2026-04-17 18:30:00+05:30',
  '2026-04-17 20:30:00+05:30',
  null,
  false,
  'An enchanting evening of Ghazals and classical music by vocalist Pratibha Singh Baghel and violinist Deepak Pandit.',
  'Rajasthan International Centre presents Ghazals & More featuring Pratibha Singh Baghel and Deepak Pandit as part of the Foundation Day Celebrations.',
  null,
  'https://ricjaipur.org/Uploads/Downloads/CalendarOfEvents.pdf',
  'Rajasthan International Centre Official Calendar',
  'jhalana-doongri',
  'Rajasthan International Centre – Main Auditorium',
  'Sansthan Path, JLN Marg, Jaipur, Rajasthan 302017',
  'Rajasthan International Centre',
  'https://in.bookmyshow.com/plays/rajasthan-international-centre/ET00363555',
  array['ghazal','classical music','concert','jaipur']
),
(
  'ar-rahman-harmony-of-hearts-jaipur-apr-2026',
  'A.R. Rahman – Harmony of Hearts',
  'Music Events',
  'music-events',
  'upcoming',
  '2026-04-18 19:00:00+05:30',
  '2026-04-18 22:00:00+05:30',
  1999,
  false,
  'A.R. Rahman performs live in Jaipur – a Sufi-inspired spectacle of soul-stirring music weaving love, harmony and emotion.',
  'The legendary A.R. Rahman brings his Harmony of Hearts tour to Jaipur at JECC Ground for an unforgettable live concert experience.',
  'https://ilovejaipur.city/media/events/2026/01/19_20260127_205003.jpg',
  'https://ilovejaipur.city/events/ar-rahman-harmony-of-hearts-apr-2026/',
  'ilovejaipur.city / AllEvents.in',
  'sitapura',
  'JECC Ground',
  'Jaipur Exhibition & Convention Centre, RIICO Industrial Area, Sitapura, Jaipur, Rajasthan 302022',
  null,
  'https://allevents.in/jaipur/ar-rahman-harmony-of-hearts/4100029817587244',
  array['concert','AR Rahman','Sufi','live music','JECC','jaipur']
),
(
  'smc-summit-3-jaipur-apr-2026',
  'SMC Summit 3.0 – 2026',
  'Business & Education',
  'business-education',
  'upcoming',
  '2026-04-18 11:00:00+05:30',
  '2026-04-19 21:00:00+05:30',
  500,
  false,
  'India''s leading edutainment festival — two power-packed days of keynotes, creator panels, career workshops and mentorship.',
  'SMC Summit 3.0 brings together students, creators, founders and industry leaders for two days of keynotes, workshops, mentorship and networking.',
  'https://ilovejaipur.city/media/events/2026/03/19_20260327_111834.jpg',
  'https://ilovejaipur.city/events/smc-summit-30-2026/',
  'ilovejaipur.city',
  'jhalana-doongri',
  'Rajasthan International Center',
  'Bhamashah State Data Centre Block-C, Jhalana Doongri, Jaipur, Rajasthan 302004',
  'SortMyCollege',
  'https://ilovejaipur.city/events/smc-summit-30-2026/',
  array['summit','education','students','entrepreneurs','career','jaipur']
),
(
  'happy-huddle-gossip-girls-kids-popup-jaipur-apr-2026',
  'Happy Huddle X The Gossip Girls – Kids Pop-Up 2026',
  'Kids & Family',
  'kids-family',
  'upcoming',
  '2026-04-25 11:00:00+05:30',
  null,
  0,
  true,
  'First-of-its-kind kids and family pop-up in Jaipur — kids fashion, toy brands, STEM, DIY, interactive learning and a Glow DJ Party.',
  'A vibrant world dedicated to kids and families with toy brands, fashion, STEM activities, DIY zones, interactive learning and a Glow DJ Party.',
  'https://ilovejaipur.city/media/events/2026/03/19_20260323_121738.jpg',
  'https://ilovejaipur.city/events/happy-huddle-x-the-gossip-girls-kids-pop-up-2026/',
  'ilovejaipur.city',
  'c-scheme',
  'Birla Auditorium',
  'BM Birla Auditorium, Statue Circle, C Scheme, Rambagh, Jaipur, Rajasthan 302015',
  'Happy Huddle',
  'https://ilovejaipur.city/events/happy-huddle-x-the-gossip-girls-kids-pop-up-2026/',
  array['kids','family','pop-up','exhibition','STEM','jaipur']
),
(
  'art-vibes-mocktail-delights-jaipur-apr-2026',
  'Art, Vibes and Mocktail Delights',
  'Workshops',
  'workshops',
  'upcoming',
  '2026-04-25 16:00:00+05:30',
  null,
  1499,
  false,
  'Decorate your own hairbrush and jewellery box with gems and paint. All materials included plus a refreshing mocktail.',
  'An evening of creativity at Paro where participants decorate a hairbrush and jewellery box with all materials included plus a mocktail.',
  'https://ilovejaipur.city/media/events/2026/04/127_20260411_093809.png',
  'https://ilovejaipur.city/events/art-vibes-and-mocktail-delights/',
  'ilovejaipur.city',
  'c-scheme',
  'Paro – Modern India Bar',
  'Panchbatti, C-Scheme, Ashok Nagar, Jaipur, Rajasthan',
  'Pretty Hairbrushes',
  'https://ilovejaipur.city/events/art-vibes-and-mocktail-delights/',
  array['workshop','art','DIY','jewellery','mocktail','jaipur']
),
(
  'gaurav-gupta-live-india-tour-jaipur-apr-2026',
  'Gaurav Gupta Live – India Tour (Jaipur)',
  'Comedy Shows',
  'comedy-shows',
  'upcoming',
  '2026-04-26 19:30:00+05:30',
  '2026-04-26 20:45:00+05:30',
  799,
  false,
  'Gaurav Gupta (Being Baniya) brings his India Tour to Jaipur — 75 minutes of high-energy, relatable standup comedy in Hindi.',
  'Gaurav Gupta, known for Being Baniya and Market Down Hai, brings his India Tour to Jaipur for a 75-minute standup set.',
  'https://cdn-az.allevents.in/events5/banners/1753da20-2f4b-11f1-bec9-ad3f1e96ac99-rimg-w1200-h600-dc8dffe9-gmir.jpg?v=1775213498',
  'https://allevents.in/jaipur/gaurav-gupta-live-india-tour/3900029619968431',
  'AllEvents.in',
  'jaipur',
  'Maharana Pratap Auditorium',
  'Maharana Pratap Auditorium, Jaipur, Rajasthan',
  null,
  'https://allevents.in/jaipur/gaurav-gupta-live-india-tour/3900029619968431',
  array['comedy','standup','gaurav gupta','being baniya','jaipur']
),
(
  'truck-trailer-tyre-expo-jaipur-jun-2026',
  'Truck, Trailer & Tyre Expo 2026',
  'Trade Shows',
  'trade-shows',
  'upcoming',
  '2026-06-05 10:00:00+05:30',
  '2026-06-07 18:00:00+05:30',
  0,
  true,
  'Asia''s only expo dedicated to trucks, trailers and tyres — 3 days of product showcases, B2B networking and industry innovation at JECC Jaipur.',
  'Truck, Trailer & Tyre Expo 2026 is a major B2B trade show at JECC Jaipur for the commercial transport and tyre ecosystem.',
  'https://cdn-az.allevents.in/events5/banners/28e6a217fbd675569cd569c490549abce6bdf14f763a2b9dc3e243d53c1405f0-rimg-w1200-h628-dc171515-gmir?v=1775563194',
  'https://allevents.in/jaipur/truck-trailer-and-tyre-expo-2026/200029811548914',
  'AllEvents.in / ShowsBee',
  'sitapura',
  'Jaipur Exhibition & Convention Centre (JECC)',
  'Exhibition Ground, RIICO Industrial Area, Sitapura, Sanganer, Jaipur, Rajasthan 302022',
  'Media Day Marketing',
  'https://trucktrailerntyreexpo.com/',
  array['trade show','trucks','automotive','tyres','JECC','jaipur']
);

insert into public.categories (id, name, slug, is_indexable, created_at, updated_at)
select
  gen_random_uuid(),
  s.category_name,
  s.category_slug,
  true,
  now(),
  now()
from (
  select distinct category_name, category_slug
  from seed_events
) s
where not exists (
  select 1
  from public.categories c
  where c.slug = s.category_slug
);

insert into public.events (
  id,
  title,
  slug,
  start_date,
  end_date,
  start_time,
  end_time,
  ticket_price,
  price_min,
  is_free,
  short_description,
  description,
  seo_blurb,
  cover_image,
  image_url,
  cover_image_url,
  meta_title,
  meta_description,
  canonical_url,
  index_status,
  status,
  is_indexable,
  editorial_status,
  published_at,
  created_at,
  updated_at,
  source_url,
  source_label,
  category,
  locality,
  venue_name,
  venue_address,
  organizer_name,
  registration_url,
  is_featured,
  tags
)
select
  gen_random_uuid(),
  s.title,
  s.slug,
  s.start_at,
  s.end_at,
  s.start_at,
  s.end_at,
  s.ticket_price,
  s.ticket_price,
  s.is_free,
  s.short_description,
  s.description,
  s.short_description,
  s.cover_image,
  s.cover_image,
  s.cover_image,
  s.title || ' | Jaipur Event Details',
  s.short_description,
  '/events/' || s.slug,
  'index',
  s.status,
  true,
  'published',
  now(),
  now(),
  now(),
  s.source_url,
  s.source_label,
  s.category_slug,
  s.locality,
  s.venue_name,
  s.venue_address,
  s.organizer_name,
  s.registration_url,
  false,
  s.tags
from seed_events s
where not exists (
  select 1
  from public.events e
  where e.slug = s.slug
);

insert into public.event_categories (event_id, category_id)
select
  e.id,
  c.id
from seed_events s
join public.events e
  on e.slug = s.slug
join public.categories c
  on c.slug = s.category_slug
where not exists (
  select 1
  from public.event_categories ec
  where ec.event_id = e.id
    and ec.category_id = c.id
);

commit;
