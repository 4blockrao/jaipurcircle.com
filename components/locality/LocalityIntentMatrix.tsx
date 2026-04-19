type Props = {
  name: string;
  slug: string;
};

export default function LocalityIntentMatrix({ name, slug }: Props) {
  const links = [
    { label: `Events in ${name}`, href: `/jaipur/${slug}/events` },
    { label: `News in ${name}`, href: `/jaipur/${slug}/news` },
    { label: `Shopping in ${name}`, href: `/jaipur/${slug}/shopping` },
    { label: `${name} venues`, href: `/jaipur/${slug}` },
    { label: `${name} things to do`, href: `/jaipur/${slug}` },
    { label: `${name} locality guide`, href: `/jaipur/${slug}` },
  ];

  return (
    <section className="mt-12">
      <h2 className="text-xl font-semibold mb-4">
        Explore more in {name}
      </h2>
      <p className="text-sm text-gray-600 mb-4">
        Browse key discovery paths and search-intent routes related to {name}, Jaipur.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {links.map((link) => (
          <a
            key={link.label}
            href={link.href}
            className="rounded-2xl border border-gray-200 bg-white p-4 hover:shadow-sm transition"
          >
            <div className="text-sm font-medium text-gray-900">{link.label}</div>
          </a>
        ))}
      </div>
    </section>
  );
}
