export default function AboutPage() {
  const wa = process.env.NEXT_PUBLIC_WA_NUMBER ?? '6281234567890';
  const email = process.env.NEXT_PUBLIC_CS_EMAIL ?? 'cs@bukulapak.id';
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold font-serif mb-4">Tentang BukuLapak</h1>
      <p className="text-stone-700 mb-4 leading-relaxed">
        BukuLapak adalah platform untuk pecinta buku: baca dan tulis review jujur,
        simpan buku favorit, serta jual-beli buku bekas langsung antar perorangan.
        Transaksi dilakukan manual (chat → transfer/COD) agar tetap sederhana dan tanpa biaya tambahan.
      </p>
      <h2 className="text-xl font-bold font-serif mb-2">Cara Kerja</h2>
      <ol className="list-decimal ml-5 text-stone-700 mb-8 flex flex-col gap-1">
        <li>Cari buku lewat menu Cari Buku.</li>
        <li>Beri rating & tulis review di halaman detail buku.</li>
        <li>Jual bukumu lewat menu Jual Buku (pilih buku → isi kondisi, harga, kota).</li>
        <li>Pembeli menghubungimu lewat Chat di halaman listing.</li>
      </ol>
      <div className="bg-white border rounded-xl p-8">
        <h2 className="text-xl font-bold font-serif mb-2">Hubungi CS</h2>
        <p className="text-stone-600 mb-4">Respon cepat via WhatsApp, atau formal via email.</p>
        <div className="flex gap-3 flex-wrap">
          <a
            href={`https://wa.me/${wa}?text=${encodeURIComponent('Halo CS BukuLapak')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-forest-700/50 text-white px-6 py-3 rounded-full hover:bg-forest-700 transition"
          >
            Chat WhatsApp
          </a>
          <a
            href={`mailto:${email}?subject=${encodeURIComponent('Bantuan BukuLapak')}`}
            className="inline-block bg-stone-900 text-white px-6 py-3 rounded-full hover:bg-stone-700 transition"
          >
            {email}
          </a>
        </div>
      </div>
    </div>
  );
}


