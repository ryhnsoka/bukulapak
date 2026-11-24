export default function SkeletonCards({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-5" aria-busy="true" aria-label="Memuat">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg border border-warm-border p-4 animate-pulse">
          <div className="w-full aspect-[2/3] bg-paper rounded-sm mb-4" />
          <div className="h-4 bg-paper rounded mb-2" />
          <div className="h-3 bg-paper rounded w-2/3" />
        </div>
      ))}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  hint,
  action,
}: {
  icon?: string;
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="text-center py-12 bg-white border border-warm-border rounded-lg px-4">
      {icon ? (
        <div className="text-3xl mb-3 opacity-70" aria-hidden="true">
          {icon}
        </div>
      ) : (
        <svg
          className="w-7 h-7 mx-auto mb-3 text-stone-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
      )}
      <p className="font-semibold text-ink mb-1">{title}</p>
      {hint && <p className="text-sm text-stone-600 mb-4">{hint}</p>}
      {action}
    </div>
  );
}
