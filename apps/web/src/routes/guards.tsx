import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { ROUTES, type ModuleKey } from '@radgate/shared';
import { useApp } from '@/providers/app-provider';

function FullPageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="size-6 animate-spin text-primary" />
    </div>
  );
}

/**
 * Menahan route sampai `bootstrap` selesai. Tanpa penantian ini, peta izin masih kosong
 * saat sidebar dirender, sehingga seluruh menu sempat menghilang sekejap setiap reload.
 */
export function RequireAuth() {
  const { isAuthenticated, isLoading } = useApp();
  const location = useLocation();

  if (isLoading) return <FullPageLoader />;

  if (!isAuthenticated) {
    // Simpan tujuan semula supaya pengguna kembali ke sana setelah login.
    return <Navigate to={ROUTES.public.login} replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}

/** Pengguna yang sudah login tidak perlu melihat halaman login lagi. */
export function RedirectIfAuthenticated() {
  const { isAuthenticated, isLoading } = useApp();

  if (isLoading) return <FullPageLoader />;
  if (isAuthenticated) return <Navigate to={ROUTES.dashboard.index} replace />;

  return <Outlet />;
}

/**
 * Penjaga per modul. Pemeriksaan yang sama diulang di backend lewat guard, karena
 * kontrol di frontend hanya menyembunyikan, bukan mengamankan.
 */
export function RequireModule({ module }: { module: ModuleKey }) {
  const { can } = useApp();

  if (!can(module)) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <h1 className="text-lg font-semibold">Tidak punya akses</h1>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Peran Anda tidak memiliki izin untuk membuka modul ini. Hubungi pemilik akun bila
          Anda merasa seharusnya bisa.
        </p>
      </div>
    );
  }

  return <Outlet />;
}
