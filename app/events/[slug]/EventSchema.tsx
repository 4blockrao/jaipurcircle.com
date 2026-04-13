export default function EventSchema({
  event,
  venue,
  locality,
  categories,
  artists,
}: {
  event: any;
  venue?: any;
  locality?: any;
  categories?: any[];
  artists?: any[];
}) {
  const isPast =
    event?.status === 'past' ||
    (event?.start_time && new Date(event.start_time).getTime() < Date.now());

  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event?.title,
    description: event?.meta_description || event?.description || event?.title,
    startDate: event?.start_time || event?.start_date || null,
    endDate: event?.end_date || null,
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    eventStatus: isPast
      ? 'https://schema.org/EventCompleted'
      : 'https://schema.org/EventScheduled',
    image: [
      event?.cover_image ||
        event?.image_url ||
        'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1200',
    ],
    location: {
      '@type': 'Place',
      name: venue?.name || 'Jaipur Venue',
      address: {
        '@type': 'PostalAddress',
        addressLocality: locality?.name || 'Jaipur',
        addressRegion: 'Rajasthan',
        addressCountry: 'IN',
      },
    },
    offers: {
      '@type': 'Offer',
      price: event?.price_min || '0',
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock',
      url: event?.canonical_url || undefined,
    },
  };

  if (artists?.length) {
    schema.performer = artists.map((artist: any) => ({
      '@type': 'Person',
      name: artist.artist_name || artist.name,
      url: artist.artist_slug
        ? `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/artists/${artist.artist_slug}`
        : undefined,
    }));
  }

  if (categories?.length) {
    schema.keywords = categories.map((c: any) => c.name).join(', ');
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schema),
      }}
    />
  );
}
