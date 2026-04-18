import EventCard from "@/components/events/cards/EventCard";

export default function EventSectionGrid({
  title,
  description,
  events,
  emptyText = "No events found.",
  variant = "primary",
}: {
  title: string;
  description?: string;
  events: any[];
  emptyText?: string;
  variant?: "primary" | "compact";
}) {
  if (!events || events.length === 0) return null;

  return (
    <section className="mt-12">
      <div className="mb-5">
        <h2 className="text-2xl font-semibold text-gray-900">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-gray-600">{description}</p>
        ) : null}
      </div>

      <div
        className={
          variant === "compact"
            ? "grid grid-cols-1 gap-4"
            : "grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
        }
      >
        {events.map((event: any) => (
          <EventCard key={event.id} event={event} variant={variant} />
        ))}
      </div>
    </section>
  );
}
