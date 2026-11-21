const RULES: [RegExp, string][] = [
  [/fantas/i, 'Fantasi'],
  [/science fiction|dystop|fiksi ilmiah|space/i, 'Fiksi Ilmiah'],
  [/myster|crime|detective|thriller|misteri/i, 'Misteri'],
  [/horror|horor|gothic/i, 'Horor'],
  [/romance|romansa|love story/i, 'Romansa'],
  [/self.help|psycholog|business|productiv|pengembangan|management|finance|money|habit/i, 'Pengembangan Diri'],
  [/biograph|memoir|autobiograph/i, 'Biografi'],
  [/histor|sejarah/i, 'Sejarah'],
  [/children|juvenile|young adult|anak|picture book/i, 'Anak'],
  [/relig|islam|christian|spiritual/i, 'Religi'],
  [/indonesia/i, 'Fiksi Indonesia'],
  [/fiction|novel|fiksi|literature|stories/i, 'Fiksi'],
];

const GENRE_TO_CATEGORY: Record<string, string> = {
  Fantasi: 'Fantasy',
  'Fiksi Ilmiah': 'Science',
  Misteri: 'Mystery',
  'Pengembangan Diri': 'Self-Help',
  Biografi: 'Biography',
  Sejarah: 'History',
  'Fiksi Indonesia': 'Fiksi Indonesia',
  Fiksi: 'Fiction',
};

export function genreFilterCategory(displayGenre: string): string {
  return GENRE_TO_CATEGORY[displayGenre] ?? '';
}

export function genreOf(categories: string[] | null | undefined): string {
  const cats = (categories ?? []).join(' ');
  for (const [re, genre] of RULES) {
    if (re.test(cats)) return genre;
  }
  return 'Lainnya';
}

export function groupByGenre<T extends { categories?: string[] | null }>(
  books: T[]
): { genre: string; books: T[] }[] {
  const map = new Map<string, T[]>();
  for (const b of books) {
    const g = genreOf(b.categories);
    if (!map.has(g)) map.set(g, []);
    map.get(g)!.push(b);
  }
  const order = [
    'Fiksi Indonesia',
    'Fantasi',
    'Fiksi',
    'Fiksi Ilmiah',
    'Misteri',
    'Horor',
    'Romansa',
    'Pengembangan Diri',
    'Biografi',
    'Sejarah',
    'Anak',
    'Religi',
    'Lainnya',
  ];
  return [...map.entries()]
    .map(([genre, items]) => ({ genre, books: items }))
    .sort((a, b) => order.indexOf(a.genre) - order.indexOf(b.genre));
}
