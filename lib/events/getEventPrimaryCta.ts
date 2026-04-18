import type { EventDisplayState } from "@/lib/events/getEventDisplayState";

type EventLike = {
  registration_url?: string | null;
  source_url?: string | null;
  venue_name?: string | null;
  locality?: string | null;
  category?: string | null;
};

export type EventPrimaryCta = {
  label: string;
  href: string | null;
  kind: "booking" | "discovery" | "info";
};

export function getEventPrimaryCta(
  event: EventLike,
  state: EventDisplayState
): EventPrimaryCta {
  if (state === "ended") {
    return {
      label: "Find Similar Upcoming Events",
      href: "#similar-upcoming-events",
      kind: "discovery",
    };
  }

  if (state === "cancelled") {
    return {
      label: "Explore Similar Events",
      href: "#similar-upcoming-events",
      kind: "discovery",
    };
  }

  if (event.registration_url) {
    return {
      label: "Register Now",
      href: event.registration_url,
      kind: "booking",
    };
  }

  if (event.source_url) {
    return {
      label: "Get Tickets",
      href: event.source_url,
      kind: "booking",
    };
  }

  return {
    label: "View Event Details",
    href: null,
    kind: "info",
  };
}
