export default function LocalitySchema({ locality }: { locality: string }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Place",
          "name": locality,
          "address": {
            "@type": "PostalAddress",
            "addressLocality": "Jaipur",
            "addressCountry": "IN"
          }
        }),
      }}
    />
  );
}
