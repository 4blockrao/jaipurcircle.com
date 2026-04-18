export const metadata = {
  title: 'News in Jaipur',
  description: 'Latest updates, news and developments across Jaipur.',
  robots: {
    index: false,
    follow: true,
  },
};

export default function NewsPage() {
  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold">Jaipur News</h1>
    </main>
  );
}
