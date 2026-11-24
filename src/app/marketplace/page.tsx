'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { trackSearch } from '@/lib/analytics';
import { api, type Listing } from '@/lib/api';
import { BOOK_CONDITIONS, getConditionSpec } from '@/lib/conditions';
import ListingCard from '@/components/ListingCard';
import SkeletonCards, { EmptyState } from '@/components/Skeleton';
import ErrorState from '@/components/ErrorState';

const SORTS = [
  { value: 'newest', label: 'Terbaru' },
  { value: 'price_asc', label: 'Harga terendah' },
  { value: 'price_desc', label: 'Harga tertinggi' },
];

export default function MarketplacePage() {
  return (
    <Suspense fallback={<div className="max-w-6xl mx-auto px-4 py-10"><SkeletonCards count={8} /></div>}>
      <MarketplaceContent />
    </Suspense>
  );
}

function MarketplaceContent() {
  const searchParams = useSearchParams();

  const urlQ = searchParams.get('q') ?? '';
  const urlCondition = searchParams.get('condition') ?? '';
  const urlCity = searchParams.get('location_city') ?? '';
  const urlMin = searchParams.get('min_price') ?? '';
  const urlMax = searchParams.get('max_price') ?? '';
  const urlSort = searchParams.get('sort') ?? 'newest';
  const urlPage = Math.max(1, Number(searchParams.get('page') ?? '1') || 1);
  const paramKey = `${urlQ}|${urlCondition}|${urlCity}|${urlMin}|${urlMax}|${urlSort}|${urlPage}`;

  return (
    <MarketplaceInner
      key={paramKey}
      paramKey={paramKey}
      urlQ={urlQ}
      urlCondition={urlCondition}
      urlCity={urlCity}
      urlMin={urlMin}
      urlMax={urlMax}
      urlSort={urlSort}
      urlPage={urlPage}
    />
  );
}

interface MarketplaceInnerProps {
  paramKey: string;
  urlQ: string;
  urlCondition: string;
  urlCity: string;
  urlMin: string;
  urlMax: string;
  urlSort: string;
  urlPage: number;
}

