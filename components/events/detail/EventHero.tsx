import EventFreshnessBadge from "@/components/events/EventFreshnessBadge";
import {
  getEventCategoryLabel,
  getEventDateLabel,
  getEventDisplayLabel,
  getEventPrimaryImage,
  isEventArchived,
} from "@/lib/events/presentation";

export default function EventHero({
  event,
}: {
  event: any;
}) {
  const archived = isEventArchived(event);
  const image = getEventPrimaryImage(event);

  return (
    <section className="overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-sm">
      <div className="grid grid-cols-1 lg:grid-cols-2">
        <div className="relative min-h-[320px]">
          <img
            src={image}
            alt={event?.title || "Event image"}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        </div>

        <div className="flex flex-col justify-center p-8 lg:p-10">
          <div className="mb-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700">
              {getEventCategoryLabel(event)}
            </span>
            <span
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                archived
                  ? "bg-amber-100 text-amber-800"
                  : "bg-blue-100 text-blue-800"
              }`}
            >
              {getEventDisplayLabel(event)}
            </span>
          </div>

          <h1 className="text-3xl font-bold leading-tight text-gray-900 lg:text-4xl">
            {event?.title}
          </h1>

          <p className="mt-4 text-base leading-7 text-gray-600">
            {getEventDateLabel(event)}
          </p>

          <p className="mt-2 text-base leading-7 text-gray-600">
            {event?.venue_name || "Venue TBA"}, {event?.locality || "Jaipur"}
          </p>

          <div className="mt-5">
            <EventFreshnessBadge
              lastVerifiedAt={event?.last_verified_at}
              updatedAt={event?.updated_at}
            />
          </div>

          <div className="mt-8">
            {archived ? (
              <div className="inline-flex rounded-2xl bg-gray-900 px-6 py-3 text-sm font-medium text-white">
                Event Closed
              </div>
            ) : event?.registration_url || event?.source_url ? (
              <a
                href={event?.registration_url || event?.source_url}
                className="inline-flex rounded-2xl bg-gray-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-black"
              >
                Book Tickets
              </a>
            ) : (
              <div className="inline-flex rounded-2xl bg-gray-900 px-6 py-3 text-sm font-medium text-white">
                View Details
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
