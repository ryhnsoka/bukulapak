import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Jual Buku',
  description:
    'Pasang buku bekas untuk dijual beserta foto kondisi asli dan catatan fisiknya di BukuLapak.',
};

export default function JualLayout({ children }: { children: ReactNode }) {
  return children;
}
