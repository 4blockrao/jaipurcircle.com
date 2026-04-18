import {
  getEventCategoryLabel,
  getEventDateCompactLabel,
  getEventDisplayLabel,
  getEventLocationLabel,
  getEventPriceLabel,
  getEventPrimaryImage,
  isEventArchived,
} from "@/lib/events/presentation";

export default function EventCardPrimary({ event }: { event: any }) {
  const archived = isEventArchived(event);
  const statusLabel = getEventDisplayLabel(event);
  const categoryLabel = getEventCategoryLabel(event);
  const dateLabel = getEventDateCompactLabel(event);
  const locationLabel = getEventLocationLabel(event);
  const priceLabel = getEventPriceLabel(event);
  const image = getEventPrimaryImage(event);

  return (
    <a
      href={`/events/${event.slug}`}
      className="group block overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="relative h-56 overflow-hidden">
        <img
          src={image}
          alt={event?.title || "Event image"}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium text-white backdrop-blur">
            {categoryLabel}
          </span>

          <span
            className={`rounded-full px-3 py-1.5 text-xs font-medium text-white ${
              archived ? "bg-amber-500/95" : "bg-blue-600/95"
            }`}
          >
            {statusLabel}
          </span>
        </div>

        <div className="absolute bottom-4 left-4">
          <span className="rounded-full bg-black/60 px-3 py-1.5 text-sm font-medium text-white backdrop-blur">
            {priceLabel}
          </span>
        </div>
      </div>

      <div className="p-5">
        <div className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
          {dateLabel}
        </div>

        <h3 className="line-clamp-2 text-lg font-semibold leading-snug text-gray-900 transition group-hover:text-blue-600">
          {event?.title}
        </h3>

        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-gray-600">
          {event?.short_description ||
            event?.meta_description ||
            event?.description ||
            "Explore this Jaipur event."}
        </p>

        <div className="mt-4 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <span>📍</span>
            <span className="line-clamp-1">{locationLabel}</span>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">
          <span className="text-sm font-medium text-gray-700">
            {archived ? "View archive" : "View details"}
          </span>
          <span className="text-lg font-semibold text-blue-600 transition group-hover:translate-x-1">
            →
          </span>
        </div>
      </div>
    </a>
  );
}
