export default function Footer() {
  const email = process.env.NEXT_PUBLIC_CS_EMAIL ?? 'cs@bukulapak.id';
  return (
    <footer className="bg-forest-700 text-cream mt-16 py-8 text-center text-sm shadow-md">
      <p className="font-serif font-bold text-lg mb-1">BukuLapak</p>
      <p className="mb-2 text-cream/80">© 2026 BukuLapak. Semua hak dilindungi.</p>
      <p className="text-cream/80">
        Butuh bantuan?{' '}
        <a href={`mailto:${email}`} className="underline hover:text-white">
          {email}
        </a>
      </p>
    </footer>
  );
}
