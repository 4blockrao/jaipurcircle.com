import {
  getEventCategoryLabel,
  getEventDateCompactLabel,
  getEventLocationLabel,
  getEventPriceLabel,
} from "@/lib/events/presentation";

export default function EventFacts({
  event,
  artists,
}: {
  event: any;
  artists: any[];
}) {
  return (
    <section className="mt-8 rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm">
      <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-6">
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Date</div>
          <div className="mt-2 text-sm font-medium text-gray-900">{getEventDateCompactLabel(event)}</div>
        </div>

        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Venue</div>
          <div className="mt-2 text-sm font-medium text-gray-900">{event?.venue_name || "Venue TBA"}</div>
        </div>

        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Location</div>
          <div className="mt-2 text-sm font-medium text-gray-900">{event?.locality || "Jaipur"}</div>
        </div>

        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Category</div>
          <div className="mt-2 text-sm font-medium text-gray-900">{getEventCategoryLabel(event)}</div>
        </div>

        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Price</div>
          <div className="mt-2 text-sm font-medium text-gray-900">{getEventPriceLabel(event)}</div>
        </div>

        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Artists</div>
          <div className="mt-2 text-sm font-medium text-gray-900">
            {artists?.length > 0
              ? artists.map((a: any) => a.name).join(", ")
              : "Not specified"}
          </div>
        </div>
      </div>

      <div className="mt-5 text-sm text-gray-500">
        {getEventLocationLabel(event)}
      </div>
    </section>
  );
}
