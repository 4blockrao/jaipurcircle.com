import EventSectionGrid from "@/components/events/EventSectionGrid";

export default function EventRecommendations({
  sections,
}: {
  sections: Array<{
    key: string;
    title: string;
    description?: string;
    events: any[];
  }>;
}) {
  if (!sections || sections.length === 0) return null;

  return (
    <section className="mt-8">
      {sections.map((section) => (
        <EventSectionGrid
          key={section.key}
          title={section.title}
          description={section.description}
          events={section.events}
          emptyText=""
          variant="primary"
        />
      ))}
    </section>
  );
}
