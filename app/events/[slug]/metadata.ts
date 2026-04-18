import { createServerSupabaseClient } from "@/lib/supabase";
import {
  pickEventDate,
  getEventDisplayState,
  formatEventDateTime,
} from "@/lib/events/core";

export async function generateMetadata(
  props: { params: Promise<{ slug: string }> }
) {
  const { slug } = await props.params;
  const supabase = createServerSupabaseClient();

  const { data: event } = await supabase
    .from("events")
    .select("title, venue_name, locality, start_date, start_time, meta_title, meta_description, canonical_url")
    .eq("slug", slug)
    .single();

  if (!event) {
    return {
      title: "Event not found | JaipurCircle",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const state = getEventDisplayState(event);
  const dateLabel = formatEventDateTime(pickEventDate(event));
  const canonical = event.canonical_url
    ? `https://www.jaipurcircle.com${event.canonical_url}`
    : `https://www.jaipurcircle.com/events/${slug}`;

  const fallbackTitle =
    state === "ended"
      ? `${event.title} in Jaipur | Past Event Archive | JaipurCircle`
      : `${event.title} in Jaipur | ${dateLabel} | JaipurCircle`;

  const fallbackDescription =
    state === "ended"
      ? `${event.title} was held at ${event.venue_name || "a Jaipur venue"}, ${event.locality || "Jaipur"}. Explore past event details and similar upcoming Jaipur events on JaipurCircle.`
      : `${event.title} at ${event.venue_name || "Venue TBA"}, ${event.locality || "Jaipur"}, Jaipur on ${dateLabel}. Find details, timing, and related Jaipur events.`;

  return {
    title: event.meta_title || fallbackTitle,
    description: event.meta_description || fallbackDescription,
    alternates: {
      canonical,
    },
    openGraph: {
      title: event.meta_title || fallbackTitle,
      description: event.meta_description || fallbackDescription,
      url: canonical,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: event.meta_title || fallbackTitle,
      description: event.meta_description || fallbackDescription,
    },
  };
}
