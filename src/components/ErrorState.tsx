'use client';

import { useRouter } from 'next/navigation';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export default function ErrorState({
  title = 'Gagal memuat data',
  message = 'Koneksi ke layanan sedang terganggu. Periksa jaringan lalu coba muat ulang.',
  onRetry,
}: ErrorStateProps) {
  const router = useRouter();

  function handleRetry() {
    if (onRetry) {
      onRetry();
    } else {
      router.refresh();
    }
  }

  return (
    <div
      role="alert"
      className="bg-red-50 border border-red-200 rounded-lg p-6 text-center my-4"
    >
      <p className="font-semibold text-red-900 mb-1">{title}</p>
      <p className="text-sm text-red-800 mb-4 max-w-lg mx-auto">{message}</p>
      <button
        type="button"
        onClick={handleRetry}
        className="bg-forest-700 text-cream text-sm font-medium px-5 py-2 rounded-lg hover:bg-forest-900 transition-colors cursor-pointer"
      >
        Muat ulang
      </button>
    </div>
  );
}
