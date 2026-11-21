'use client';

import { useEffect, useId, useState } from 'react';
import Link from 'next/link';
import { api, type DiscussionTopic, type ReadingClub } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import ErrorState from '@/components/ErrorState';
import { useToast } from '@/components/ToastProvider';

export default function KomunitasPage() {
  const { user, token } = useAuth();
  const { showToast } = useToast();
  const [clubs, setClubs] = useState<ReadingClub[]>([]);
  const [joinedClubIds, setJoinedClubIds] = useState<Set<string>>(new Set());
  const [topics, setTopics] = useState<DiscussionTopic[]>([]);
  const [refreshTick, setRefreshTick] = useState(0);
  const [loadedKey, setLoadedKey] = useState('');
  const [error, setError] = useState('');
  const currentKey = `${user?.id ?? 'guest'}:${refreshTick}`;
  const loading = loadedKey !== currentKey;

  const [clubName, setClubName] = useState('');
  const [clubDesc, setClubDesc] = useState('');
  const [clubSchedule, setClubSchedule] = useState('');
  const [creating, setCreating] = useState(false);

  const nameId = useId();
  const scheduleId = useId();
  const descId = useId();

  function reloadCommunity() {
    setError('');
    setRefreshTick((n) => n + 1);
  }

  useEffect(() => {
    let cancelled = false;

    async function fetchCommunity() {
      try {
        const [cRes, tRes] = await Promise.all([api.getClubs(), api.getDiscussions()]);
        if (cancelled) return;
        const clubList = cRes.data.data;
        setClubs(clubList);
        setTopics(tRes.data.data);

        if (user && clubList.length > 0) {
          const joined = await api.getUserJoinedClubIds(
            clubList.map((c) => c.id),
            user.id
          );
          if (cancelled) return;
          setJoinedClubIds(joined);
        } else {
          setJoinedClubIds(new Set());
        }
        setError('');
      } catch (err: unknown) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Gagal memuat data komunitas.');
      } finally {
        if (!cancelled) setLoadedKey(currentKey);
      }
    }

    fetchCommunity();
    return () => {
      cancelled = true;
    };
  }, [user, currentKey]);

  async function handleCreateClub(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !clubName.trim() || creating) return;
    setCreating(true);
    try {
      await api.createClub(
        {
          name: clubName.trim(),
          description: clubDesc.trim() || undefined,
          schedule_note: clubSchedule.trim() || undefined,
        },
        token
      );
      setClubName('');
      setClubDesc('');
      setClubSchedule('');
      showToast('Klub baca berhasil dibuat.', 'success');
      reloadCommunity();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Gagal membuat klub baca.', 'error');
    } finally {
      setCreating(false);
    }
  }

  async function handleJoin(id: string) {
    if (!token) return;
    try {
      const res = await api.joinClub(id, token);
      showToast(res.message, res.alreadyJoined ? 'info' : 'success');
      reloadCommunity();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Gagal bergabung ke klub.', 'error');
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-serif text-forest-900 mb-1">
          Komunitas &amp; Klub Baca
        </h1>
        <p className="text-stone-600 text-sm">
          Diskusi isi buku, klub baca terjadwal, dan topik pembaca — terpisah dari chat transaksi jual-beli.
        </p>
      </div>

      {error && <ErrorState title="Gagal memuat komunitas" message={error} onRetry={reloadCommunity} />}

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <h2 className="text-xl font-bold font-serif text-forest-900 mb-4">Klub Baca Aktif</h2>
          {loading ? (
            <p className="text-sm text-stone-500">Memuat klub baca…</p>
          ) : clubs.length === 0 ? (
            <p className="text-sm text-stone-600 bg-white border border-warm-border rounded-xl p-5 mb-8">
              Belum ada klub baca. Buat klub pertamamu!
            </p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4 mb-10">
              {clubs.map((c) => {
                const isJoined = joinedClubIds.has(c.id);
                return (
                  <article
                    key={c.id}
                    className="bg-white border border-warm-border rounded-xl p-4 flex flex-col"
                  >
                    <h3 className="font-bold font-serif text-lg text-forest-900 mb-1">{c.name}</h3>
                    {c.description && (
                      <p className="text-sm text-stone-600 mb-2 line-clamp-2">{c.description}</p>
                    )}
                    {c.schedule_note && (
                      <p className="text-xs text-forest-900 bg-forest-50 px-2.5 py-1 rounded-lg mb-3 w-fit font-medium">
                        Jadwal: {c.schedule_note}
                      </p>
                    )}
                    <div className="mt-auto flex items-center justify-between pt-3 border-t border-stone-100 text-xs text-stone-500">
                      <span>
                        {c.members_count ?? 1} anggota • {c.topics_count ?? 0} topik
                      </span>
                      {!user ? (
                        <Link href="/login?next=/komunitas" className="underline font-semibold text-forest-700">
                          Login untuk gabung
                        </Link>
                      ) : isJoined ? (
                        <span className="px-3 py-1 rounded-lg bg-forest-100 text-forest-900 font-semibold">
                          ✓ Bergabung
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleJoin(c.id)}
                          className="bg-forest-700 text-cream px-3 py-1.5 rounded-lg font-semibold hover:bg-forest-900 cursor-pointer"
                        >
                          Gabung
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          <h2 className="text-xl font-bold font-serif text-forest-900 mb-4">
            Diskusi Buku Terbaru
          </h2>
          {loading ? (
            <p className="text-sm text-stone-500">Memuat diskusi…</p>
          ) : topics.length === 0 ? (
            <p className="text-sm text-stone-600 bg-white border border-warm-border rounded-xl p-5">
              Belum ada topik diskusi. Buka halaman detail buku mana saja untuk memulai diskusi!
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {topics.map((t) => (
                <article
                  key={t.id}
                  className="bg-white border border-warm-border rounded-xl p-4 hover:border-forest-500 transition"
                >
                  <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500 mb-1">
                    {t.book && (
                      <Link
                        href={`/books/${t.book.id}#diskusi`}
                        className="font-semibold text-forest-700 underline"
                      >
                        {t.book.title}
                      </Link>
                    )}
                    {t.club && (
                      <span className="bg-stone-100 text-stone-700 px-2 py-0.5 rounded-full">
                        {t.club.name}
                      </span>
                    )}
                    {t.is_spoiler && (
                      <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full font-semibold">
                        Spoiler
                      </span>
                    )}
                  </div>

                  {t.book ? (
                    <Link
                      href={`/books/${t.book.id}#diskusi`}
                      className="font-semibold text-forest-900 hover:underline block"
                    >
                      {t.title}
                    </Link>
                  ) : (
                    <h3 className="font-semibold text-forest-900">{t.title}</h3>
                  )}

                  <p className="text-xs text-stone-500 mt-1">
                    oleh {t.user?.name} • {t.replies_count ?? 0} balasan
                  </p>
                </article>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="bg-white border border-warm-border rounded-xl p-5">
            <h2 className="font-bold font-serif text-lg text-forest-900 mb-2">Buat Klub Baca</h2>
            <p className="text-xs text-stone-500 mb-4">
              Pembuat klub otomatis menjadi moderator diskusi klub.
            </p>
            {user ? (
              <form onSubmit={handleCreateClub} className="flex flex-col gap-3">
                <div>
                  <label htmlFor={nameId} className="block text-xs font-semibold text-stone-700 mb-1">
                    Nama Klub
                  </label>
                  <input
                    id={nameId}
                    value={clubName}
                    onChange={(e) => setClubName(e.target.value)}
                    required
                    placeholder="cth: Klub Fiksi Akhir Pekan"
                    className="w-full border border-stone-300 rounded-xl p-2.5 text-sm bg-white"
                  />
                </div>
                <div>
                  <label htmlFor={scheduleId} className="block text-xs font-semibold text-stone-700 mb-1">
                    Jadwal / Buku Pilihan
                  </label>
                  <input
                    id={scheduleId}
                    value={clubSchedule}
                    onChange={(e) => setClubSchedule(e.target.value)}
                    placeholder="cth: Diskusi tiap Minggu 19.00"
                    className="w-full border border-stone-300 rounded-xl p-2.5 text-sm bg-white"
                  />
                </div>
                <div>
                  <label htmlFor={descId} className="block text-xs font-semibold text-stone-700 mb-1">
                    Deskripsi
                  </label>
                  <textarea
                    id={descId}
                    value={clubDesc}
                    onChange={(e) => setClubDesc(e.target.value)}
                    rows={3}
                    placeholder="Aturan & fokus bacaan klub…"
                    className="w-full border border-stone-300 rounded-xl p-2.5 text-sm bg-white"
                  />
                </div>
                <button
                  type="submit"
                  disabled={creating}
                  className="bg-forest-700 text-cream rounded-xl py-2.5 text-sm font-semibold hover:bg-forest-900 transition disabled:opacity-50 cursor-pointer"
                >
                  {creating ? 'Membuat…' : 'Buat Klub'}
                </button>
              </form>
            ) : (
              <Link
                href="/login?next=/komunitas"
                className="block text-center bg-forest-700 text-cream rounded-xl py-2.5 text-sm font-semibold hover:bg-forest-900 transition"
              >
                Login untuk Membuat Klub
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
