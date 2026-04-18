export default function EventSummary({
  event,
}: {
  event: any;
}) {
  const summary =
    event?.short_description ||
    event?.meta_description ||
    event?.description ||
    `Explore details, timing, venue context, and related Jaipur recommendations for ${event?.title}.`;

  return (
    <section className="mt-10">
      <div className="max-w-4xl">
        <h2 className="text-2xl font-semibold tracking-tight text-gray-900">
          About this event
        </h2>
        <p className="mt-4 text-base leading-8 text-gray-650 text-gray-700">
          {summary}
        </p>
      </div>
    </section>
  );
}
