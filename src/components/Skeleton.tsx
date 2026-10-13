export default function SkeletonCards({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6" aria-busy="true" aria-label="Memuat">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse">
          <div className="w-full aspect-[2/3] bg-stone-200 rounded-lg mb-4" />
          <div className="h-4 bg-stone-200 rounded mb-2" />
          <div className="h-3 bg-stone-100 rounded w-2/3" />
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ icon = '📚', title, hint, action }: { icon?: string; title: string; hint?: string; action?: React.ReactNode }) {
  return (
    <div className="text-center py-12">
      <div className="text-5xl mb-3 grayscale opacity-60">{icon}</div>
      <p className="font-semibold text-gray-700 mb-1">{title}</p>
      {hint && <p className="text-sm text-gray-500 mb-4">{hint}</p>}
      {action}
    </div>
  );
}
