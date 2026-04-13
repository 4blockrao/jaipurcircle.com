import EventSchema from './EventSchema';
import { createServerSupabaseClient } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import EventCard from '@/components/EventCard';

/* =========================
   FIELD RESOLVERS (CRITICAL)
   ========================= */

function resolveEventImage(event: any) {
  return (
    event?.cover_image_url ||
    event?.image_url ||
    event?.cover_image ||
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1200'
  );
}

function resolveVenueName(event: any, venue: any) {
  return venue?.name || event?.venue_name || 'Venue TBA';
}

function resolveLocalityName(event: any, locality: any) {
  return locality?.name || event?.locality || 'Jaipur';
}

function resolvePrice(event: any) {
  if (event?.is_free) return 'Free';
  if (event?.price_min) return `₹${event.price_min}`;
  if (event?.ticket_price) return `₹${event.ticket_price}`;
  return 'Price TBA';
}

function resolveDescription(event: any) {
  return (
    event?.short_description ||
    event?.meta_description ||
    event?.description ||
    `Explore ${event?.title} in Jaipur.`
  );
}

function resolveStatus(event: any) {
  if (event?.status) return event.status;

  if (!event?.start_time) return 'upcoming';

  const now = new Date();
  const eventDate = new Date(event.start_time);

  if (eventDate < now) return 'past';
  return 'upcoming';
}

function formatEventDateTime(value?: string | null) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

/* ========================= */

export default async function EventPage(props: any) {
  const supabase = createServerSupabaseClient();

  const params = await props.params;
  const slug = params?.slug;

  if (!slug) return notFound();

  const { data } = await supabase.rpc('get_event_page', {
    p_slug: slug,
  });

  const event = data?.event;
  const venue = data?.venue;
  const locality = data?.locality;
  const categories = data?.categories || [];
  const moreFromVenue = data?.more_from_venue || [];

  if (!event) return notFound();

  /* =========================
     RESOLVED VALUES
     ========================= */

  const image = resolveEventImage(event);
  const venueName = resolveVenueName(event, venue);
  const localityName = resolveLocalityName(event, locality);
  const price = resolvePrice(event);
  const description = resolveDescription(event);
  const status = resolveStatus(event);
  const isCompleted = status === 'past';

  /* ========================= */

  return (
    <main className="max-w-6xl mx-auto px-4 md:px-6 pb-28">

      {/* HERO */}
      <section className="relative h-[260px] md:h-[420px] rounded-2xl overflow-hidden mt-6">
        <img src={image} className="w-full h-full object-cover" />

        <div className="absolute inset-0 bg-black/50"></div>

        <div className="absolute top-4 left-4">
          <span className={`px-4 py-2 text-sm rounded-full ${
            isCompleted ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'
          }`}>
            {isCompleted ? 'Completed Event' : 'Upcoming Event'}
          </span>
        </div>

        <div className="absolute bottom-4 left-4 right-4 text-white">
          <h1 className="text-3xl md:text-4xl font-bold">
            {event.title}
          </h1>

          <p className="mt-2 text-sm opacity-90">
            {venueName} • {localityName}
          </p>
        </div>
      </section>

      {/* DESCRIPTION */}
      <section className="mt-8">
        <h2 className="text-xl font-semibold mb-3">About Event</h2>
        <p className="text-gray-600 leading-relaxed">
          {description}
        </p>
      </section>

      {/* DETAILS */}
      <section className="mt-8 bg-white border p-6 rounded-xl">
        <h3 className="font-semibold mb-4">Event Details</h3>

        <div className="space-y-2 text-sm text-gray-600">
          {event.start_time && (
            <div>🕒 {formatEventDateTime(event.start_time)}</div>
          )}

          <div>📍 {venueName}</div>
          <div>📌 {localityName}</div>
          <div>💰 {price}</div>
          <div>📍 Status: {isCompleted ? 'Past' : 'Upcoming'}</div>
        </div>

        {!isCompleted ? (
          <button className="mt-6 w-full bg-blue-600 text-white py-3 rounded-xl">
            Book Tickets
          </button>
        ) : (
          <a href="/events" className="block mt-6 text-center bg-black text-white py-3 rounded-xl">
            Browse More Events
          </a>
        )}
      </section>

      {/* RELATED EVENTS */}
      {moreFromVenue.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-semibold mb-4">
            More at {venueName}
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {moreFromVenue.map((e: any) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
