import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { ROUTES } from '@radgate/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-primary to-sidebar p-4">
      <Card className="w-full max-w-sm">
        <div className="border-b border-border px-6 py-4 text-center">
          <h1 className="text-lg font-semibold tracking-tight">Reset Password</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Gunakan tautan dari email lupa password. Tanpa token yang valid, password tidak dapat diubah dari halaman
            ini.
          </p>
        </div>
        <CardContent className="pt-4">
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              toast.success('Permintaan dicatat. Hubungi admin jika tautan email tidak tersedia.');
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="password">Password baru</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm">Ulangi password</Label>
              <Input
                id="confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>
            <Button type="submit" variant="dark" className="w-full" disabled={!password || password !== confirm}>
              Simpan password
            </Button>
          </form>
          <p className="mt-4 text-center text-xs">
            <Link to={ROUTES.public.login} className="text-primary hover:underline">
              Kembali ke login
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
