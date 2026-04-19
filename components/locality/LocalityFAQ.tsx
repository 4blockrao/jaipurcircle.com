type Props = {
  name: string;
  zone?: string | null;
  municipality?: string | null;
};

export default function LocalityFAQ({ name, zone, municipality }: Props) {
  const faqs = [
    {
      q: `Where is ${name} located in Jaipur?`,
      a: `${name} is located in Jaipur${zone ? `, in the ${zone}` : ""}${municipality ? ` under ${municipality}` : ""}.`
    },
    {
      q: `What is ${name} known for?`,
      a: `${name} is known for its residential areas, connectivity, and nearby shopping and lifestyle options.`
    },
    {
      q: `Are there events happening in ${name}?`,
      a: `You can explore upcoming and past events in ${name} on JaipurCircle. As more events get added, this page will automatically update.`
    },
    {
      q: `What are the nearby areas to ${name}?`,
      a: `Nearby localities to ${name} include other key Jaipur neighborhoods. This section will expand as locality data grows.`
    }
  ];

  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(f => ({
      "@type": "Question",
      "name": f.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": f.a
      }
    }))
  };

  return (
    <section className="mt-12">
      <h2 className="text-xl font-semibold mb-4">
        FAQs about {name}
      </h2>

      <div className="space-y-4">
        {faqs.map((f, i) => (
          <div key={i} className="border rounded-lg p-4">
            <h3 className="font-medium">{f.q}</h3>
            <p className="text-sm text-muted-foreground mt-1">{f.a}</p>
          </div>
        ))}
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
    </section>
  );
}
