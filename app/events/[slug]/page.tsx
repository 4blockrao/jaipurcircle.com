import { notFound } from "next/navigation";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_BASE || "";

async function getEvent(slug: string) {
  if (!API) {
    console.error("NEXT_PUBLIC_API_BASE is missing");
    return null;
  }

  try {
    const res = await fetch(`${API}/event-ssr?slug=${encodeURIComponent(slug)}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      console.error("event-ssr failed", res.status, slug);
      return null;
    }

    const text = await res.text();

    try {
      return JSON.parse(text);
    } catch (err) {
      console.error("event-ssr returned invalid JSON", slug, text?.slice(0, 300));
      return null;
    }
  } catch (err) {
    console.error("event-ssr fetch crashed", slug, err);
    return null;
  }
}

export default async function EventPage({
  params,
}: {
  params: Promise<{ slug: string }> | { slug: string };
}) {
  const resolved = await Promise.resolve(params);
  const slug = resolved?.slug;

  if (!slug) return notFound();

  const data = await getEvent(slug);

  if (!data || !data.event) return notFound();

  const event = data.event;
  const related = Array.isArray(data.related) ? data.related : [];
  const sameLocalityEvents = Array.isArray(data.same_locality_events)
    ? data.same_locality_events
    : [];
  const nearbyLocalityEvents = Array.isArray(data.nearby_locality_events)
    ? data.nearby_locality_events
    : [];

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">{event.title}</h1>

      {event.start_time ? (
        <p className="text-gray-600 mb-4">{event.start_time}</p>
      ) : null}

      {event.locality_slug && event.locality_name ? (
        <section className="mb-10 p-4 border rounded-lg bg-gray-50">
          <h2 className="text-lg font-semibold mb-2">
            Happening in {event.locality_name}
          </h2>

          <p className="text-gray-700 mb-3">
            This event is happening in <strong>{event.locality_name}</strong>, one
            of Jaipur’s active areas for events, experiences, and local discovery.
          </p>

          <Link
            href={`/jaipur/${event.locality_slug}`}
            className="text-blue-600 font-medium hover:underline"
          >
            Explore {event.locality_name} →
          </Link>
        </section>
      ) : null}

      {sameLocalityEvents.length > 0 ? (
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">
            More events in {event.locality_name || "this locality"}
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            {sameLocalityEvents.map((e: any) => (
              <Link
                key={e.slug}
                href={`/events/${e.slug}`}
                className="border rounded-lg p-4 hover:shadow transition"
              >
                <h3 className="font-semibold">{e.title}</h3>
                {e.start_time ? (
                  <p className="text-sm text-gray-500">{e.start_time}</p>
                ) : null}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {nearbyLocalityEvents.length > 0 ? (
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">
            Events near {event.locality_name || "this area"}
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            {nearbyLocalityEvents.map((e: any) => (
              <Link
                key={e.slug}
                href={`/events/${e.slug}`}
                className="border rounded-lg p-4 hover:shadow transition"
              >
                <h3 className="font-semibold">{e.title}</h3>
                {e.locality_name ? (
                  <p className="text-sm text-gray-500">{e.locality_name}</p>
                ) : null}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {related.length > 0 ? (
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">
            Similar events you may like
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            {related.map((e: any) => (
              <Link
                key={e.slug}
                href={`/events/${e.slug}`}
                className="border rounded-lg p-4 hover:shadow transition"
              >
                <h3 className="font-semibold">{e.title}</h3>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-12">
        <h2 className="text-xl font-semibold mb-3">Event history & discovery</h2>

        <p className="text-gray-700">
          This event page remains part of JaipurCircle’s permanent archive. Even
          after the event ends, you can continue discovering similar experiences,
          venues, and upcoming events across Jaipur.
        </p>
      </section>
    </main>
  );
}
