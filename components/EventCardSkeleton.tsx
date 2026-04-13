export default function EventCardSkeleton() {
  return (
    <div className="animate-pulse bg-white rounded-2xl border border-gray-100 overflow-hidden">

      {/* IMAGE */}
      <div className="h-44 bg-gray-200"></div>

      {/* CONTENT */}
      <div className="p-5 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-3 bg-gray-200 rounded w-full"></div>
        <div className="h-3 bg-gray-200 rounded w-5/6"></div>

        <div className="h-4 bg-gray-200 rounded w-1/3 mt-4"></div>
      </div>
    </div>
  );
}
