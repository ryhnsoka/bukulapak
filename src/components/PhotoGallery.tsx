'use client';

import { useState } from 'react';
import { BookCoverImage } from './BookCoverFallback';
import { PhotoLightbox } from './Dialogs';

export default function PhotoGallery({
  images,
  fallbackCover,
  title,
}: {
  images: string[];
  fallbackCover: string | null;
  title: string;
}) {
  const hasReal = images.length > 0;
  const [selected, setSelected] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (!hasReal) {
    return (
      <div className="max-w-[250px] mx-auto">
        <div className="w-full aspect-[2/3] rounded-sm overflow-hidden shadow-md ring-1 ring-black/10 bg-paper">
          <BookCoverImage
            key={fallbackCover ?? 'none'}
            src={fallbackCover}
            alt={title}
            title={title}
            imgClassName="w-full h-full object-cover"
          />
        </div>
        {fallbackCover && (
          <p className="text-xs leading-relaxed text-amber-950 bg-amber-50/90 border border-amber-200 rounded-lg px-3.5 py-2.5 mt-3">
            Foto fisik belum diunggah penjual, jadi yang tampil masih sampul katalog. Minta foto asli
            buku lewat chat sebelum sepakat membeli.
          </p>
        )}
      </div>
    );
  }

  const safeIdx = Math.min(selected, images.length - 1);

  return (
    <div>
      <div className="relative rounded-lg overflow-hidden border border-warm-border bg-white aspect-[4/3] mb-3">
        <img
          src={images[safeIdx]}
          alt={`Foto asli ${safeIdx + 1} ${title}`}
          className="w-full h-full object-contain bg-paper/50"
        />
        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 bg-stone-900/85 text-cream text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-stone-900 transition-colors cursor-pointer"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.75"
              d="M21 21l-4.35-4.35m0 0A7 7 0 1016.65 16.65z"
            />
          </svg>
          <span>Perbesar foto</span>
        </button>
      </div>

      {images.length > 1 && (
        <div className="flex flex-wrap gap-2.5">
          {images.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSelected(i)}
              aria-label={`Pilih foto ${i + 1}`}
              className={`w-20 h-16 rounded-lg overflow-hidden border-2 transition cursor-pointer bg-white p-0 ${
                i === safeIdx
                  ? 'border-forest-700 ring-2 ring-forest-700/20'
                  : 'border-warm-border opacity-80 hover:opacity-100'
              }`}
            >
              <img
                src={src}
                alt={`Thumbnail ${i + 1} ${title}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      <p className="inline-flex items-center gap-1.5 text-xs text-forest-800 font-medium mt-2.5">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.75"
            d="M3 9a2 2 0 012-2h2l1.5-2h7L17 7h2a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
          />
          <circle cx="12" cy="13" r="3" strokeWidth="1.75" />
        </svg>
        <span>Foto asli dari penjual ({images.length} foto)</span>
      </p>

      {lightboxOpen && (
        <PhotoLightbox
          key={safeIdx}
          open={lightboxOpen}
          images={images}
          title={title}
          initialIndex={safeIdx}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  );
}
