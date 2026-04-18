function formatVerifiedDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleDateString("en-IN", {
    dateStyle: "long",
  });
}

export default function EventFreshnessBadge({
  lastVerifiedAt,
  updatedAt,
}: {
  lastVerifiedAt?: string | null;
  updatedAt?: string | null;
}) {
  const display = formatVerifiedDate(lastVerifiedAt || updatedAt);
  if (!display) return null;

  return (
    <div className="inline-flex items-center rounded-full bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800 border border-emerald-200">
      Verified on {display}
    </div>
  );
}
