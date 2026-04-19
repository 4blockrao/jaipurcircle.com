type Props = {
  name: string;
  bestFor?: string[] | null;
  vibeTags?: string[] | null;
  knownFor?: string[] | null;
};

function Chip({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-700">
      {label}
    </span>
  );
}

export default function LocalityDifferentiation({
  name,
  bestFor,
  vibeTags,
  knownFor,
}: Props) {
  const hasAny =
    (bestFor && bestFor.length > 0) ||
    (vibeTags && vibeTags.length > 0) ||
    (knownFor && knownFor.length > 0);

  if (!hasAny) return null;

  return (
    <section className="mt-12">
      <h2 className="text-xl font-semibold mb-4">
        What {name} is known for
      </h2>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-5">
        {knownFor && knownFor.length > 0 && (
          <div>
            <div className="text-sm font-medium text-gray-900 mb-2">Known for</div>
            <div className="flex flex-wrap gap-2">
              {knownFor.map((item) => (
                <Chip key={item} label={item} />
              ))}
            </div>
          </div>
        )}

        {bestFor && bestFor.length > 0 && (
          <div>
            <div className="text-sm font-medium text-gray-900 mb-2">Best for</div>
            <div className="flex flex-wrap gap-2">
              {bestFor.map((item) => (
                <Chip key={item} label={item} />
              ))}
            </div>
          </div>
        )}

        {vibeTags && vibeTags.length > 0 && (
          <div>
            <div className="text-sm font-medium text-gray-900 mb-2">Vibe</div>
            <div className="flex flex-wrap gap-2">
              {vibeTags.map((item) => (
                <Chip key={item} label={item} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
