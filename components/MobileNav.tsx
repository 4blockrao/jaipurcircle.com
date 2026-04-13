export default function MobileNav() {
  const items = [
    { href: '/', icon: '🏠', label: 'Home' },
    { href: '/categories', icon: '📅', label: 'Events' },
    { href: '/localities', icon: '📍', label: 'Local' },
    { href: '#', icon: '👤', label: 'Account' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 md:hidden z-50 px-3 pb-3">
      <div className="bg-white/95 backdrop-blur-xl border border-gray-200 shadow-2xl rounded-2xl flex justify-around py-3">
        {items.map((item) => (
          <a
            key={item.label}
            href={item.href}
            className="text-[11px] text-center text-gray-700 flex flex-col items-center gap-1 min-w-[56px]"
          >
            <span className="text-lg">{item.icon}</span>
            <span>{item.label}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
