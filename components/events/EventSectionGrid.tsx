import EventCard from "@/components/EventCard";

export default function EventSectionGrid({
  title,
  description,
  events,
  emptyText,
}: {
  title: string;
  description?: string;
  events: any[];
  emptyText?: string;
}) {
  if (!Array.isArray(events) || events.length === 0) {
    if (!emptyText) return null;

    return (
      <section className="mt-12">
        <h2 className="text-xl font-semibold">{title}</h2>
        {description ? (
          <p className="mt-2 text-sm text-gray-600">{description}</p>
        ) : null}
        <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-600">
          {emptyText}
        </div>
      </section>
    );
  }

  return (
    <section className="mt-12">
      <h2 className="text-xl font-semibold">{title}</h2>
      {description ? (
        <p className="mt-2 text-sm text-gray-600">{description}</p>
      ) : null}

      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {events.map((event: any) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </section>
  );
}
