export type EventDisplayState =
  | "upcoming"
  | "today"
  | "live"
  | "ended"
  | "cancelled"
  | "postponed"
  | "rescheduled";

type EventLike = {
  start_date: string | null;
  end_date: string | null;
  status?: string | null;
};

export function getEventDisplayState(
  event: EventLike,
  now = new Date()
): EventDisplayState {
  const status = (event.status || "").toLowerCase();

  if (status === "cancelled") return "cancelled";
  if (status === "postponed") return "postponed";
  if (status === "rescheduled") return "rescheduled";

  const start = event.start_date ? new Date(event.start_date) : null;
  const end = event.end_date ? new Date(event.end_date) : null;

  if (!start) return "upcoming";

  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  if (end && now > end) return "ended";
  if (!end && start < now) return "ended";

  if (start <= now && end && now <= end) return "live";
  if (start >= todayStart && start <= todayEnd) return "today";

  return "upcoming";
}
