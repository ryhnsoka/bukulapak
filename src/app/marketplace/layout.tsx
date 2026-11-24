import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Marketplace',
  description:
    'Lapak buku bekas dari sesama pembaca dengan info kondisi fisik, kota penjual, dan harga.',
};

export default function MarketplaceLayout({ children }: { children: ReactNode }) {
  return children;
}
