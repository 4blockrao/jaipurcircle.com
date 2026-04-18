export type EventDisplayState = "upcoming" | "ongoing" | "ended";

export function pickEventDate(event: any): string | null {
  return event?.start_date || event?.start_time || null;
}

export function pickEventEndDate(event: any): string | null {
  return (
    event?.end_date ||
    event?.end_time ||
    event?.start_date ||
    event?.start_time ||
    null
  );
}

export function parseEventDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function getEventDisplayState(event: any): EventDisplayState {
  const now = new Date();
  const start = parseEventDate(pickEventDate(event));
  const end = parseEventDate(pickEventEndDate(event));

  if (!start) return "upcoming";
  if (!end) return start < now ? "ended" : "upcoming";

  if (end < now) return "ended";
  if (start > now) return "upcoming";
  return "ongoing";
}

export function formatEventDateTime(value: string | null | undefined): string {
  const date = parseEventDate(value);
  if (!date) return "Date TBA";

  return date.toLocaleString("en-IN", {
    dateStyle: "long",
    timeStyle: "short",
  });
}

export function formatEventDateTimeCompact(value: string | null | undefined): string {
  const date = parseEventDate(value);
  if (!date) return "Date TBA";

  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function isPublicEventRow(event: any): boolean {
  return (
    event?.status === "published" &&
    event?.editorial_status === "published" &&
    event?.index_status === "index"
  );
}

export function sortEventsByLifecycle(items: any[]): any[] {
  const now = new Date();

  return [...(items || [])].sort((a: any, b: any) => {
    const aDate = parseEventDate(pickEventDate(a));
    const bDate = parseEventDate(pickEventDate(b));

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

export function dedupeEventsById(items: any[]): any[] {
  const seen = new Set<string>();

  return (items || []).filter((item: any) => {
    if (!item?.id) return false;
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

export function trimEventSection(
  items: any[],
  {
    limit = 6,
    excludeIds = [],
  }: {
    limit?: number;
    excludeIds?: string[];
  } = {}
): any[] {
  const exclude = new Set(excludeIds || []);

  return dedupeEventsById(items || [])
    .filter((item: any) => item?.id && !exclude.has(item.id))
    .slice(0, limit);
}

export function hasMeaningfulEventSection(items: any[], min = 1): boolean {
  return Array.isArray(items) && items.length >= min;
}
