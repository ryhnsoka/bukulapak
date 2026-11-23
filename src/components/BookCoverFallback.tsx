'use client';

import { useState } from 'react';

export default function BookCoverFallback({
  title,
  subtitle,
  className = '',
}: {
  title: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <div
      className={`w-full h-full flex overflow-hidden bg-gradient-to-br from-forest-800 via-forest-700 to-forest-900 text-cream select-none ${className}`}
    >
      <div className="w-3 shrink-0 bg-black/20 border-r border-white/15" aria-hidden="true" />
      <div className="flex-1 p-2.5 sm:p-3 flex">
        <div className="w-full h-full border border-cream/25 rounded-md p-2.5 flex flex-col justify-between text-left">
          <span className="text-[10px] font-sans uppercase tracking-widest text-cream/80 font-semibold">
            BukuLapak
          </span>
          <p className="font-serif font-bold text-cream leading-snug line-clamp-3 text-sm sm:text-base my-auto py-1">
            {title}
          </p>
          {subtitle ? (
            <p className="text-[11px] font-sans text-cream/85 line-clamp-1">{subtitle}</p>
          ) : (
            <span aria-hidden="true" />
          )}
        </div>
      </div>
    </div>
  );
}

export function BookCoverImage({
  src,
  alt,
  title,
  subtitle,
  imgClassName = 'w-full h-full object-cover',
  fallbackClassName = '',
  loading,
}: {
  src: string | null | undefined;
  alt: string;
  title: string;
  subtitle?: string;
  imgClassName?: string;
  fallbackClassName?: string;
  loading?: 'lazy' | 'eager';
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return <BookCoverFallback title={title} subtitle={subtitle} className={fallbackClassName} />;
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      onError={() => setFailed(true)}
      onLoad={(e) => {
        if (e.currentTarget.naturalWidth <= 1) setFailed(true);
      }}
      className={imgClassName}
    />
  );
}
