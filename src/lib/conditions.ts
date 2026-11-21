export interface ConditionSpec {
  value: 'new' | 'like_new' | 'good' | 'fair' | 'poor';
  label: string;
  summary: string;
  details: string[];
}

export const BOOK_CONDITIONS: ConditionSpec[] = [
  {
    value: 'new',
    label: 'Baru',
    summary: 'Belum pernah dibaca, segel atau kondisi seperti toko.',
    details: [
      'Sampul mulus tanpa lipatan atau goresan.',
      'Halaman bersih, kaku, tidak menguning.',
      'Tanpa coretan, stabilo, atau lipatan sudut.',
      'Kelengkapan utuh (jaket buku/pembatas jika ada).',
    ],
  },
  {
    value: 'like_new',
    label: 'Seperti Baru',
    summary: 'Pernah dibaca sekali dengan sangat hati-hati.',
    details: [
      'Sampul dan punggung buku (spine) masih rapi tanpa tekukan.',
      'Halaman bersih, tanpa coretan/catatan/lipatan.',
      'Tidak ada noda air, jamur, atau bau menyengat.',
      'Kelengkapan halaman utuh.',
    ],
  },
  {
    value: 'good',
    label: 'Baik',
    summary: 'Bekas pakai normal yang terawat dan nyaman dibaca.',
    details: [
      'Sampul utuh dengan sedikit tanda pemakaian ringan di tepi.',
      'Halaman lengkap, mungkin sedikit menguning karena usia.',
      'Maksimal catatan pensil tipis atau nama pemilik di halaman depan.',
      'Penjilidan kokoh, tidak ada halaman lepas.',
    ],
  },
  {
    value: 'fair',
    label: 'Cukup',
    summary: 'Tanda pemakaian terlihat jelas, namun seluruh teks terbaca.',
    details: [
      'Sampul atau punggung buku memiliki lipatan/tekukan.',
      'Mungkin terdapat coretan pena, stabilo, atau noda ringan.',
      'Semua halaman masih lengkap dan tidak lepas.',
      'Tidak ada kerusakan air berat atau jamur aktif.',
    ],
  },
  {
    value: 'poor',
    label: 'Rusak Ringan',
    summary: 'Ada kekurangan fisik yang wajib dijelaskan penjual di deskripsi.',
    details: [
      'Sampul sobek ringan, sudut terkelupas, atau punggung buku lemas.',
      'Banyak coretan/stabilo atau noda bekas air.',
      'Halaman tetap terbaca; bila ada halaman lepas/hilang wajib ditulis.',
    ],
  },
];

export function getConditionSpec(value: string): ConditionSpec | undefined {
  return BOOK_CONDITIONS.find((c) => c.value === value);
}

export const LISTING_STATUS_META: Record<string, { label: string; badgeClass: string }> = {
  active: { label: 'Tersedia', badgeClass: 'bg-green-100 text-green-800' },
  reserved: { label: 'Dipesan', badgeClass: 'bg-amber-100 text-amber-800' },
  sold: { label: 'Terjual', badgeClass: 'bg-stone-200 text-stone-700' },
  hidden: { label: 'Disembunyikan', badgeClass: 'bg-stone-200 text-stone-500' },
};
