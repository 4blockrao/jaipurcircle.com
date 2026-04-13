export default function EventSchema({ event }: { event: any }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Event",
          "name": event.title,
          "startDate": event.start_time,
          "location": {
            "@type": "Place",
            "name": event.venue_name,
            "address": {
              "@type": "PostalAddress",
              "addressLocality": "Jaipur",
              "addressCountry": "IN"
            }
          },
          "image": event.image_url,
          "description": event.description,
          "eventStatus": "https://schema.org/EventScheduled",
          "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode"
        }),
      }}
    />
  );
}
