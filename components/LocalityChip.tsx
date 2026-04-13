export default function LocalityChip({ locality }: { locality: any }) {
  return (
    <a
      href={`/jaipur/${locality.slug}`}
      className="px-4 py-2 rounded-full bg-gray-100 text-sm text-gray-700 hover:bg-gray-200 transition"
    >
      {locality.name}
    </a>
  );
}
