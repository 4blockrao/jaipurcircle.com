type LocalityEventGridProps = {
  title?: string;
  description?: string;
  events?: any[];
  emptyText?: string;
  currentLocalityId?: string | null;
  currentLocalityName?: string | null;
};

function formatDate(value?: string | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getEventDate(event: any) {
  return event?.start_time || event?.start_date || event?.published_at || null;
}

function getEventImage(event: any) {
  return (
    event?.cover_image_url ||
    event?.image_url ||
    event?.cover_image ||
    "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=1200&auto=format&fit=crop"
  );
}

function getEventPrice(event: any) {
  if (event?.is_free) return "Free";
  if (event?.price_min) return `₹${event.price_min}${event?.price_max ? ` - ₹${event.price_max}` : ""}`;
  if (event?.ticket_price) return `₹${event.ticket_price}`;
  return "Price TBA";
}

function getPrimaryTag(event: any) {
  if (Array.isArray(event?.tags) && event.tags.length > 0) return event.tags[0];
  if (event?.category) return event.category;
  return "Event";
}

function prettifyLocality(value?: string | null) {
  if (!value) return "Jaipur";
  return value
    .replace(/-/g, " ")
    .replace(/\b\w/g, (m: string) => m.toUpperCase());
}

function getLocalityBadge(
  event: any,
  currentLocalityId?: string | null,
  currentLocalityName?: string | null
) {
  if (currentLocalityId && event?.locality_id === currentLocalityId) {
    return {
      label: `In ${currentLocalityName || "this locality"}`,
      className: "bg-green-50 text-green-700",
    };
  }

  if (event?.locality) {
    return {
      label: prettifyLocality(event.locality),
      className: "bg-gray-100 text-gray-700",
    };
  }

  return {
    label: "Jaipur",
    className: "bg-gray-100 text-gray-700",
  };
}

export default function LocalityEventGrid({
  title,
  description,
  events = [],
  emptyText,
  currentLocalityId,
  currentLocalityName,
}: LocalityEventGridProps) {
  if (!events?.length) {
    if (!emptyText) return null;

    return (
      <section className="mt-12">
        {title ? (
          <div className="mb-5">
            <h2 className="text-2xl font-semibold text-gray-900">{title}</h2>
            {description ? (
              <p className="mt-2 text-sm text-gray-600">{description}</p>
            ) : null}
          </div>
        ) : null}

        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-600">
          {emptyText}
        </div>
      </section>
    );
  }

  return (
    <section className="mt-12">
      {title ? (
        <div className="mb-5">
          <h2 className="text-2xl font-semibold text-gray-900">{title}</h2>
          {description ? (
            <p className="mt-2 text-sm text-gray-600">{description}</p>
          ) : null}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {events.map((event: any) => {
          const localityBadge = getLocalityBadge(
            event,
            currentLocalityId,
            currentLocalityName
          );

          return (
            <a
              key={event.id}
              href={`/events/${event.slug}`}
              className="group block overflow-hidden rounded-[1.6rem] border border-gray-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-2xl"
            >
              <div className="relative h-60 overflow-hidden rounded-t-[1.6rem]">
                <img
                  src={getEventImage(event)}
                  alt={event?.title || "Event"}
                  className="h-full w-full object-cover transition duration-500 ease-out group-hover:scale-[1.06]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-white/15 px-3 py-1.5 text-[11px] font-medium text-white backdrop-blur-md">
                    {prettifyLocality(getPrimaryTag(event))}
                  </span>

                  <span className="rounded-full bg-blue-600/95 px-3 py-1.5 text-[11px] font-semibold text-white">
                    {new Date(getEventDate(event) || "").getTime() > Date.now()
                      ? "Upcoming"
                      : "Event Closed"}
                  </span>

                  <span
                    className={`rounded-full px-3 py-1.5 text-[11px] font-semibold ${localityBadge.className}`}
                  >
                    {localityBadge.label}
                  </span>
                </div>

                <div className="absolute bottom-3 left-3">
                  <span className="rounded-full bg-black/80 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md">
                    {getEventPrice(event)}
                  </span>
                </div>
              </div>

              <div className="p-5">
                <div className="text-xs font-medium text-gray-500">
                  {formatDate(getEventDate(event))}
                </div>

                <h3 className="mt-2 line-clamp-2 text-[17px] font-semibold leading-snug text-gray-900 transition-colors group-hover:text-blue-700">
                  {event?.title}
                </h3>

                <div className="mt-2 line-clamp-1 text-[13px] text-gray-600">
                  {[event?.venue_name, prettifyLocality(event?.locality)]
                    .filter(Boolean)
                    .join(" • ")}
                </div>

                <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                  <span className="rounded-full bg-gray-100 px-2.5 py-1 text-gray-700">
                    {prettifyLocality(getPrimaryTag(event))}
                  </span>
                  {event?.is_free ? (
                    <span className="rounded-full bg-green-50 px-2.5 py-1 text-green-700">
                      Free
                    </span>
                  ) : null}
                </div>

                <div className="mt-4 border-t border-gray-100 pt-4">
                  <div className="flex items-center justify-between text-sm font-medium text-gray-800">
                    <span>
                      {new Date(getEventDate(event) || "").getTime() > Date.now()
                        ? "View details"
                        : "View archive"}
                    </span>
                    <span className="text-lg text-blue-600 transition-all duration-300 group-hover:translate-x-1">
                      →
                    </span>
                  </div>
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </section>
  );
}
