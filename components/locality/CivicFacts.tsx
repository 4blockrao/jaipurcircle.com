type Props = {
  name: string;
  zone?: string | null;
  municipality?: string | null;
  pincode?: string | null;
  policeStation?: string | null;
};

export default function CivicFacts({
  name,
  zone,
  municipality,
  pincode,
  policeStation,
}: Props) {
  const rows = [
    { label: "Zone", value: zone || "—" },
    { label: "Municipality", value: municipality || "—" },
    { label: "Pincode", value: pincode || "—" },
    { label: "Police Station", value: policeStation || "—" },
  ];

  return (
    <section className="mt-12">
      <h2 className="text-xl font-semibold mb-4">
        Civic facts about {name}
      </h2>

      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rows.map((row) => (
            <div key={row.label} className="rounded-xl border border-gray-100 p-4">
              <div className="text-xs uppercase tracking-wide text-gray-500">
                {row.label}
              </div>
              <div className="mt-1 text-sm font-medium text-gray-900">
                {row.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
