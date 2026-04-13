export default function EventCard({ event }: { event: any }) {
  const image =
    event.cover_image ||
    "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=1200";

  return (
    <a
      href={`/events/${event.slug}`}
      className="group block bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300"
    >
      {/* IMAGE */}
      <div className="h-44 relative overflow-hidden">
        <img
          src={image}
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
        />

        {/* OVERLAY */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>

        {/* PRICE BADGE */}
        <div className="absolute bottom-3 left-3 text-white text-sm font-medium bg-black/60 px-2 py-1 rounded">
          {event.price_min ? `₹${event.price_min}` : 'Free'}
        </div>
      </div>

      {/* CONTENT */}
      <div className="p-5">
        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition">
          {event.title}
        </h3>

        <p className="mt-2 text-sm text-gray-500 line-clamp-2">
          {event.meta_description}
        </p>

        <div className="mt-4 flex justify-between items-center text-sm">
          <span className="text-gray-500">View details</span>
          <span className="text-blue-600 font-medium group-hover:translate-x-1 transition">
            →
          </span>
        </div>
      </div>
    </a>
  );
}
