import { Link } from 'react-router-dom';
import { ROUTES } from '@radgate/shared';
import { Button } from '@/components/ui/button';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="text-5xl font-semibold tracking-tight text-muted-foreground">404</p>
      <h1 className="mt-2 text-lg font-semibold">Halaman tidak ditemukan</h1>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Alamat yang Anda buka tidak ada atau sudah dipindahkan.
      </p>
      <Button className="mt-4" asChild>
        <Link to={ROUTES.dashboard.index}>Kembali ke Dashboard</Link>
      </Button>
    </div>
  );
}
