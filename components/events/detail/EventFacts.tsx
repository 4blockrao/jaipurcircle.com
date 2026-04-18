import {
  getEventCategoryLabel,
  getEventDateCompactLabel,
  getEventPriceLabel,
} from "@/lib/events/presentation";

function FactTile({
  label,
  value,
  subvalue,
}: {
  label: string;
  value: string;
  subvalue?: string | null;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">
        {label}
      </div>
      <div className="mt-2 text-sm font-semibold leading-6 text-gray-900 lg:text-base">
        {value}
      </div>
      {subvalue ? (
        <div className="mt-1 text-xs leading-5 text-gray-500 lg:text-sm">
          {subvalue}
        </div>
      ) : null}
    </div>
  );
}

export default function EventFacts({
  event,
  artists,
}: {
  event: any;
  artists: any[];
}) {
  const artistNames =
    artists?.length > 0
      ? artists.map((a: any) => a?.name).filter(Boolean).join(", ")
      : "Not specified";

  return (
    <section className="mt-8">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <FactTile
          label="Date"
          value={getEventDateCompactLabel(event)}
          subvalue={`${event?.venue_name || "Venue TBA"}${event?.locality ? ` · ${event.locality}` : ""}`}
        />

        <FactTile
          label="Venue"
          value={event?.venue_name || "Venue TBA"}
          subvalue={event?.venue_address || null}
        />

        <FactTile
          label="Location"
          value={event?.locality || "Jaipur"}
          subvalue={event?.is_online ? "Online event" : "Jaipur, Rajasthan"}
        />

        <FactTile
          label="Category"
          value={getEventCategoryLabel(event)}
          subvalue={event?.organizer_name || null}
        />

        <FactTile
          label="Price"
          value={getEventPriceLabel(event)}
          subvalue={event?.is_free ? "No paid ticket required" : null}
        />

        <FactTile
          label="Artists"
          value={artistNames}
          subvalue={artists?.length > 0 ? `${artists.length} linked performer${artists.length > 1 ? "s" : ""}` : null}
        />
      </div>
    </section>
  );
}
