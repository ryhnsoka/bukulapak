'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, type Book } from '@/lib/api';
import { useAuth } from '@/lib/auth';

const CONDITIONS = [
  { value: 'new', label: 'Baru' },
  { value: 'like_new', label: 'Seperti Baru' },
  { value: 'good', label: 'Baik' },
  { value: 'fair', label: 'Cukup' },
  { value: 'poor', label: 'Rusak Ringan' },
];

export default function JualPage() {
  const { user, token } = useAuth();
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Book[]>([]);
  const [searching, setSearching] = useState(false);
  const [book, setBook] = useState<Book | null>(null);
  const [condition, setCondition] = useState('good');
  const [price, setPrice] = useState('');
  const [city, setCity] = useState('');
  const [wa, setWa] = useState('');
  const [desc, setDesc] = useState('');
  const [done, setDone] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  function pickPhotos(files: FileList | null) {
    if (!files) return;
    const valid = [...files].filter((f) => f.type.startsWith('image/') && f.size <= 2 * 1024 * 1024);
    const next = [...photos, ...valid].slice(0, 5);
    setPhotos(next);
    setPreviews(next.map((f) => URL.createObjectURL(f)));
  }

  async function search(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    setSearching(true);
    try {
      const res = await api.searchBooks(q.trim());
      setResults(res.data.books);
    } catch (err: any) {
      setError(err.message ?? 'Pencarian gagal');
    } finally {
      setSearching(false);
    }
  }

  async function pick(b: Book) {
    if (!token) return;
    try {
      const res = await api.storeBook(b, token);
      setBook(res.data.book);
      setResults([]);
    } catch (err: any) {
      // kemungkinan buku sudah tersimpan (unique) — coba abaikan
      setError(err.message ?? 'Gagal menyimpan buku');
    }
  }

  const waDigits = wa.replace(/[^0-9]/g, '');
  const waValid = /^[0-9]{10,15}$/.test(waDigits);
  const priceNum = price === '' ? NaN : Number(price);
  const formValid =
    !!book && !!token && city.trim() !== '' && waValid && price !== '' && Number.isFinite(priceNum) && priceNum >= 0 && photos.length >= 1;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!book || !token || !formValid) return;
    setError('');
    setSaving(true);
    try {
      const res: any = await api.createListing({
        book_id: book.id,
        condition,
        price: priceNum,
        location_city: city.trim(),
        wa_number: waDigits,
        description: desc,
      }, token);
      await api.uploadListingImages(res.data.listing.id, photos, token);
      setDone(res.data.listing.id);
    } catch (err: any) {
      setError(err.errors ? Object.values(err.errors).flat().join(' ') : (err.message ?? 'Gagal membuat listing'));
    } finally {
      setSaving(false);
    }
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-2">Login untuk Menjual</h1>
        <p className="text-stone-600 mb-6">Kamu perlu login untuk pasang listing.</p>
        <Link href="/login" className="inline-block bg-forest-700 text-white px-6 py-3 rounded-full hover:bg-forest-900 transition">Login</Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="text-5xl mb-4">✅</div>
        <h1 className="text-2xl font-bold mb-2">Listing Berhasil!</h1>
        <p className="text-stone-600 mb-6">Bukumu sudah tampil di marketplace.</p>
        <Link href={`/listings/${done}`} className="inline-block bg-forest-700 text-white px-6 py-3 rounded-full hover:bg-forest-900 transition">Lihat Listing</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold font-serif mb-2">Jual Buku Bekas</h1>
      <p className="text-stone-600 mb-4">Langkah 1: pilih buku → Langkah 2: isi detail jualan.</p>

      <div className="flex items-center gap-2 mb-6 text-sm">
        <span className={`px-3 py-1 rounded-full font-semibold ${!book ? 'bg-forest-700 text-cream' : 'bg-forest-700/10 text-forest-900'}`}>
          1. Pilih Buku {book ? '✓' : ''}
        </span>
        <span className="text-gray-300">→</span>
        <span className={`px-3 py-1 rounded-full font-semibold ${book ? 'bg-forest-700 text-cream' : 'bg-stone-100 text-gray-400'}`}>
          2. Detail Jualan
        </span>
      </div>

      {!book ? (
        <div className="bg-white border rounded-xl p-5 mb-6">
          <h2 className="font-bold mb-3">1. Pilih Buku</h2>
          <form onSubmit={search} className="flex gap-2 mb-4">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Judul / penulis / ISBN…" className="flex-1 border rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-forest-700" />
            <button className="bg-forest-700 text-white px-5 py-2 rounded-full hover:bg-forest-900 transition" disabled={searching}>
              {searching ? '…' : 'Cari'}
            </button>
          </form>
          <div className="flex flex-col gap-2 max-h-80 overflow-auto">
            {results.map((b, i) => (
              <button key={b.open_library_id ?? i} onClick={() => pick(b)} className="text-left border rounded-lg p-3 hover:bg-forest-700/5 transition">
                <p className="font-semibold text-sm">{b.title}</p>
                <p className="text-xs text-stone-500">{b.authors?.join(', ')}</p>
              </button>
            ))}
          </div>
          {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
        </div>
      ) : (
        <form onSubmit={submit} className="bg-white border rounded-xl p-5 flex flex-col gap-4">
          <div className="bg-forest-700/5 border border-forest-700/30 rounded-lg p-3 text-sm">
            <p className="font-bold">{book.title}</p>
            <p className="text-stone-600">{book.authors?.join(', ')}</p>
            <button type="button" onClick={() => setBook(null)} className="text-xs underline mt-1">Ganti buku</button>
          </div>
          <h2 className="font-bold">2. Detail Jualan</h2>
          <label className="text-sm">Kondisi
            <select value={condition} onChange={(e) => setCondition(e.target.value)} className="block w-full border rounded-lg p-3 mt-1">
              {CONDITIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </label>
          <label className="text-sm">Harga (Rp, 0 = gratis)
            <input type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} required placeholder="cth: 45000" className="block w-full border rounded-lg p-3 mt-1 focus:outline-none focus:ring-2 focus:ring-forest-700" />
            {price !== '' && Number(price) === 0 && (
              <span className="inline-block mt-1 text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                Buku akan dilisting sebagai GRATIS
              </span>
            )}
            {price !== '' && Number(price) < 0 && (
              <span className="block mt-1 text-xs text-red-600">Harga tidak boleh negatif.</span>
            )}
          </label>
          <label className="text-sm">Kota
            <input value={city} onChange={(e) => setCity(e.target.value)} required placeholder="cth: Jakarta" className="block w-full border rounded-lg p-3 mt-1" />
          </label>
          <label className="text-sm">Nomor WA penjual
            <input value={wa} onChange={(e) => setWa(e.target.value)} required inputMode="numeric" placeholder="cth: 6281234567890" className={`block w-full border rounded-lg p-3 mt-1 focus:outline-none focus:ring-2 ${wa === '' ? 'border-gray-300 focus:ring-forest-700' : waValid ? 'border-green-500 focus:ring-green-600' : 'border-red-400 focus:ring-red-500'}`} />
            {wa !== '' && !waValid && (
              <span className="block mt-1 text-xs text-red-600">Nomor WA tidak valid, harus 10–15 digit angka.</span>
            )}
            <span className="text-xs text-gray-500">Pembeli akan diarahkan ke WA ini saat membeli.</span>
          </label>
          <label className="text-sm">Foto buku (wajib, min 1, maks 5, tiap maks 2MB)
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => pickPhotos(e.target.files)}
              className="block w-full border rounded-lg p-3 mt-1 file:mr-3 file:px-4 file:py-2 file:rounded-full file:border-0 file:bg-forest-700 file:text-cream file:text-sm"
            />
            {photos.length === 0 && (
              <span className="block mt-1 text-xs text-red-600">Wajib unggah minimal 1 foto asli bukumu.</span>
            )}
          </label>
          {previews.length > 0 && (
            <div className="grid grid-cols-5 gap-2">
              {previews.map((src, i) => (
                <div key={i} className="relative">
                  <img src={src} alt={`Foto ${i + 1}`} className="w-full aspect-square object-cover rounded-lg border" />
                  <button
                    type="button"
                    onClick={() => {
                      setPhotos((v) => v.filter((_, j) => j !== i));
                      setPreviews((v) => v.filter((_, j) => j !== i));
                    }}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 text-white rounded-full text-xs"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
          <label className="text-sm">Deskripsi / catatan kondisi
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} placeholder="cth: Halaman lengkap, cover sedikit terlipat" className="block w-full border rounded-lg p-3 mt-1" />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button disabled={!formValid || saving} className="bg-forest-700 text-cream rounded-lg p-3 hover:bg-forest-900 transition disabled:opacity-50">
            {saving ? 'Menyimpan…' : 'Pasang Listing'}
          </button>
        </form>
      )}
    </div>
  );
}


