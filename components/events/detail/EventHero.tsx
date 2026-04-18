import EventFreshnessBadge from "@/components/events/EventFreshnessBadge";
import {
  getEventCategoryLabel,
  getEventDateLabel,
  getEventDisplayLabel,
  getEventPriceLabel,
  getEventPrimaryImage,
  isEventArchived,
} from "@/lib/events/presentation";

export default function EventHero({
  event,
  artists = [],
}: {
  event: any;
  artists?: any[];
}) {
  const archived = isEventArchived(event);
  const image = getEventPrimaryImage(event);
  const categoryLabel = getEventCategoryLabel(event);
  const statusLabel = getEventDisplayLabel(event);
  const priceLabel = getEventPriceLabel(event);

  const subtitle =
    event?.short_description ||
    event?.meta_description ||
    event?.description ||
    `Explore full details, venue context, and related Jaipur recommendations for ${event?.title}.`;

  const artistNames =
    artists?.length > 0
      ? artists.map((artist: any) => artist?.name).filter(Boolean).join(", ")
      : null;

  const hasPrimaryLink = event?.registration_url || event?.source_url;
  const primaryHref = event?.registration_url || event?.source_url || "#";

  return (
    <section className="overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-sm">
      <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_1fr]">
        <div className="relative min-h-[320px] lg:min-h-[520px]">
          <img
            src={image}
            alt={event?.title || "Event image"}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />

          <div className="absolute left-5 top-5 flex flex-wrap gap-2">
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

          <div className="absolute bottom-5 left-5">
            <span className="rounded-full bg-black/65 px-3 py-1.5 text-sm font-medium text-white backdrop-blur">
              {priceLabel}
            </span>
          </div>
        </div>

        <div className="flex flex-col justify-center p-7 lg:p-10">
          <div className="mb-3 flex flex-wrap gap-2 lg:hidden">
            <span className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700">
              {categoryLabel}
            </span>
            <span
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                archived
                  ? "bg-amber-100 text-amber-800"
                  : "bg-blue-100 text-blue-800"
              }`}
            >
              {statusLabel}
            </span>
          </div>

          <h1 className="text-3xl font-bold leading-tight tracking-tight text-gray-900 lg:text-5xl">
            {event?.title}
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-gray-600 lg:text-base">
            {subtitle}
          </p>

          <div className="mt-6 space-y-2">
            <p className="text-base font-semibold text-gray-900 lg:text-lg">
              {getEventDateLabel(event)}
            </p>
            <p className="text-sm text-gray-600 lg:text-base">
              {event?.venue_name || "Venue TBA"}
              {event?.locality ? ` · ${event.locality}` : ""}
            </p>
          </div>

          <div className="mt-5">
            <EventFreshnessBadge
              lastVerifiedAt={event?.last_verified_at}
              updatedAt={event?.updated_at}
            />
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {archived ? (
              <div className="inline-flex rounded-2xl bg-gray-900 px-6 py-3 text-sm font-medium text-white">
                Event Closed
              </div>
            ) : hasPrimaryLink ? (
              <a
                href={primaryHref}
                className="inline-flex rounded-2xl bg-gray-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-black"
              >
                Book Tickets
              </a>
            ) : (
              <div className="inline-flex rounded-2xl bg-gray-900 px-6 py-3 text-sm font-medium text-white">
                View Details
              </div>
            )}

            {event?.venue_name ? (
              <a
                href={
                  event?.venue_slug
                    ? `/venues/${event.venue_slug}`
                    : event?.venue_name
                    ? `/venues/${String(event.venue_name)
                        .toLowerCase()
                        .replace(/[^a-z0-9\s-]/g, "")
                        .trim()
                        .replace(/\s+/g, "-")}`
                    : "#"
                }
                className="inline-flex rounded-2xl border border-gray-300 px-5 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                View venue page
              </a>
            ) : null}
          </div>

          <div className="mt-6 flex flex-wrap gap-x-5 gap-y-3 text-xs font-medium text-gray-500 lg:text-sm">
            <span>{priceLabel}</span>
            <span>{categoryLabel}</span>
            <span>{event?.is_online ? "Online" : "In-person"}</span>
            {artistNames ? <span>{artistNames}</span> : null}
          </div>
        </div>
      </div>
    </section>
  );
}
