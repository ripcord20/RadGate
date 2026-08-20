import { Link } from 'react-router-dom';
import { ROUTES } from '@radgate/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-primary to-sidebar p-4">
      <Card className="w-full max-w-sm">
        <div className="border-b border-border px-6 py-4 text-center">
          <h1 className="text-lg font-semibold tracking-tight">Daftar Akun Baru</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Pendaftaran mandiri tidak dibuka. Hubungi administrator untuk dibuatkan akun.
          </p>
        </div>
        <CardContent className="space-y-3 pt-4">
          <div className="space-y-1.5">
            <Label>Nama</Label>
            <Input disabled placeholder="Diisi oleh admin" />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input disabled type="email" placeholder="Diisi oleh admin" />
          </div>
          <Button type="button" variant="dark" className="w-full" disabled>
            Daftar dinonaktifkan
          </Button>
          <p className="text-center text-xs">
            <Link to={ROUTES.public.login} className="text-primary hover:underline">
              Sudah punya akun? Login
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