function MarketplaceInner({
  paramKey,
  urlQ,
  urlCondition,
  urlCity,
  urlMin,
  urlMax,
  urlSort,
  urlPage,
}: MarketplaceInnerProps) {
  const router = useRouter();

  const [q, setQ] = useState(urlQ);
  const [city, setCity] = useState(urlCity);
  const [minPrice, setMinPrice] = useState(urlMin);
  const [maxPrice, setMaxPrice] = useState(urlMax);

  const [listings, setListings] = useState<Listing[]>([]);
  const [page, setPage] = useState(urlPage);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [refreshTick, setRefreshTick] = useState(0);
  const [loadedKey, setLoadedKey] = useState('');
  const [error, setError] = useState('');

  const currentKey = `${paramKey}|${refreshTick}`;
  const loading = loadedKey !== currentKey;

  function retryListings() {
    setError('');
    setRefreshTick((n) => n + 1);
  }

  useEffect(() => {
    let cancelled = false;

    async function fetchListings() {
      try {
        const params: Record<string, string> = { sort: urlSort, page: String(urlPage) };
        if (urlQ.trim()) params.q = urlQ.trim();
        if (urlCondition) params.condition = urlCondition;
        if (urlCity.trim()) params.location_city = urlCity.trim();
        if (urlMin) params.min_price = urlMin;
        if (urlMax) params.max_price = urlMax;

        const res = await api.getListings(params);
        if (cancelled) return;
        setListings(res.data.data);
        setPage(res.data.current_page);
        setLastPage(res.data.last_page);
        setTotal(res.data.total);
        setError('');
      } catch (err: unknown) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Gagal memuat daftar buku bekas.');
      } finally {
        if (!cancelled) setLoadedKey(currentKey);
      }
    }

    fetchListings();
    return () => {
      cancelled = true;
    };
  }, [urlQ, urlCondition, urlCity, urlMin, urlMax, urlSort, urlPage, currentKey]);

  function applyFilters(overrides: Record<string, string | number> = {}) {
    const next = new URLSearchParams();
    const values: Record<string, string> = {
      q: q.trim(),
      condition: urlCondition,
      location_city: city.trim(),
      min_price: minPrice,
      max_price: maxPrice,
      sort: urlSort,
      page: '1',
      ...Object.fromEntries(Object.entries(overrides).map(([k, v]) => [k, String(v)])),
    };
    const nextQ = values.q.trim();
    if (nextQ && nextQ !== urlQ.trim()) {
      trackSearch(nextQ, 'marketplace');
    }
    Object.entries(values).forEach(([k, v]) => {
      if (v && !(k === 'sort' && v === 'newest') && !(k === 'page' && v === '1')) {
        next.set(k, v);
      }
    });
    const qs = next.toString();
    router.replace(qs ? `/marketplace?${qs}` : '/marketplace');
  }

  function resetAll() {
    setQ('');
    setCity('');
    setMinPrice('');
    setMaxPrice('');
    router.replace('/marketplace');
  }

  const activeChips: { key: string; label: string; resetValue: string }[] = [];
  if (urlQ.trim()) activeChips.push({ key: 'q', label: `Cari: "${urlQ.trim()}"`, resetValue: '' });
  if (urlCondition) {
    activeChips.push({
      key: 'condition',
      label: `Kondisi: ${getConditionSpec(urlCondition)?.label ?? urlCondition}`,
      resetValue: '',
    });
  }
  if (urlCity.trim()) {
    activeChips.push({ key: 'location_city', label: `Kota: ${urlCity.trim()}`, resetValue: '' });
  }
  if (urlMin) activeChips.push({ key: 'min_price', label: `Min Rp\u00A0${Number(urlMin).toLocaleString('id-ID')}`, resetValue: '' });
  if (urlMax) activeChips.push({ key: 'max_price', label: `Maks Rp\u00A0${Number(urlMax).toLocaleString('id-ID')}`, resetValue: '' });
  if (urlSort !== 'newest') {
    activeChips.push({
      key: 'sort',
      label: `Urut: ${SORTS.find((s) => s.value === urlSort)?.label ?? urlSort}`,
      resetValue: 'newest',
    });
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="type-page-title text-ink mb-1">Marketplace buku bekas</h1>
          <p className="text-stone-600 text-sm">
            Buku bekas dari sesama pembaca. Cek foto kondisi, kota asal, dan harga sebelum memesan.
          </p>
        </div>
        <Link
          href="/jual"
          className="bg-forest-700 text-cream px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-forest-900 transition-colors"
        >
          Jual buku
        </Link>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          applyFilters({ page: 1 });
        }}
        className="bg-white border border-warm-border rounded-lg p-4 mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6"
      >
        <div className="lg:col-span-2">
          <label htmlFor="mp-q" className="block text-xs font-semibold text-stone-700 mb-1">
            Judul, penulis, atau penjual
          </label>
          <input
            id="mp-q"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari judul buku…"
            className="w-full border border-input-border rounded-lg px-3 py-2 text-sm bg-white"
          />
        </div>

        <div>
          <label htmlFor="mp-cond" className="block text-xs font-semibold text-stone-700 mb-1">
            Kondisi
          </label>
          <select
            id="mp-cond"
            value={urlCondition}
            onChange={(e) => applyFilters({ condition: e.target.value, page: 1 })}
            className="w-full border border-input-border rounded-lg px-3 py-2 text-sm bg-white"
          >
            <option value="">Semua kondisi</option>
            {BOOK_CONDITIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="mp-city" className="block text-xs font-semibold text-stone-700 mb-1">
            Kota
          </label>
          <input
            id="mp-city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="cth: Bandung"
            className="w-full border border-input-border rounded-lg px-3 py-2 text-sm bg-white"
          />
        </div>

        <div>
          <span className="block text-xs font-semibold text-stone-700 mb-1">Harga (Rp)</span>
          <div className="flex gap-1.5">
            <input
              type="number"
              min={0}
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              placeholder="Min"
              aria-label="Harga minimum"
              className="w-1/2 border border-input-border rounded-lg px-2.5 py-2 text-sm bg-white tabular-nums"
            />
            <input
              type="number"
              min={0}
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="Maks"
              aria-label="Harga maksimum"
              className="w-1/2 border border-input-border rounded-lg px-2.5 py-2 text-sm bg-white tabular-nums"
            />
          </div>
        </div>

        <div className="flex flex-col justify-end">
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 bg-forest-700 text-cream px-4 py-2 rounded-lg text-sm font-medium hover:bg-forest-900 transition-colors cursor-pointer"
            >
              Terapkan
            </button>
            <button
              type="button"
              onClick={resetAll}
              className="border border-input-border px-3 py-2 rounded-lg text-sm text-ink hover:bg-paper cursor-pointer"
            >
              Reset
            </button>
          </div>
        </div>
      </form>

      {activeChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-5 text-xs">
          <span className="text-stone-600 font-medium">Filter aktif:</span>
          {activeChips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => {
                if (chip.key === 'q') setQ('');
                if (chip.key === 'location_city') setCity('');
                if (chip.key === 'min_price') setMinPrice('');
                if (chip.key === 'max_price') setMaxPrice('');
                applyFilters({ [chip.key]: chip.resetValue, page: 1 });
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-forest-100 text-forest-900 font-medium hover:bg-forest-100/75 transition-colors cursor-pointer"
            >
              <span>{chip.label}</span>
              <span aria-hidden="true">✕</span>
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <p className="text-sm text-stone-600 tabular-nums">
          {loading ? 'Memuat…' : `${total} buku tersedia`}
        </p>
        <div className="flex items-center gap-2">
          <label htmlFor="mp-sort" className="text-xs font-semibold text-stone-700">
            Urutkan:
          </label>
          <select
            id="mp-sort"
            value={urlSort}
            onChange={(e) => applyFilters({ sort: e.target.value, page: 1 })}
            className="border border-input-border rounded-lg px-3 py-1.5 text-sm bg-white"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <ErrorState title="Gagal memuat marketplace" message={error} onRetry={retryListings} />}
      {loading && <SkeletonCards count={8} />}

      {!loading && !error && listings.length === 0 && (
        <EmptyState
          title="Belum ada buku yang sesuai filter"
          hint="Ubah pilihan kota, kondisi, atau rentang harga untuk melihat tawaran lain."
          action={
            <button
              type="button"
              onClick={resetAll}
              className="inline-block bg-forest-700 text-cream px-5 py-2 rounded-lg text-sm font-medium cursor-pointer"
            >
              Reset filter
            </button>
          }
        />
      )}

      {!loading && !error && listings.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {listings.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      )}

      {!loading && lastPage > 1 && (
        <div className="flex items-center justify-center gap-3 mt-10">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => applyFilters({ page: page - 1 })}
            className="px-4 py-2 rounded-lg border border-input-border bg-white text-sm text-ink disabled:opacity-40 hover:bg-paper cursor-pointer"
          >
            Sebelumnya
          </button>
          <span className="text-sm text-stone-600 tabular-nums">
            Halaman {page} dari {lastPage}
          </span>
          <button
            type="button"
            disabled={page >= lastPage}
            onClick={() => applyFilters({ page: page + 1 })}
            className="px-4 py-2 rounded-lg border border-input-border bg-white text-sm text-ink disabled:opacity-40 hover:bg-paper cursor-pointer"
          >
            Berikutnya
          </button>
        </div>
      )}
    </div>
  );
}
