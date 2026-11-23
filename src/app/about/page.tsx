import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tentang',
  description: 'Mengenal cara kerja diskusi buku dan marketplace buku bekas langsung antarperorangan di BukuLapak.',
};

export default function AboutPage() {
  const wa = process.env.NEXT_PUBLIC_WA_NUMBER ?? '6281234567890';
  const email = process.env.NEXT_PUBLIC_CS_EMAIL ?? 'cs@bukulapak.id';

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold font-serif text-forest-900 mb-4">Tentang BukuLapak</h1>
      <p className="text-stone-700 mb-6 leading-relaxed">
        BukuLapak adalah platform komunitas pecinta buku: baca dan tulis review jujur,
        kelola rak baca, ikuti diskusi klub baca, serta jual-beli buku bekas langsung antarperorangan.
        Transaksi dilakukan langsung (chat real-time → transfer/COD) agar tetap sederhana,
        transparan, dan tanpa biaya tambahan.
      </p>

      <h2 className="text-xl font-bold font-serif text-forest-900 mb-3">Cara Kerja</h2>
      <ol className="list-decimal ml-5 text-stone-700 mb-8 space-y-1.5 text-sm sm:text-base">
        <li>Cari buku lewat menu Jelajahi Buku atau kotak pencarian di Beranda.</li>
        <li>Simpan ke rak baca, beri rating, dan tulis review di halaman detail buku.</li>
        <li>Jual koleksimu lewat menu Jual Buku (pilih buku → unggah foto asli, kondisi, harga, kota).</li>
        <li>Pembeli dapat berdiskusi lewat Chat real-time atau membuat pesanan langsung di halaman listing.</li>
      </ol>

      <div className="bg-white border border-warm-border rounded-2xl p-6 sm:p-8">
        <h2 className="text-xl font-bold font-serif text-forest-900 mb-2">Hubungi CS</h2>
        <p className="text-stone-600 text-sm mb-4">
          Respon cepat via WhatsApp, atau formal via email resmi.
        </p>
        <div className="flex gap-3 flex-wrap">
          <a
            href={`https://wa.me/${wa}?text=${encodeURIComponent('Halo CS BukuLapak')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-forest-700 text-cream px-6 py-3 rounded-xl text-sm font-semibold hover:bg-forest-900 transition"
          >
            Chat WhatsApp
          </a>
          <a
            href={`mailto:${email}?subject=${encodeURIComponent('Bantuan BukuLapak')}`}
            className="inline-block bg-stone-900 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-stone-700 transition"
          >
            {email}
          </a>
        </div>
      </div>
    </div>
  );
}
