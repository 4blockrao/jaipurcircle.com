import EventCardPrimary from "./EventCardPrimary";
import EventCardCompact from "./EventCardCompact";

export default function EventCard({
  event,
  variant = "primary",
}: {
  event: any;
  variant?: "primary" | "compact";
}) {
  if (variant === "compact") {
    return <EventCardCompact event={event} />;
  }

  return <EventCardPrimary event={event} />;
}
