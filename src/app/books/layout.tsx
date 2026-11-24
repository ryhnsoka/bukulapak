import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Katalog Buku',
  description:
    'Cari buku lewat judul, penulis, genre, atau ISBN di katalog BukuLapak dan arsip OpenLibrary.',
};

export default function BooksLayout({ children }: { children: ReactNode }) {
  return children;
}
