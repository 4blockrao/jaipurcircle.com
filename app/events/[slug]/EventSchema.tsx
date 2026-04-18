import Script from "next/script";
import {
  pickEventDate,
  pickEventEndDate,
  getEventDisplayState,
} from "@/lib/events/core";

function buildEventStatus(event: any) {
  const state = getEventDisplayState(event);

  if (state === "ended") {
    return "https://schema.org/EventScheduled";
  }

  return "https://schema.org/EventScheduled";
}

function buildAttendanceMode(event: any) {
  if (event?.is_online) {
    return "https://schema.org/OnlineEventAttendanceMode";
  }

  return "https://schema.org/OfflineEventAttendanceMode";
}

function resolveImage(event: any) {
  return (
    event?.cover_image_url ||
    event?.image_url ||
    event?.cover_image ||
    null
  );
}

function buildLocation(event: any, venue: any, locality: any) {
  if (event?.is_online) {
    return {
      "@type": "VirtualLocation",
      url: event?.online_url || event?.registration_url || event?.source_url || undefined,
    };
  }

  return {
    "@type": "Place",
    name: event?.venue_name || venue?.name || "Venue TBA",
    address: {
      "@type": "PostalAddress",
      streetAddress: event?.venue_address || venue?.address || undefined,
      addressLocality: locality?.name || event?.locality || "Jaipur",
      addressRegion: "Rajasthan",
      addressCountry: "IN",
    },
  };
}

function buildOffers(event: any) {
  if (event?.is_free) {
    return {
      "@type": "Offer",
      price: 0,
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
      url: event?.registration_url || event?.source_url || undefined,
    };
  }

  if (event?.price_min || event?.ticket_price || event?.registration_url || event?.source_url) {
    return {
      "@type": "Offer",
      price: event?.price_min || event?.ticket_price || undefined,
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
      url: event?.registration_url || event?.source_url || undefined,
    };
  }

  return undefined;
}

export default function EventSchema({
  event,
  venue,
  locality,
  categories = [],
  artists = [],
}: {
  event: any;
  venue?: any;
  locality?: any;
  categories?: any[];
  artists?: any[];
}) {
  const startDate = pickEventDate(event);
  const endDate = pickEventEndDate(event);
  const image = resolveImage(event);
  const offers = buildOffers(event);

  const schema: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event?.title,
    description:
      event?.meta_description ||
      event?.short_description ||
      event?.description ||
      event?.seo_blurb ||
      undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    eventStatus: buildEventStatus(event),
    eventAttendanceMode: buildAttendanceMode(event),
    location: buildLocation(event, venue, locality),
    organizer: event?.organizer_name
      ? {
          "@type": "Organization",
          name: event.organizer_name,
        }
      : undefined,
    performer:
      Array.isArray(artists) && artists.length > 0
        ? artists.map((artist: any) => ({
            "@type": "Person",
            name: artist?.name,
            url: artist?.slug
              ? `https://www.jaipurcircle.com/artists/${artist.slug}`
              : undefined,
          }))
        : undefined,
    image: image ? [image] : undefined,
    offers,
    eventAttendanceModeUrl: undefined,
    url: `https://www.jaipurcircle.com/events/${event?.slug}`,
    eventCategory:
      categories?.[0]?.name || event?.category || undefined,
  };

  const cleaned = JSON.parse(
    JSON.stringify(schema, (_, value) => (value === undefined ? undefined : value))
  );

  return (
    <Script
      id="event-jsonld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(cleaned) }}
    />
  );
}
