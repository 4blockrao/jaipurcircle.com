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

  const contextLine =
    event?.venue?.name
      ? `${event.venue.name} • ${event.locality?.name || "Jaipur"}`
      : locationLabel;

  return (
    <a
      href={`/events/${event.slug}`}
      className="group block overflow-hidden rounded-[1.6rem] border border-gray-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-2xl"
    >
      {/* IMAGE */}
      <div className="relative h-60 overflow-hidden rounded-t-[1.6rem]">
        <img
          src={image}
          alt={event?.title}
          className="h-full w-full object-cover transition duration-500 ease-out group-hover:scale-[1.06]"
        />

        {/* stronger gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        {/* TOP BADGES */}
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-white/15 px-3 py-1.5 text-[11px] font-medium text-white backdrop-blur-md">
            {categoryLabel}
          </span>

          <span
            className={`rounded-full px-3 py-1.5 text-[11px] font-semibold text-white ${
              archived ? "bg-amber-500/95" : "bg-blue-600/95"
            }`}
          >
            {statusLabel}
          </span>
        </div>

        {/* PRICE (stronger presence) */}
        <div className="absolute bottom-3 left-3">
          <span className="rounded-full bg-black/80 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md">
            {priceLabel}
          </span>
        </div>
      </div>

      {/* BODY */}
      <div className="p-5">
        {/* DATE */}
        <div className="text-xs font-medium text-gray-500">
          {dateLabel}
        </div>

        {/* TITLE */}
        <h3 className="mt-2 line-clamp-2 text-[17px] font-semibold leading-snug text-gray-900 transition-colors group-hover:text-blue-700">
          {event?.title}
        </h3>

        {/* CONTEXT LINE (NEW CORE UPGRADE) */}
        <div className="mt-2 text-[13px] text-gray-600 line-clamp-1">
          {contextLine}
        </div>

        {/* SIGNAL STRIP */}
        <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-gray-700">
            {categoryLabel}
          </span>

          {event?.is_free && (
            <span className="rounded-full bg-green-50 px-2.5 py-1 text-green-700">
              Free
            </span>
          )}

          {event?.format && (
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-blue-700">
              {event.format}
            </span>
          )}
        </div>

        {/* FOOTER */}
        <div className="mt-4 border-t border-gray-100 pt-4">
          <div className="flex items-center justify-between text-sm font-medium text-gray-800">
            <span>{archived ? "View archive" : "View details"}</span>

            <span className="text-lg text-blue-600 transition-all duration-300 group-hover:translate-x-1">
              →
            </span>
          </div>
        </div>
      </div>
    </a>
  );
}
