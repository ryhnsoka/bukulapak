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
      className={`w-full h-full flex overflow-hidden bg-forest-800 text-cream select-none ${className}`}
    >
      <div className="w-2.5 shrink-0 bg-black/20 border-r border-cream/15" aria-hidden="true" />
      <div className="flex-1 p-2.5 sm:p-3 flex">
        <div className="w-full h-full border border-cream/20 rounded-[2px] p-2.5 flex flex-col justify-between text-left">
          <span className="text-[10px] font-sans tracking-[0.08em] text-cream/70 font-medium">
            BukuLapak
          </span>
          <p className="font-serif font-medium text-cream leading-snug line-clamp-3 text-sm sm:text-base my-auto py-1">
            {title}
          </p>
          {subtitle ? (
            <p className="text-[11px] font-sans text-cream/80 line-clamp-1">{subtitle}</p>
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
