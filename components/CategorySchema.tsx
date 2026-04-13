export default function CategorySchema({ category }: { category: string }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          "name": `${category} Events in Jaipur`,
        }),
      }}
    />
  );
}
