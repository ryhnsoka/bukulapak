'use client';

import { useId, useState } from 'react';
import Link from 'next/link';
import { trackPublishListing } from '@/lib/analytics';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { BOOK_CONDITIONS, getConditionSpec } from '@/lib/conditions';
import { validateIsbn } from '@/lib/isbn';
import { ALLOWED_IMAGE_TYPES, MAX_PHOTOS, MAX_RAW_PHOTO_BYTES } from '@/lib/storage';
import { useToast } from '@/components/ToastProvider';

export default function JualPage() {
  const { user, token, ready } = useAuth();
  const { showToast } = useToast();

  const [title, setTitle] = useState('');
  const [isbn, setIsbn] = useState('');
  const [condition, setCondition] = useState('good');
  const [price, setPrice] = useState('');
  const [city, setCity] = useState('');
  const [shareWa, setShareWa] = useState(false);
  const [wa, setWa] = useState('');
  const [editionNote, setEditionNote] = useState('');
  const [desc, setDesc] = useState('');
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [photoError, setPhotoError] = useState('');
  const [saving, setSaving] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const titleId = useId();
  const isbnId = useId();
  const isbnHintId = useId();
  const editionId = useId();
  const conditionId = useId();
  const priceId = useId();
  const cityId = useId();
  const waCheckId = useId();
  const waInputId = useId();
  const photosId = useId();
  const descId = useId();

  function pickPhotos(files: FileList | null) {
    if (!files) return;
    setPhotoError('');
    const rejected: string[] = [];
    const accepted: File[] = [];

    for (const f of Array.from(files)) {
      if (!ALLOWED_IMAGE_TYPES.has(f.type)) {
        rejected.push(`${f.name}: format harus JPG, PNG, atau WebP`);
        continue;
      }
      if (f.size > MAX_RAW_PHOTO_BYTES) {
        rejected.push(`${f.name}: ukuran melebihi 2MB`);
        continue;
      }
      accepted.push(f);
    }

    if (photos.length + accepted.length > MAX_PHOTOS) {
      rejected.push(`Maksimal ${MAX_PHOTOS} foto per listing.`);
    }

    const next = [...photos, ...accepted].slice(0, MAX_PHOTOS);
    previews.forEach((url) => URL.revokeObjectURL(url));
    setPhotos(next);
    setPreviews(next.map((f) => URL.createObjectURL(f)));
    if (rejected.length > 0) {
      setPhotoError(rejected.join(' • '));
    }
  }

  function removePhoto(index: number) {
    URL.revokeObjectURL(previews[index]);
    setPhotos((v) => v.filter((_, j) => j !== index));
    setPreviews((v) => v.filter((_, j) => j !== index));
    setPhotoError('');
  }

  const titleTrimmed = title.trim();
  const titleValid = titleTrimmed.length >= 2 && titleTrimmed.length <= 500;
  const isbnTrimmed = isbn.trim();
  const isbnCheck = validateIsbn(isbn);
  const waDigits = wa.replace(/[^0-9]/g, '');
  const waValid = !shareWa || /^[0-9]{10,15}$/.test(waDigits);
  const priceNum = price === '' ? NaN : Number(price);
  const formValid =
    titleValid &&
    isbnCheck.valid &&
    !!token &&
    city.trim() !== '' &&
    waValid &&
    price !== '' &&
    Number.isFinite(priceNum) &&
    priceNum >= 0 &&
    photos.length >= 1;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    if (!titleValid) {
      setError('Judul buku minimal 2 karakter.');
      return;
    }
    if (!isbnCheck.valid) {
      setError(isbnCheck.error ?? 'ISBN tidak valid.');
      return;
    }
    if (!formValid) return;

    setError('');
    setSaving(true);
    try {
      const bookRes = await api.storeBook(
        {
          title: titleTrimmed,
          isbn: isbnCheck.normalized,
          authors: [],
          edition_label: editionNote.trim() || null,
        },
        token
      );
      const res = await api.createListing(
        {
          book_id: bookRes.data.book.id,
          condition,
          price: priceNum,
          location_city: city.trim(),
          share_wa: shareWa,
          wa_number: shareWa ? waDigits : null,
          edition_note: editionNote.trim() || null,
          description: desc.trim() || null,
        },
        token
      );
      await api.uploadListingImages(res.data.listing.id, photos, token);
      trackPublishListing({
        listingId: res.data.listing.id,
        price: priceNum,
        condition,
        photosCount: photos.length,
        isbnFormat: isbnCheck.format,
      });
      showToast('Listing dan foto berhasil dipublikasikan!', 'success');
      setDone(res.data.listing.id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal membuat listing');
    } finally {
      setSaving(false);
    }
  }

  if (!ready) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10 text-sm text-stone-500">
        Memeriksa sesi…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold font-serif text-forest-900 mb-2">Login untuk Menjual</h1>
        <p className="text-stone-600 text-sm mb-6">
          Kamu perlu login untuk pasang listing buku bekas.
        </p>
        <Link
          href="/login?next=/jual"
          className="inline-block bg-forest-700 text-cream px-6 py-3 rounded-xl text-sm font-semibold hover:bg-forest-900 transition"
        >
          Login
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="text-5xl mb-4" aria-hidden="true">✅</div>
        <h1 className="text-2xl font-bold font-serif text-forest-900 mb-2">
          Listing Berhasil Dibuat!
        </h1>
        <p className="text-stone-600 text-sm mb-6">
          Bukumu beserta foto kondisi aslinya sudah tampil di marketplace BukuLapak.
        </p>
        <div className="flex justify-center gap-3 flex-wrap">
          <Link
            href={`/listings/${done}`}
            className="bg-forest-700 text-cream px-6 py-3 rounded-xl text-sm font-semibold hover:bg-forest-900 transition"
          >
            Lihat Listing
          </Link>
          <Link
            href="/profil"
            className="border border-stone-300 bg-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-stone-50 transition"
          >
            Kelola di Profil
          </Link>
        </div>
      </div>
    );
  }

  const activeCondition = getConditionSpec(condition);

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold font-serif text-forest-900 mb-2">Jual Buku Bekas</h1>
      <p className="text-stone-600 text-sm mb-6">
        Masukkan judul dan nomor ISBN buku, lalu lengkapi kondisi, foto asli, dan harga.
      </p>

      <form
        onSubmit={submit}
        className="bg-white border border-warm-border rounded-2xl p-5 flex flex-col gap-5"
      >
        <div className="flex flex-col gap-4 pb-5 border-b border-stone-200">
          <h2 className="font-bold text-stone-900">1. Identitas Buku</h2>

          <div>
            <label htmlFor={titleId} className="block text-xs font-semibold text-stone-700 mb-1">
              Judul Buku (wajib)
            </label>
            <input
              id={titleId}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={500}
              placeholder="cth: Laut Bercerita"
              className={`w-full border rounded-xl p-3 text-sm bg-white ${
                titleTrimmed !== '' && !titleValid ? 'border-red-500' : 'border-stone-300'
              }`}
            />
            {titleTrimmed !== '' && !titleValid && (
              <p className="mt-1 text-xs text-red-700">Judul buku minimal 2 karakter.</p>
            )}
          </div>

          <div>
            <label htmlFor={isbnId} className="block text-xs font-semibold text-stone-700 mb-1">
              Nomor ISBN (wajib, 10 atau 13 digit)
            </label>
            <input
              id={isbnId}
              value={isbn}
              onChange={(e) => setIsbn(e.target.value)}
              required
              inputMode="text"
              autoComplete="off"
              aria-invalid={isbnTrimmed !== '' && !isbnCheck.valid}
              aria-describedby={isbnHintId}
              placeholder="cth: 978-602-424-694-5 atau 0306406152"
              className={`w-full border rounded-xl p-3 text-sm bg-white ${
                isbnTrimmed === ''
                  ? 'border-stone-300'
                  : isbnCheck.valid
                  ? 'border-green-600'
                  : 'border-red-500'
              }`}
            />
            <p
              id={isbnHintId}
              className={`mt-1 text-xs ${
                isbnTrimmed === ''
                  ? 'text-stone-500'
                  : isbnCheck.valid
                  ? 'font-medium text-green-800'
                  : 'text-red-700'
              }`}
            >
              {isbnTrimmed === ''
                ? 'Masukkan 10 atau 13 digit ISBN (tanda hubung - boleh ditulis atau dikosongkan).'
                : isbnCheck.valid
                ? `✓ ${isbnCheck.format} valid (${isbnCheck.normalized})`
                : isbnCheck.error}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="font-bold text-stone-900">2. Detail Jualan</h2>

          <div>
            <label htmlFor={editionId} className="block text-xs font-semibold text-stone-700 mb-1">
              Info Edisi / Cetakan (opsional tapi disarankan)
            </label>
            <input
              id={editionId}
              value={editionNote}
              onChange={(e) => setEditionNote(e.target.value)}
              placeholder="cth: Cetakan 2022, Paperback, Bahasa Indonesia"
              className="w-full border border-stone-300 rounded-xl p-3 text-sm bg-white"
            />
          </div>

          <div>
            <label htmlFor={conditionId} className="block text-xs font-semibold text-stone-700 mb-1">
              Kondisi Fisik Buku
            </label>
            <select
              id={conditionId}
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="w-full border border-stone-300 rounded-xl p-3 text-sm bg-white"
            >
              {BOOK_CONDITIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label} — {c.summary}
                </option>
              ))}
            </select>
            {activeCondition && (
              <div className="mt-2 bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs text-stone-700">
                <p className="font-semibold mb-1">
                  Kriteria kondisi &ldquo;{activeCondition.label}&rdquo;:
                </p>
                <ul className="list-disc pl-4 space-y-0.5">
                  {activeCondition.details.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div>
            <label htmlFor={priceId} className="block text-xs font-semibold text-stone-700 mb-1">
              Harga (Rp, 0 = gratis)
            </label>
            <input
              id={priceId}
              type="number"
              min={0}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
              placeholder="cth: 45000"
              className="w-full border border-stone-300 rounded-xl p-3 text-sm bg-white"
            />
            {price !== '' && Number(price) === 0 && (
              <span className="inline-block mt-1.5 text-xs font-semibold text-green-800 bg-green-100 px-2.5 py-0.5 rounded-full">
                Buku akan dilisting sebagai GRATIS
              </span>
            )}
          </div>

          <div>
            <label htmlFor={cityId} className="block text-xs font-semibold text-stone-700 mb-1">
              Kota / Kabupaten
            </label>
            <input
              id={cityId}
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
              placeholder="cth: Jakarta Selatan"
              className="w-full border border-stone-300 rounded-xl p-3 text-sm bg-white"
            />
          </div>

          <div className="border border-stone-200 rounded-xl p-3.5 bg-stone-50">
            <label
              htmlFor={waCheckId}
              className="flex items-start gap-2.5 text-sm cursor-pointer"
            >
              <input
                id={waCheckId}
                type="checkbox"
                checked={shareWa}
                onChange={(e) => setShareWa(e.target.checked)}
                className="mt-1"
              />
              <span>
                <strong>Bagikan nomor WhatsApp ke publik</strong>
                <span className="block text-xs text-stone-500 mt-0.5">
                  Opsional. Jika tidak dicentang, nomor kontakmu tetap privat dan pembeli
                  menghubungimu lewat Chat real-time BukuLapak.
                </span>
              </span>
            </label>
            {shareWa && (
              <div className="mt-3">
                <label
                  htmlFor={waInputId}
                  className="block text-xs font-semibold text-stone-700 mb-1"
                >
                  Nomor WhatsApp (10–15 digit, awali 62)
                </label>
                <input
                  id={waInputId}
                  value={wa}
                  onChange={(e) => setWa(e.target.value)}
                  required={shareWa}
                  inputMode="numeric"
                  placeholder="cth: 6281234567890"
                  className={`w-full border rounded-xl p-3 text-sm bg-white ${
                    wa === ''
                      ? 'border-stone-300'
                      : waValid
                      ? 'border-green-600'
                      : 'border-red-500'
                  }`}
                />
                {wa !== '' && !waValid && (
                  <span className="block mt-1 text-xs text-red-700">
                    Nomor WA harus 10–15 digit angka.
                  </span>
                )}
              </div>
            )}
          </div>

          <div>
            <label htmlFor={photosId} className="text-xs font-semibold text-stone-700 block">
              Foto Asli Buku (wajib, 1–5 foto, format JPG/PNG/WebP, maks 2MB/foto)
            </label>
            <p className="text-xs text-stone-500 mt-0.5 mb-2">
              Foto sampul depan, punggung buku, dan halaman dalam agar pembeli yakin. Foto akan
              dikompres otomatis sebelum disimpan.
            </p>
            <input
              id={photosId}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={(e) => pickPhotos(e.target.files)}
              className="block w-full border border-stone-300 rounded-xl p-3 text-xs bg-white file:mr-3 file:px-4 file:py-2 file:rounded-xl file:border-0 file:bg-forest-700 file:text-cream file:text-xs file:font-semibold"
            />
            {photoError && <p className="text-xs text-red-700 mt-1">{photoError}</p>}
            {photos.length === 0 && (
              <p className="mt-1 text-xs text-stone-500">
                Wajib unggah minimal 1 foto asli bukumu.
              </p>
            )}
          </div>

          {previews.length > 0 && (
            <div className="grid grid-cols-5 gap-2">
              {previews.map((src, i) => (
                <div key={i} className="relative">
                  <img
                    src={src}
                    alt={`Preview foto buku ${i + 1}`}
                    className="w-full aspect-square object-cover rounded-xl border border-stone-200"
                  />
                  <button
                    type="button"
                    aria-label={`Hapus foto ${i + 1}`}
                    onClick={() => removePhoto(i)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 text-white rounded-full text-xs cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          <div>
            <label htmlFor={descId} className="block text-xs font-semibold text-stone-700 mb-1">
              Deskripsi &amp; catatan kondisi jujur
            </label>
            <textarea
              id={descId}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={3}
              placeholder="Jelaskan kondisi halaman, coretan, atau kelengkapan secara jujur…"
              className="w-full border border-stone-300 rounded-xl p-3 text-sm bg-white"
            />
          </div>

          {error && <p className="text-sm text-red-700">{error}</p>}

          <button
            type="submit"
            disabled={!formValid || saving}
            className="bg-forest-700 text-cream rounded-xl p-3 text-sm font-semibold hover:bg-forest-900 transition disabled:opacity-50 cursor-pointer"
          >
            {saving ? 'Mengompres & Menyimpan…' : 'Pasang Listing'}
          </button>
        </div>
      </form>
    </div>
  );
}
