'use client';

import { useEffect, useId, useState } from 'react';
import Link from 'next/link';
import { trackJoinReadingClub } from '@/lib/analytics';
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
      if (!res.alreadyJoined) trackJoinReadingClub(id);
      showToast(res.message, res.alreadyJoined ? 'info' : 'success');
      reloadCommunity();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Gagal bergabung ke klub.', 'error');
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="type-page-title text-ink mb-1">Komunitas dan klub baca</h1>
        <p className="text-stone-600 text-sm">
          Tempat membentuk klub baca dan membahas isi buku, terpisah dari obrolan jual-beli.
        </p>
      </div>

      {error && <ErrorState title="Gagal memuat komunitas" message={error} onRetry={reloadCommunity} />}

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <h2 className="type-section text-ink mb-4">Klub baca aktif</h2>
          {loading ? (
            <p className="text-sm text-stone-600">Memuat klub baca…</p>
          ) : clubs.length === 0 ? (
            <p className="text-sm text-stone-600 bg-white border border-warm-border rounded-lg p-5 mb-8">
              Belum ada klub baca. Kamu bisa membuat yang pertama dari formulir di samping.
            </p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4 mb-10">
              {clubs.map((c) => {
                const isJoined = joinedClubIds.has(c.id);
                return (
                  <article
                    key={c.id}
                    className="bg-white border border-warm-border rounded-lg p-4 flex flex-col"
                  >
                    <h3 className="type-card-title text-base text-ink mb-1">{c.name}</h3>
                    {c.description && (
                      <p className="text-sm text-stone-600 mb-2 line-clamp-2">{c.description}</p>
                    )}
                    {c.schedule_note && (
                      <p className="text-xs text-forest-900 bg-forest-50 px-2.5 py-1 rounded-sm mb-3 w-fit font-medium">
                        Jadwal: {c.schedule_note}
                      </p>
                    )}
                    <div className="mt-auto flex items-center justify-between pt-3 border-t border-warm-border/75 text-xs text-stone-600 tabular-nums">
                      <span>
                        {c.members_count ?? 1} anggota • {c.topics_count ?? 0} topik
                      </span>
                      {!user ? (
                        <Link href="/login?next=/komunitas" className="underline font-medium text-forest-700">
                          Masuk untuk bergabung
                        </Link>
                      ) : isJoined ? (
                        <span className="px-2.5 py-1 rounded-md bg-forest-100 text-forest-900 font-medium">
                          Sudah bergabung
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleJoin(c.id)}
                          className="bg-forest-700 text-cream px-3 py-1.5 rounded-md font-medium hover:bg-forest-900 transition-colors cursor-pointer"
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

          <h2 className="type-section text-ink mb-4">Diskusi buku terbaru</h2>
          {loading ? (
            <p className="text-sm text-stone-600">Memuat diskusi…</p>
          ) : topics.length === 0 ? (
            <p className="text-sm text-stone-600 bg-white border border-warm-border rounded-lg p-5">
              Belum ada topik diskusi. Buka halaman salah satu buku untuk mulai membahasnya.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {topics.map((t) => (
                <article
                  key={t.id}
                  className="bg-white border border-warm-border rounded-lg p-4 hover:border-stone-400 transition-colors"
                >
                  <div className="flex flex-wrap items-center gap-2 text-xs text-stone-600 mb-1">
                    {t.book && (
                      <Link
                        href={`/books/${t.book.id}#diskusi`}
                        className="font-medium text-forest-700 underline"
                      >
                        {t.book.title}
                      </Link>
                    )}
                    {t.club && (
                      <span className="bg-paper text-stone-700 px-2 py-0.5 rounded-sm">
                        {t.club.name}
                      </span>
                    )}
                    {t.is_spoiler && (
                      <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded-sm font-medium">
                        Spoiler
                      </span>
                    )}
                  </div>

                  {t.book ? (
                    <Link
                      href={`/books/${t.book.id}#diskusi`}
                      className="font-semibold text-ink hover:underline block"
                    >
                      {t.title}
                    </Link>
                  ) : (
                    <h3 className="font-semibold text-ink">{t.title}</h3>
                  )}

                  <p className="text-xs text-stone-600 mt-1 tabular-nums">
                    oleh {t.user?.name} • {t.replies_count ?? 0} balasan
                  </p>
                </article>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="bg-white border border-warm-border rounded-lg p-5">
            <h2 className="font-sans font-semibold text-base text-ink mb-1.5">Buat klub baca</h2>
            <p className="text-xs text-stone-600 mb-4 leading-relaxed">
              Pembuat klub otomatis menjadi pengelola diskusi.
            </p>
            {user ? (
              <form onSubmit={handleCreateClub} className="flex flex-col gap-3">
                <div>
                  <label htmlFor={nameId} className="block text-xs font-semibold text-stone-700 mb-1">
                    Nama klub
                  </label>
                  <input
                    id={nameId}
                    value={clubName}
                    onChange={(e) => setClubName(e.target.value)}
                    required
                    placeholder="cth: Klub Fiksi Akhir Pekan"
                    className="w-full border border-input-border rounded-lg p-2.5 text-sm bg-white"
                  />
                </div>
                <div>
                  <label htmlFor={scheduleId} className="block text-xs font-semibold text-stone-700 mb-1">
                    Jadwal atau buku pilihan
                  </label>
                  <input
                    id={scheduleId}
                    value={clubSchedule}
                    onChange={(e) => setClubSchedule(e.target.value)}
                    placeholder="cth: Tiap Minggu pukul 19.00"
                    className="w-full border border-input-border rounded-lg p-2.5 text-sm bg-white"
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
                    placeholder="Aturan dan fokus bacaan klub…"
                    className="w-full border border-input-border rounded-lg p-2.5 text-sm bg-white"
                  />
                </div>
                <button
                  type="submit"
                  disabled={creating}
                  className="bg-forest-700 text-cream rounded-lg py-2.5 text-sm font-medium hover:bg-forest-900 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {creating ? 'Membuat…' : 'Buat klub'}
                </button>
              </form>
            ) : (
              <Link
                href="/login?next=/komunitas"
                className="block text-center bg-forest-700 text-cream rounded-lg py-2.5 text-sm font-medium hover:bg-forest-900 transition-colors"
              >
                Masuk untuk membuat klub
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
