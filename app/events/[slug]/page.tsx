import EventSchema from './EventSchema';
import { createServerSupabaseClient } from '@/lib/supabase';
import { notFound } from 'next/navigation';

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

  const image =
    event.cover_image ||
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1200';

  return (
    <main className="max-w-6xl mx-auto px-4 md:px-6 pb-28">
      <EventSchema event={event} />

      <section className="relative h-[260px] md:h-[420px] rounded-2xl overflow-hidden">
        <img
          src={image}
          alt={event.title}
          className="w-full h-full object-cover"
        />

        <div className="absolute inset-0 bg-black/50"></div>

        <div className="absolute bottom-4 left-4 right-4 text-white">
          <h1 className="text-xl md:text-4xl font-bold leading-tight">
            {event.title}
          </h1>

          <p className="mt-1 text-xs md:text-sm opacity-90">
            {venue?.name} • {locality?.name}
          </p>
        </div>
      </section>

      <section className="mt-6 md:mt-8 grid md:grid-cols-3 gap-6 md:gap-8">
        <div className="md:col-span-2">
          <h2 className="text-lg md:text-xl font-semibold mb-2 md:mb-3">
            About Event
          </h2>

          <p className="text-gray-600 text-sm md:text-base leading-relaxed">
            {event.description || event.meta_description}
          </p>

          {categories.length > 0 && (
            <div className="mt-4 md:mt-6 flex flex-wrap gap-2">
              {categories.map((c: any) => (
                <a
                  key={c.id}
                  href={`/categories/${c.slug}`}
                  className="px-3 py-1 bg-gray-100 rounded-full text-xs md:text-sm hover:bg-gray-200 transition"
                >
                  {c.name}
                </a>
              ))}
            </div>
          )}

          <div className="mt-8 border-t pt-6">
            <h2 className="text-lg md:text-xl font-semibold mb-3">
              Explore Nearby
            </h2>

            <div className="flex flex-wrap gap-3 text-sm">
              {venue?.slug && (
                <a
                  href={`/venues/${venue.slug}`}
                  className="px-4 py-2 bg-gray-100 rounded-full hover:bg-gray-200 transition"
                >
                  More at {venue.name}
                </a>
              )}

              {locality?.slug && (
                <a
                  href={`/jaipur/${locality.slug}`}
                  className="px-4 py-2 bg-gray-100 rounded-full hover:bg-gray-200 transition"
                >
                  Things to do in {locality.name}
                </a>
              )}

              {categories.map((c: any) =>
                locality?.slug ? (
                  <a
                    key={`hybrid-${c.id}`}
                    href={`/events-in/${c.slug}/${locality.slug}`}
                    className="px-4 py-2 bg-gray-100 rounded-full hover:bg-gray-200 transition"
                  >
                    {c.name} in {locality.name}
                  </a>
                ) : null
              )}
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-4 md:p-5 shadow-sm md:sticky md:top-24">
          <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4">
            Event Details
          </h3>

          <div className="space-y-2 md:space-y-3 text-xs md:text-sm text-gray-600">
            {event.start_time && (
              <div>🕒 {new Date(event.start_time).toLocaleString()}</div>
            )}

            {venue?.slug && (
              <div>
                📍{' '}
                <a
                  href={`/venues/${venue.slug}`}
                  className="text-blue-600 hover:underline"
                >
                  {venue.name}
                </a>
              </div>
            )}

            {locality?.slug && (
              <div>
                📌{' '}
                <a
                  href={`/jaipur/${locality.slug}`}
                  className="text-blue-600 hover:underline"
                >
                  {locality.name}
                </a>
              </div>
            )}

            <div>
              💰 {event.price_min ? `₹${event.price_min}` : 'Free'}
            </div>
          </div>

          <button className="mt-6 w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition">
            Book Tickets
          </button>
        </div>
      </section>

      {moreFromVenue.length > 0 && (
        <section className="mt-12 md:mt-16">
          <h2 className="text-lg md:text-xl font-semibold mb-4">
            More events at {venue?.name}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {moreFromVenue.map((e: any) => (
              <a
                key={e.id}
                href={`/events/${e.slug}`}
                className="block border rounded-xl p-3 md:p-4 hover:shadow-md transition"
              >
                <h3 className="font-semibold text-sm md:text-base">{e.title}</h3>
                <p className="text-xs md:text-sm text-gray-500 mt-1">
                  {e.meta_description}
                </p>
              </a>
            ))}
          </div>
        </section>
      )}

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 md:hidden">
        <button className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold">
          Book Tickets
        </button>
      </div>
    </main>
  );
}
