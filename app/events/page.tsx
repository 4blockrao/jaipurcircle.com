import { createServerSupabaseClient } from "@/lib/supabase";
import EventCard from "@/components/EventCard";

export const metadata = {
  title: "Events in Jaipur | JaipurCircle",
  description:
    "Explore upcoming events and permanent event archives across Jaipur. JaipurCircle keeps event pages live even after the event ends, building a searchable city memory over time.",
};

function pickEventDate(event: any) {
  return event?.start_date || event?.start_time || null;
}

function sortEvents(items: any[]) {
  const now = new Date();

  return [...(items || [])].sort((a: any, b: any) => {
    const aRaw = pickEventDate(a);
    const bRaw = pickEventDate(b);

    const aDate = aRaw ? new Date(aRaw) : null;
    const bDate = bRaw ? new Date(bRaw) : null;

    if (!aDate && !bDate) return 0;
    if (!aDate) return 1;
    if (!bDate) return -1;

    const aUpcoming = aDate >= now;
    const bUpcoming = bDate >= now;

    if (aUpcoming && !bUpcoming) return -1;
    if (!aUpcoming && bUpcoming) return 1;

    if (aUpcoming && bUpcoming) return aDate.getTime() - bDate.getTime();
    return bDate.getTime() - aDate.getTime();
  });
}

export default async function EventsPage() {
  const supabase = createServerSupabaseClient();

  const { data: events } = await supabase
    .from("events")
    .select("*")
    .eq("status", "published")
    .eq("editorial_status", "published")
    .eq("index_status", "index")
    .limit(120);

  const sorted = sortEvents(events || []);

  return (
    <main className="max-w-7xl mx-auto px-4 py-10">
      <h1 className="text-3xl md:text-4xl font-bold">Events in Jaipur</h1>

      <p className="mt-3 max-w-3xl text-gray-600">
        Explore upcoming events, recurring experiences, and permanent event archives across Jaipur.
        JaipurCircle keeps event pages live even after the event ends, so the city builds a searchable
        event memory over time.
      </p>

      {sorted.length > 0 ? (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sorted.map((event: any) => (
            <EventCard key={event.id} event={event} />
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
