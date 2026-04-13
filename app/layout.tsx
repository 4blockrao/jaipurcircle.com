import './globals.css';
import Footer from '@/components/Footer';
import MobileNav from '@/components/MobileNav';
import LocalitySelector from '@/components/LocalitySelector';

export const metadata = {
  title: 'JaipurCircle - Discover Events in Jaipur',
  description:
    'Find events, nightlife, comedy shows, and things to do in Jaipur.',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900">
        <header className="sticky top-0 z-40 border-b border-black/5 bg-white/90 backdrop-blur-md">
          <div className="max-w-6xl mx-auto px-4 md:px-6 py-4 flex justify-between items-center gap-4">
            <a href="/" className="text-2xl font-bold tracking-tight text-gray-900">
              JaipurCircle
            </a>

            <div className="hidden md:block">
              <LocalitySelector selectedLocality="jaipur" />
            </div>

            <nav className="flex items-center gap-6 text-sm text-gray-600">
              <a href="/categories" className="hover:text-black transition">
                Categories
              </a>
              <a href="/localities" className="hover:text-black transition">
                Localities
              </a>
            </nav>
          </div>
        </header>

        {children}

        <Footer />
        <MobileNav />
      </body>
    </html>
  );
}
