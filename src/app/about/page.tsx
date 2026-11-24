import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tentang',
  description:
    'Cara kerja katalog ulasan buku dan jual-beli buku bekas langsung antarperorangan di BukuLapak.',
};

export default function AboutPage() {
  const wa = process.env.NEXT_PUBLIC_WA_NUMBER ?? '6281234567890';
  const email = process.env.NEXT_PUBLIC_CS_EMAIL ?? 'cs@bukulapak.id';

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="type-page-title text-ink mb-4">Tentang BukuLapak</h1>
      <p className="type-prose text-stone-700 mb-4">
        BukuLapak adalah katalog ulasan pembaca sekaligus lapak buku bekas antarperorangan. Di sini
        pembaca bisa menulis ulasan, merapikan daftar bacaan, ikut diskusi klub baca, dan menjual
        koleksi lama langsung ke pembaca lain.
      </p>
      <p className="type-prose text-stone-700 mb-8">
        Transaksi berlangsung langsung lewat obrolan di aplikasi lalu dilanjutkan dengan transfer atau
        COD tanpa potongan biaya platform. Karena tidak ada perantara pembayaran, pembeli tetap perlu
        memeriksa foto kondisi fisik buku sebelum menyepakati pembelian.
      </p>

      <h2 className="type-section text-ink mt-10 mb-3">Cara kerja</h2>
      <ol className="list-decimal ml-5 text-stone-700 mb-8 space-y-2 text-sm sm:text-base max-w-[65ch] leading-relaxed">
        <li>Cari judul buku lewat Katalog atau kotak pencarian di Beranda.</li>
        <li>Simpan buku ke rak baca, beri nilai, dan tulis ulasan di halaman buku.</li>
        <li>
          Pasang buku bekas untuk dijual lewat menu Jual buku lengkap dengan foto asli, kondisi,
          harga, dan kota asal.
        </li>
        <li>
          Pembeli dapat menanyakan detail kondisi lewat chat atau langsung memesan di halaman lapak
          buku tersebut.
        </li>
      </ol>

      <div className="bg-white border border-warm-border rounded-lg p-6 mt-10">
        <h2 className="font-sans font-semibold text-base text-ink mb-2">Bantuan</h2>
        <p className="text-stone-600 text-sm mb-4 leading-relaxed">
          Pertanyaan singkat bisa dikirim lewat WhatsApp; laporan konten atau kendala akun bisa dikirim
          ke email.
        </p>
        <div className="flex gap-3 flex-wrap">
          <a
            href={`https://wa.me/${wa}?text=${encodeURIComponent('Halo CS BukuLapak')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-forest-700 text-cream px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-forest-900 transition-colors"
          >
            Chat WhatsApp
          </a>
          <a
            href={`mailto:${email}?subject=${encodeURIComponent('Bantuan BukuLapak')}`}
            className="inline-block bg-stone-900 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-stone-700 transition-colors"
          >
            {email}
          </a>
        </div>
      </div>
    </div>
  );
}
