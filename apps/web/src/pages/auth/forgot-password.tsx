import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ROUTES } from '@radgate/shared';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');

  const submit = useMutation({
    mutationFn: () => api.post('/auth/forgot-password', { email }),
    onSettled: () => {
      toast.success('Jika email terdaftar, tautan reset akan dikirim');
    },
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-primary to-sidebar p-4">
      <Card className="w-full max-w-sm">
        <div className="border-b border-border px-6 py-4 text-center">
          <h1 className="text-lg font-semibold tracking-tight">Lupa Password</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">Masukkan email akun Anda</p>
        </div>
        <CardContent className="pt-4">
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              submit.mutate();
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="email" required>
                Email
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Button type="submit" variant="dark" className="w-full" disabled={!email || submit.isPending}>
              Kirim tautan
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
