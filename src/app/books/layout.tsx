import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Jelajahi & Cari Buku',
  description: 'Cari buku berdasarkan judul, penulis, genre, atau ISBN di katalog BukuLapak dan OpenLibrary.',
};

export default function BooksLayout({ children }: { children: ReactNode }) {
  return children;
}
