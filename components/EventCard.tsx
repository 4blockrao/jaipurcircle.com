export default function EventCard({ event }: { event: any }) {
  const image =
    event?.cover_image_url ||
    event?.image_url ||
    event?.cover_image ||
    "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=1200";

  const venue = event?.venue_name || "Venue TBA";
  const locality = event?.locality || "Jaipur";

  const price = event?.is_free
    ? "Free"
    : event?.price_min
    ? `₹${event.price_min}`
    : event?.ticket_price
    ? `₹${event.ticket_price}`
    : "Price TBA";

  const status = event?.status || "upcoming";

  return (
    <a
      href={`/events/${event.slug}`}
      className="group block bg-white rounded-2xl overflow-hidden border hover:shadow-xl transition"
    >
      <div className="h-44 relative">
        <img src={image} className="w-full h-full object-cover" />

        <div className="absolute bottom-3 left-3 text-white text-sm bg-black/60 px-2 py-1 rounded">
          {price}
        </div>
      </div>

      <div className="p-5">
        <h3 className="text-lg font-semibold">
          {event.title}
        </h3>

        <p className="text-sm text-gray-500 mt-1">
          {venue} • {locality}
        </p>

        <div className="mt-3 text-xs text-gray-400">
          {status === 'past' ? 'Past Event' : 'Upcoming'}
        </div>
      </div>
    </a>
  );
}
