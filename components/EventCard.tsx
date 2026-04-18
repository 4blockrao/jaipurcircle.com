import {
  formatEventDateTimeCompact,
  getEventDisplayState,
} from "@/lib/events/core";

function resolveImage(event: any) {
  return (
    event?.cover_image_url ||
    event?.image_url ||
    event?.cover_image ||
    "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=1200"
  );
}

function resolveVenue(event: any) {
  return event?.venue_name || "Venue TBA";
}

function resolveLocality(event: any) {
  return event?.locality || "Jaipur";
}

function resolvePrice(event: any) {
  if (event?.is_free) return "Free";
  if (event?.price_min) return `₹${event.price_min}`;
  if (event?.ticket_price) return `₹${event.ticket_price}`;
  if (event?.price_max) return `Up to ₹${event.price_max}`;
  return "Price TBA";
}

function resolveCategory(event: any) {
  if (!event?.category) return "Event";
  return String(event.category).replace(/-/g, " ");
}

function resolveDescription(event: any) {
  return (
    event?.short_description ||
    event?.meta_description ||
    event?.description ||
    "Explore this Jaipur event."
  );
}

function resolveStatusLabel(event: any) {
  const state = getEventDisplayState(event);

  switch (state) {
    case "ended":
      return "Event Closed";
    case "ongoing":
      return "Live Now";
    default:
      return "Upcoming";
  }
}

export default function EventCard({ event }: { event: any }) {
  const image = resolveImage(event);
  const venue = resolveVenue(event);
  const locality = resolveLocality(event);
  const price = resolvePrice(event);
  const statusLabel = resolveStatusLabel(event);
  const category = resolveCategory(event);
  const dateTime = formatEventDateTimeCompact(event?.start_date || event?.start_time);
  const description = resolveDescription(event);
  const isEnded = statusLabel === "Event Closed";

  return (
    <a
      href={`/events/${event.slug}`}
      className="group block overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="relative h-52 overflow-hidden">
        <img
          src={image}
          alt={event?.title || "Event image"}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium text-white backdrop-blur">
            {category}
          </span>

          <span
            className={`rounded-full px-3 py-1.5 text-xs font-medium text-white ${
              isEnded ? "bg-amber-500" : statusLabel === "Live Now" ? "bg-emerald-500" : "bg-blue-600"
            }`}
          >
            {statusLabel}
          </span>
        </div>

        <div className="absolute bottom-4 left-4">
          <span className="rounded-full bg-black/60 px-3 py-1.5 text-sm font-medium text-white backdrop-blur">
            {price}
          </span>
        </div>
      </div>

      <div className="p-5">
        <div className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
          {dateTime}
        </div>

        <h3 className="line-clamp-2 text-lg font-semibold leading-snug text-gray-900 transition group-hover:text-blue-600">
          {event?.title}
        </h3>

        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-gray-600">
          {description}
        </p>

        <div className="mt-4 space-y-2 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <span>📍</span>
            <span className="line-clamp-1">
              {venue}
              {locality ? ` • ${locality}` : ""}
            </span>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">
          <span className="text-sm font-medium text-gray-700">
            {isEnded ? "View archive" : "View details"}
          </span>
          <span className="text-lg font-semibold text-blue-600 transition group-hover:translate-x-1">
            →
          </span>
        </div>
      </div>
    </a>
  );
}
