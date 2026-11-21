'use client';

import { useEffect, useId, useState } from 'react';
import Link from 'next/link';
import { api, type DiscussionTopic } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { ReportDialog } from './Dialogs';
import { useToast } from './ToastProvider';

export default function BookDiscussions({ bookId }: { bookId: string }) {
  const { user, token } = useAuth();
  const { showToast } = useToast();
  const [topics, setTopics] = useState<DiscussionTopic[]>([]);
  const [loadedKey, setLoadedKey] = useState('');
  const [refreshTick, setRefreshTick] = useState(0);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [activeTopic, setActiveTopic] = useState<DiscussionTopic | null>(null);
  const [replyBody, setReplyBody] = useState('');
  const [replySpoiler, setReplySpoiler] = useState(false);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [reportTarget, setReportTarget] = useState<{
    type: 'discussion_topic' | 'discussion_reply';
    id: string;
    label: string;
  } | null>(null);

  const titleInputId = useId();
  const bodyInputId = useId();
  const spoilerInputId = useId();

  const currentKey = `${bookId}:${refreshTick}`;
  const loading = loadedKey !== currentKey;

  useEffect(() => {
    let cancelled = false;
    api
      .getDiscussions({ book_id: bookId })
      .then((res) => {
        if (cancelled) return;
        setTopics(res.data.data);
        setLoadedKey(currentKey);
      })
      .catch(() => {
        if (!cancelled) setLoadedKey(currentKey);
      });
    return () => {
      cancelled = true;
    };
  }, [bookId, currentKey]);

  async function openTopic(id: string) {
    try {
      const res = await api.getDiscussion(id);
      setActiveTopic(res.data.topic);
    } catch {
      showToast('Gagal membuka topik diskusi.', 'error');
    }
  }

  async function submitTopic(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !title.trim() || !body.trim() || sending) return;
    setSending(true);
    setError('');
    try {
      await api.createDiscussion(
        { book_id: bookId, title: title.trim(), body: body.trim(), is_spoiler: isSpoiler },
        token
      );
      setTitle('');
      setBody('');
      setIsSpoiler(false);
      showToast('Topik diskusi berhasil dibuat.', 'success');
      setRefreshTick((n) => n + 1);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal membuat topik');
    } finally {
      setSending(false);
    }
  }

  async function submitReply(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !activeTopic || !replyBody.trim() || sending) return;
    setSending(true);
    try {
      await api.replyDiscussion(
        activeTopic.id,
        { body: replyBody.trim(), is_spoiler: replySpoiler },
        token
      );
      setReplyBody('');
      setReplySpoiler(false);
      showToast('Balasan terkirim.', 'success');
      await openTopic(activeTopic.id);
      setRefreshTick((n) => n + 1);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Gagal mengirim balasan.', 'error');
    } finally {
      setSending(false);
    }
  }

  async function handleReportSubmit(category: string, reason: string) {
    if (!token || !reportTarget) return;
    try {
      const res = await api.reportContent(
        {
          reportable_type: reportTarget.type,
          reportable_id: reportTarget.id,
          category,
          reason,
        },
        token
      );
      showToast(res.message, 'success');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Gagal mengirim laporan.', 'error');
    }
  }

  return (
    <section id="diskusi" className="bg-paper border border-warm-border rounded-2xl p-6 mt-8 scroll-mt-24">
      <h2 className="font-serif text-2xl font-bold text-forest-900 mb-1">Diskusi Pembaca</h2>
      <p className="text-sm text-stone-600 mb-4">
        Bahasan alur, tema, atau teori pembaca tentang buku ini (terpisah dari chat transaksi).
      </p>

      {user ? (
        <form
          onSubmit={submitTopic}
          className="bg-white border border-warm-border rounded-xl p-4 mb-6 flex flex-col gap-3"
        >
          <div>
            <label htmlFor={titleInputId} className="block text-xs font-semibold text-stone-700 mb-1">
              Judul topik diskusi
            </label>
            <input
              id={titleInputId}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="cth: Makna akhir cerita di bab terakhir"
              required
              className="w-full border border-stone-300 rounded-xl p-2.5 text-sm bg-white"
            />
          </div>

          <div>
            <label htmlFor={bodyInputId} className="block text-xs font-semibold text-stone-700 mb-1">
              Isi pemikiran atau pertanyaan
            </label>
            <textarea
              id={bodyInputId}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Tulis pertanyaan atau pemikiranmu tentang buku ini…"
              rows={3}
              required
              className="w-full border border-stone-300 rounded-xl p-2.5 text-sm bg-white"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <label htmlFor={spoilerInputId} className="flex items-center gap-2 text-xs text-stone-700 cursor-pointer">
              <input
                id={spoilerInputId}
                type="checkbox"
                checked={isSpoiler}
                onChange={(e) => setIsSpoiler(e.target.checked)}
              />
              <span>Mengandung spoiler cerita</span>
            </label>
            <button
              type="submit"
              disabled={sending}
              className="bg-forest-700 text-cream text-sm font-semibold px-4 py-2 rounded-xl hover:bg-forest-900 transition disabled:opacity-50 cursor-pointer"
            >
              {sending ? 'Mengirim…' : 'Buat Topik'}
            </button>
          </div>
          {error && <p className="text-xs text-red-700">{error}</p>}
        </form>
      ) : (
        <p className="text-sm text-stone-600 bg-white border border-warm-border rounded-xl p-4 mb-6">
          <Link
            href={`/login?next=${encodeURIComponent(`/books/${bookId}#diskusi`)}`}
            className="underline font-semibold text-forest-700"
          >
            Login
          </Link>{' '}
          untuk memulai atau membalas diskusi.
        </p>
      )}

      {loading ? (
        <p className="text-sm text-stone-500">Memuat diskusi…</p>
      ) : topics.length === 0 ? (
        <p className="text-sm text-stone-600">Belum ada topik diskusi untuk buku ini.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {topics.map((t) => {
            const key = `topic-${t.id}`;
            const isOpen = activeTopic?.id === t.id;
            return (
              <article key={t.id} className="bg-white border border-warm-border rounded-xl p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <button
                      type="button"
                      onClick={() => (isOpen ? setActiveTopic(null) : openTopic(t.id))}
                      className="font-semibold text-forest-900 hover:underline text-left cursor-pointer"
                    >
                      {t.title}
                    </button>
                    <p className="text-xs text-stone-500 mt-0.5">
                      oleh {t.user?.name} • {t.replies_count ?? 0} balasan
                      {t.is_spoiler && (
                        <span className="ml-2 bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full font-semibold">
                          Spoiler
                        </span>
                      )}
                    </p>
                  </div>
                  {user && (
                    <button
                      type="button"
                      onClick={() =>
                        setReportTarget({
                          type: 'discussion_topic',
                          id: t.id,
                          label: `Topik "${t.title}"`,
                        })
                      }
                      className="text-xs text-stone-500 hover:text-red-700 underline cursor-pointer"
                    >
                      Laporkan
                    </button>
                  )}
                </div>

                {t.is_spoiler && !revealed[key] ? (
                  <button
                    type="button"
                    onClick={() => setRevealed((r) => ({ ...r, [key]: true }))}
                    className="mt-2 text-xs underline font-semibold text-amber-900 cursor-pointer"
                  >
                    Tampilkan isi (mengandung spoiler)
                  </button>
                ) : (
                  <p className="text-sm text-stone-700 mt-2">{t.body}</p>
                )}

                {isOpen && activeTopic && (
                  <div className="mt-4 pt-3 border-t border-stone-100 space-y-3">
                    {(activeTopic.replies ?? []).map((rep) => {
                      const rKey = `rep-${rep.id}`;
                      return (
                        <div key={rep.id} className="bg-stone-50 rounded-xl p-3 text-sm">
                          <div className="flex justify-between text-xs text-stone-500 mb-1">
                            <span className="font-semibold text-stone-700">{rep.user?.name}</span>
                            {user && (
                              <button
                                type="button"
                                onClick={() =>
                                  setReportTarget({
                                    type: 'discussion_reply',
                                    id: rep.id,
                                    label: `Balasan oleh ${rep.user?.name ?? 'pengguna'}`,
                                  })
                                }
                                className="hover:text-red-700 underline cursor-pointer"
                              >
                                Laporkan
                              </button>
                            )}
                          </div>
                          {rep.is_spoiler && !revealed[rKey] ? (
                            <button
                              type="button"
                              onClick={() => setRevealed((r) => ({ ...r, [rKey]: true }))}
                              className="text-xs underline font-semibold text-amber-900 cursor-pointer"
                            >
                              Tampilkan balasan (spoiler)
                            </button>
                          ) : (
                            <p className="text-stone-700">{rep.body}</p>
                          )}
                        </div>
                      );
                    })}

                    {user && (
                      <form onSubmit={submitReply} className="flex flex-col gap-2">
                        <label htmlFor={`reply-input-${t.id}`} className="sr-only">
                          Tulis balasan diskusi
                        </label>
                        <textarea
                          id={`reply-input-${t.id}`}
                          value={replyBody}
                          onChange={(e) => setReplyBody(e.target.value)}
                          placeholder="Tulis balasan…"
                          rows={2}
                          required
                          className="border border-stone-300 rounded-xl p-2.5 text-sm bg-white"
                        />
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-1.5 text-xs text-stone-600 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={replySpoiler}
                              onChange={(e) => setReplySpoiler(e.target.checked)}
                            />
                            <span>Spoiler</span>
                          </label>
                          <button
                            type="submit"
                            disabled={sending}
                            className="bg-forest-700 text-cream text-xs font-semibold px-4 py-1.5 rounded-xl hover:bg-forest-900 cursor-pointer"
                          >
                            Balas
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      <ReportDialog
        open={Boolean(reportTarget)}
        targetLabel={reportTarget?.label ?? ''}
        onSubmit={handleReportSubmit}
        onCancel={() => setReportTarget(null)}
      />
    </section>
  );
}
