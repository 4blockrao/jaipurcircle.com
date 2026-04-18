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

  const description =
    event?.short_description ||
    event?.meta_description ||
    event?.description ||
    "Explore this Jaipur event.";

  return (
    <a
      href={`/events/${event.slug}`}
      className="group block overflow-hidden rounded-[1.6rem] border border-gray-200 bg-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-xl"
    >
      <div className="relative h-60 overflow-hidden rounded-t-[1.6rem]">
        <img
          src={image}
          alt={event?.title || "Event image"}
          className="h-full w-full object-cover transition duration-300 ease-out group-hover:scale-[1.03]"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-white/15 px-3 py-1.5 text-[11px] font-medium text-white backdrop-blur-sm">
            {categoryLabel}
          </span>

          <span
            className={`rounded-full px-3 py-1.5 text-[11px] font-medium text-white ${
              archived ? "bg-amber-500/95" : "bg-blue-600/95"
            }`}
          >
            {statusLabel}
          </span>
        </div>

        <div className="absolute bottom-3 left-3">
          <span className="rounded-full bg-black/70 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
            {priceLabel}
          </span>
        </div>
      </div>

      <div className="p-5">
        <div className="text-xs font-medium text-gray-500">
          {dateLabel}
        </div>

        <h3 className="mt-2 line-clamp-2 text-[17px] font-semibold leading-snug text-gray-900 transition-colors group-hover:text-blue-700">
          {event?.title}
        </h3>

        <p className="mt-2 line-clamp-2 text-[13px] leading-6 text-gray-500">
          {description}
        </p>

        <div className="mt-3 flex items-start gap-2 text-[13px] leading-5 text-gray-600">
          <span className="mt-0.5 shrink-0">📍</span>
          <span className="line-clamp-1">{locationLabel}</span>
        </div>

        <div className="mt-4 border-t border-gray-100 pt-4">
          <div className="flex items-center justify-between text-sm font-medium text-gray-800">
            <span>{archived ? "View archive" : "View details"}</span>
            <span className="text-lg text-blue-600 transition-transform duration-300 group-hover:translate-x-1">
              →
            </span>
          </div>
        </div>
      </div>
    </a>
  );
}
