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
        <div className="w-full aspect-[2/3] rounded-2xl overflow-hidden shadow-md border border-warm-border bg-stone-100">
          <BookCoverImage
            key={fallbackCover ?? 'none'}
            src={fallbackCover}
            alt={title}
            title={title}
            imgClassName="w-full h-full object-cover"
          />
        </div>
        {fallbackCover && (
          <p className="text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-2.5 mt-3">
            Penjual belum mengunggah foto fisik buku (menampilkan sampul katalog). Pastikan
            meminta foto kondisi asli lewat Chat sebelum transaksi.
          </p>
        )}
      </div>
    );
  }

  const safeIdx = Math.min(selected, images.length - 1);

  return (
    <div>
      <div className="relative rounded-2xl overflow-hidden border border-warm-border bg-white shadow-sm aspect-[4/3] mb-3">
        <img
          src={images[safeIdx]}
          alt={`Foto asli ${safeIdx + 1} ${title}`}
          className="w-full h-full object-contain bg-stone-50"
        />
        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          className="absolute bottom-3 right-3 bg-stone-900/85 text-white text-xs font-semibold px-3 py-1.5 rounded-xl hover:bg-stone-900 transition cursor-pointer"
        >
          🔍 Perbesar Foto
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
              className={`w-20 h-16 rounded-xl overflow-hidden border-2 transition cursor-pointer bg-white p-0 ${
                i === safeIdx
                  ? 'border-forest-700 ring-2 ring-forest-700/25'
                  : 'border-stone-200 opacity-80 hover:opacity-100'
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

      <p className="text-xs text-forest-700 font-semibold mt-2.5">
        📷 Foto asli kondisi buku dari penjual ({images.length} foto)
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
