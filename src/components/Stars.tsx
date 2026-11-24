export default function Stars({ value, size = 'md' }: { value: number | null; size?: 'sm' | 'md' | 'lg' }) {
  const cls = size === 'lg' ? 'text-2xl' : size === 'sm' ? 'text-sm' : 'text-lg';
  const v = value ?? 0;
  return (
    <span
      className={`${cls} text-ochre leading-none inline-flex items-center tracking-tight`}
      title={v ? `${v}/5` : 'Belum ada rating'}
      aria-label={v ? `Rating ${Number(v).toFixed(1)} dari 5` : 'Belum ada rating'}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} aria-hidden="true">
          {i <= Math.round(v) ? '★' : '☆'}
        </span>
      ))}
    </span>
  );
}
