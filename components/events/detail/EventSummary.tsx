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
    <section className="mt-8 rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-semibold text-gray-900">About this event</h2>
      <p className="mt-4 text-base leading-7 text-gray-600">{summary}</p>
    </section>
  );
}
