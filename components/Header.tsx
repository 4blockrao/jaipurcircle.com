export default function Header() {
  return (
    <header className="border-b bg-white">
      <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
        
        <a href="/" className="text-xl font-bold text-gray-900">
          JaipurCircle
        </a>

        <nav className="flex gap-6 text-sm text-gray-600">
          <a href="/categories" className="hover:text-black">Categories</a>
          <a href="/localities" className="hover:text-black">Localities</a>
        </nav>

      </div>
    </header>
  );
}
