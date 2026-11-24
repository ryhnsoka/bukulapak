import Link from 'next/link';

export default function Footer() {
  const email = process.env.NEXT_PUBLIC_CS_EMAIL ?? 'cs@bukulapak.id';
  const wa = process.env.NEXT_PUBLIC_WA_NUMBER ?? '6281234567890';

  return (
    <footer id="bantuan" className="bg-forest-900 text-cream/90 mt-16 py-12 text-sm border-t border-forest-800">
      <div className="max-w-6xl mx-auto px-4 grid gap-8 md:grid-cols-3">
        <div>
          <p className="font-serif font-semibold text-xl tracking-[-0.02em] text-cream mb-2">
            BukuLapak
          </p>
          <p className="text-xs leading-relaxed text-cream/80 max-w-sm">
            Katalog ulasan buku dan lapak buku bekas antar pembaca. Pembelian dilakukan langsung
            antara penjual dan pembeli tanpa potongan platform.
          </p>
        </div>

        <div>
          <p className="font-medium text-xs text-cream/70 mb-3">Navigasi</p>
          <ul className="space-y-1.5 text-xs">
            <li>
              <Link href="/books" className="hover:text-white hover:underline underline-offset-4">
                Katalog dan ulasan
              </Link>
            </li>
            <li>
              <Link href="/marketplace" className="hover:text-white hover:underline underline-offset-4">
                Marketplace buku bekas
              </Link>
            </li>
            <li>
              <Link href="/komunitas" className="hover:text-white hover:underline underline-offset-4">
                Komunitas dan klub baca
              </Link>
            </li>
            <li>
              <Link href="/about" className="hover:text-white hover:underline underline-offset-4">
                Tentang BukuLapak
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="font-medium text-xs text-cream/70 mb-3">Bantuan</p>
          <p className="text-xs text-cream/80 mb-3 leading-relaxed">
            Ada kendala transaksi atau pertanyaan soal akun? Hubungi lewat WhatsApp atau email.
          </p>
          <div className="flex flex-wrap gap-2">
            <a
              href={`https://wa.me/${wa}?text=${encodeURIComponent('Halo CS BukuLapak, saya butuh bantuan')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-md bg-white/12 hover:bg-white/20 text-xs font-medium text-cream transition-colors"
            >
              WhatsApp CS
            </a>
            <a
              href={`mailto:${email}?subject=${encodeURIComponent('Bantuan BukuLapak')}`}
              className="px-3 py-1.5 rounded-md bg-white/12 hover:bg-white/20 text-xs font-medium text-cream transition-colors"
            >
              {email}
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 mt-8 pt-4 border-t border-cream/15 text-xs text-cream/70 flex flex-wrap justify-between gap-2">
        <span>© 2026 BukuLapak</span>
        <span>Transfer atau COD langsung antar pembaca, tanpa biaya perantara.</span>
      </div>
    </footer>
  );
}
