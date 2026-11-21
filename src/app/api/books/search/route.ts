import { NextRequest, NextResponse } from 'next/server';

interface OpenLibraryDoc {
  key?: string;
  title?: string;
  author_name?: string[];
  publisher?: string[] | string;
  first_publish_year?: number;
  language?: string[];
  cover_i?: number;
  subject?: string[];
  number_of_pages_median?: number;
  isbn?: string[] | string;
}

interface OpenLibraryBookEntry {
  key?: string;
  title?: string;
  authors?: { name?: string }[];
  publishers?: { name?: string }[];
  publish_date?: string;
  number_of_pages?: number;
  subjects?: { name?: string }[];
  cover?: { large?: string; medium?: string };
}

async function fetchWithTimeoutAndRetry(url: string): Promise<Response | null> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      if (res.ok) return res;
      if (res.status < 500) return null;
    } catch {
      /* ulangi sekali untuk error jaringan sementara */
    } finally {
      clearTimeout(timer);
    }
  }
  return null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') ?? '').trim();
  const isbn = (searchParams.get('isbn') ?? '').trim();

  if (!q && !isbn) {
    return NextResponse.json(
      { success: false, message: 'Parameter q atau isbn wajib diisi.' },
      { status: 422 }
    );
  }

  let external: Record<string, unknown>[] = [];
  let fetchedOk = false;

  if (isbn) {
    const url = `https://openlibrary.org/api/books?bibkeys=${encodeURIComponent(`ISBN:${isbn}`)}&format=json&jscmd=data`;
    const res = await fetchWithTimeoutAndRetry(url);
    if (res) {
      fetchedOk = true;
      const raw = (await res.json().catch(() => ({}))) as Record<string, OpenLibraryBookEntry>;
      const entry = raw[`ISBN:${isbn}`];
      if (entry) {
        external = [
          {
            id: '',
            open_library_id: entry.key ?? null,
            isbn,
            title: entry.title ?? 'Tanpa Judul',
            authors: (entry.authors ?? []).map((a) => a.name).filter(Boolean),
            publisher: entry.publishers?.[0]?.name ?? null,
            published_date: entry.publish_date ?? null,
            language: null,
            format: null,
            edition_label: null,
            description: null,
            cover_url: entry.cover?.large ?? entry.cover?.medium ?? null,
            categories: (entry.subjects ?? []).slice(0, 5).map((s) => s.name).filter(Boolean),
            page_count: entry.number_of_pages ?? null,
            avg_rating: null,
            ratings_count: 0,
            reviews_count: 0,
          },
        ];
      }
    }
  } else {
    const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=16`;
    const res = await fetchWithTimeoutAndRetry(url);
    if (res) {
      fetchedOk = true;
      const raw = (await res.json().catch(() => ({}))) as { docs?: OpenLibraryDoc[] };
      const docs = raw.docs ?? [];
      external = docs.map((item) => {
        const coverId = item.cover_i ?? null;
        const isbnVal = Array.isArray(item.isbn) ? (item.isbn[0] ?? null) : (item.isbn ?? null);
        return {
          id: '',
          open_library_id: item.key ?? null,
          isbn: isbnVal,
          title: item.title ?? 'Tanpa Judul',
          authors: item.author_name ?? [],
          publisher: Array.isArray(item.publisher)
            ? (item.publisher[0] ?? null)
            : (item.publisher ?? null),
          published_date: item.first_publish_year ? `${item.first_publish_year}-01-01` : null,
          language: Array.isArray(item.language) ? (item.language[0] ?? null) : null,
          format: null,
          edition_label: null,
          description: null,
          cover_url: coverId ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg` : null,
          categories: (item.subject ?? []).slice(0, 5),
          page_count: item.number_of_pages_median ?? null,
          avg_rating: null,
          ratings_count: 0,
          reviews_count: 0,
        };
      });
    }
  }

  return NextResponse.json(
    {
      success: true,
      degraded: !fetchedOk,
      data: { external },
    },
    {
      headers: fetchedOk
        ? { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' }
        : { 'Cache-Control': 'no-store' },
    }
  );
}
