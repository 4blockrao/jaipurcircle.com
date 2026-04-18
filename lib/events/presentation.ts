import { getEventDisplayState, parseEventDate, pickEventDate } from "@/lib/events/core";

export function isEventArchived(event: any): boolean {
  return getEventDisplayState(event) === "ended";
}

export function getEventDisplayLabel(event: any): string {
  return isEventArchived(event) ? "Event Closed" : "Upcoming";
}

export function getEventCategoryLabel(event: any): string {
  const raw = event?.category || "Event";
  return String(raw)
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function getEventDateLabel(event: any): string {
  const value = pickEventDate(event);
  const date = parseEventDate(value);
  if (!date) return "Date TBA";

  return date.toLocaleString("en-IN", {
    dateStyle: "long",
    timeStyle: "short",
  });
}

export function getEventDateCompactLabel(event: any): string {
  const value = pickEventDate(event);
  const date = parseEventDate(value);
  if (!date) return "Date TBA";

  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function getEventLocationLabel(event: any): string {
  const venue = event?.venue_name || "Venue TBA";
  const locality = event?.locality || "Jaipur";
  return `${venue} • ${locality}`;
}

export function getEventPriceLabel(event: any): string {
  if (event?.is_free) return "Free";
  if (event?.price_min) return `₹${event.price_min} onwards`;
  if (event?.ticket_price) return `₹${event.ticket_price}`;
  if (event?.price_max) return `Up to ₹${event.price_max}`;
  return "Price TBA";
}

export function getEventPrimaryImage(event: any): string {
  return (
    event?.cover_image_url ||
    event?.image_url ||
    event?.cover_image ||
    "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=1200"
  );
}
