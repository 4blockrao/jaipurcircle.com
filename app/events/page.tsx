import { createServerSupabaseClient } from "@/lib/supabase";
import EventCard from "@/components/events/cards/EventCard";
import { sortEventsByLifecycle } from "@/lib/events/core";

export const metadata = {
  title: "Events in Jaipur | JaipurCircle",
  description:
    "Explore upcoming events and permanent event archives across Jaipur. JaipurCircle keeps event pages live even after the event ends, building a searchable city memory over time.",
};

export default async function EventsPage() {
  const supabase = createServerSupabaseClient();

  const { data: events } = await supabase
    .from("events")
    .select("*")
    .in("status", ["published", "upcoming"])
    .eq("editorial_status", "published")
    .eq("index_status", "index")
    .limit(120);

  const sorted = sortEventsByLifecycle(events || []);

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <div className="max-w-3xl">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">
          Events in Jaipur
        </h1>
        <p className="mt-4 text-base leading-7 text-gray-600">
          Discover upcoming events, recurring experiences, and permanent event
          archives across Jaipur. JaipurCircle keeps event pages live even after
          the event ends, so the city builds a searchable event memory over time.
        </p>
      </div>

      {sorted.length > 0 ? (
        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sorted.map((event: any) => (
            <EventCard key={event.id} event={event} variant="primary" />
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-8 text-gray-600">
          No events found right now.
        </div>
      )}
    </main>
  );
}
