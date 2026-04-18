import {
  getEventDateCompactLabel,
  getEventDisplayLabel,
  getEventLocationLabel,
  getEventPrimaryImage,
  isEventArchived,
} from "@/lib/events/presentation";

export default function EventCardCompact({ event }: { event: any }) {
  const archived = isEventArchived(event);
  const image = getEventPrimaryImage(event);

  return (
    <a
      href={`/events/${event.slug}`}
      className="group flex gap-4 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm transition duration-300 hover:shadow-md"
    >
      <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl">
        <img
          src={image}
          alt={event?.title || "Event image"}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
              archived
                ? "bg-amber-100 text-amber-800"
                : "bg-blue-100 text-blue-800"
            }`}
          >
            {getEventDisplayLabel(event)}
          </span>
        </div>

        <h3 className="line-clamp-2 text-sm font-semibold text-gray-900">
          {event?.title}
        </h3>

        <p className="mt-1 line-clamp-1 text-xs text-gray-500">
          {getEventDateCompactLabel(event)}
        </p>

        <p className="mt-1 line-clamp-1 text-xs text-gray-500">
          {getEventLocationLabel(event)}
        </p>
      </div>
    </a>
  );
}
