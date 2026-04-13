export default function CategoryChip({ category }: { category: any }) {
  return (
    <a
      href={`/categories/${category.slug}`}
      className="px-4 py-2 rounded-full bg-white border border-gray-200 text-sm text-gray-700 hover:bg-black hover:text-white transition shadow-sm"
    >
      {category.name}
    </a>
  );
}
