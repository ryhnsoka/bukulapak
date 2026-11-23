import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Marketplace',
  description: 'Bandingkan kondisi fisik, foto asli penjual, kota, dan harga buku bekas antarperorangan.',
};

export default function MarketplaceLayout({ children }: { children: ReactNode }) {
  return children;
}
