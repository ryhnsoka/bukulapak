import Link from 'next/link';

export default function Footer() {
  const email = process.env.NEXT_PUBLIC_CS_EMAIL ?? 'cs@bukulapak.id';
  const wa = process.env.NEXT_PUBLIC_WA_NUMBER ?? '6281234567890';

  return (
    <footer className="bg-forest-700 text-cream mt-16 py-10 text-sm shadow-inner">
      <div className="max-w-6xl mx-auto px-4 grid gap-8 md:grid-cols-3">
        <div>
          <p className="font-serif font-bold text-lg mb-2">BukuLapak</p>
          <p className="text-xs leading-relaxed text-cream/90 max-w-sm">
            Komunitas pembaca dan marketplace buku bekas antarperorangan. Baca review jujur,
            diskusi isi buku, dan temukan koleksi bacaan berikutnya.
          </p>
        </div>

        <div>
          <p className="font-semibold text-xs uppercase tracking-wider text-cream/85 mb-2.5">
            Jelajahi
          </p>
          <ul className="space-y-1.5 text-xs">
            <li>
              <Link href="/books" className="underline hover:text-white">
                Katalog &amp; Review Buku
              </Link>
            </li>
            <li>
              <Link href="/marketplace" className="underline hover:text-white">
                Marketplace Buku Bekas
              </Link>
            </li>
            <li>
              <Link href="/komunitas" className="underline hover:text-white">
                Komunitas &amp; Klub Baca
              </Link>
            </li>
            <li>
              <Link href="/about" className="underline hover:text-white">
                Tentang BukuLapak
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="font-semibold text-xs uppercase tracking-wider text-cream/85 mb-2.5">
            Bantuan
          </p>
          <p className="text-xs text-cream/90 mb-2.5">
            Respon cepat lewat WhatsApp atau email resmi.
          </p>
          <div className="flex flex-wrap gap-2">
            <a
              href={`https://wa.me/${wa}?text=${encodeURIComponent('Halo CS BukuLapak, saya butuh bantuan')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-xs font-semibold transition"
            >
              WhatsApp CS
            </a>
            <a
              href={`mailto:${email}?subject=${encodeURIComponent('Bantuan BukuLapak')}`}
              className="px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-xs font-semibold transition"
            >
              {email}
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 mt-8 pt-4 border-t border-white/15 text-xs text-cream/80 flex flex-wrap justify-between gap-2">
        <span>© 2026 BukuLapak. Semua hak dilindungi.</span>
        <span>Transaksi langsung antarperorangan — transfer/COD tanpa biaya platform.</span>
      </div>
    </footer>
  );
}
