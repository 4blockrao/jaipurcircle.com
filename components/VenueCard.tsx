export default function VenueCard({ venue }: { venue: any }) {
  return (
    <a
      href={`/venues/${venue.slug}`}
      className="card p-5 block"
    >
      <h3 className="text-lg font-semibold">
        {venue.name}
      </h3>

      <p className="text-sm text-gray-500 mt-2">
        {venue.meta_description || 'Popular venue in Jaipur'}
      </p>
    </a>
  );
}
