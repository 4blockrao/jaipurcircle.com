type EventLike = {
  title?: string | null;
  venue_name?: string | null;
  locality?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  price_min?: number | null;
  price_max?: number | null;
  ticket_price?: number | null;
  is_free?: boolean | null;
  organizer_name?: string | null;
  short_description?: string | null;
  description?: string | null;
  last_verified_at?: string | null;
};

function formatDateTime(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleString("en-IN", {
    dateStyle: "long",
    timeStyle: "short",
  });
}

function formatPrice(event: EventLike) {
  if (event.is_free) return "Entry is free";
  if (event.price_min) return `Tickets start from ₹${event.price_min}`;
  if (event.ticket_price) return `Tickets are priced at ₹${event.ticket_price}`;
  return null;
}

function formatVerified(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleDateString("en-IN", {
    dateStyle: "long",
  });
}

export function buildEventQuickAnswers(event: EventLike): string[] {
  const answers: string[] = [];

  const title = event.title || "This event";
  const venue = event.venue_name || "the venue";
  const locality = event.locality || "Jaipur";
  const start = formatDateTime(event.start_date);

  if (start) {
    answers.push(
      `${title} is happening at ${venue} in ${locality}, Jaipur, on ${start}.`
    );
  }

  const priceLine = formatPrice(event);
  if (priceLine) {
    answers.push(`${priceLine}.`);
  }

  if (event.organizer_name) {
    answers.push(`${title} is organized by ${event.organizer_name}.`);
  }

  if (event.short_description) {
    answers.push(event.short_description.trim().endsWith(".")
      ? event.short_description.trim()
      : `${event.short_description.trim()}.`);
  } else if (event.description) {
    const summary = event.description.trim().split(". ").slice(0, 1).join(". ").trim();
    if (summary) {
      answers.push(summary.endsWith(".") ? summary : `${summary}.`);
    }
  }

  const verified = formatVerified(event.last_verified_at);
  if (verified) {
    answers.push(`JaipurCircle last verified the event details on ${verified}.`);
  }

  return answers.slice(0, 6);
}
