import * as React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { toast } from 'sonner';
import { ROUTES, loginSchema, type LoginInput, type LoginResponse } from '@radgate/shared';
import { api, applyServerErrors, setAccessToken, type NormalizedError } from '@/lib/api';
import { qk } from '@/lib/query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { FieldError, Label } from '@/components/ui/label';

const REMEMBERED_EMAIL_KEY = 'radgate.email';

export default function LoginPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = React.useState(false);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: localStorage.getItem(REMEMBERED_EMAIL_KEY) ?? '',
      password: '',
      rememberEmail: !!localStorage.getItem(REMEMBERED_EMAIL_KEY),
      // Token diisi saat submit oleh reCAPTCHA v3 yang berjalan tanpa interaksi pengguna.
      recaptchaToken: 'dev',
    },
  });

  const login = useMutation({
    mutationFn: async (values: LoginInput) => {
      const { data } = await api.post<LoginResponse>('/auth/login', values);
      return data;
    },
    onSuccess: async (data, values) => {
      setAccessToken(data.accessToken);

      if (values.rememberEmail) localStorage.setItem(REMEMBERED_EMAIL_KEY, values.email);
      else localStorage.removeItem(REMEMBERED_EMAIL_KEY);

      await queryClient.invalidateQueries({ queryKey: qk.bootstrap });
      navigate(ROUTES.dashboard.index, { replace: true });
    },
    onError: (error: NormalizedError) => {
      // Galat validasi per-field ditampilkan di bawah fieldnya; sisanya sebagai toast.
      if (!applyServerErrors(error, form.setError as never)) {
        toast.error(error.message);
      }
    },
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-primary to-sidebar p-4">
      <Card className="w-full max-w-sm">
        <div className="border-b border-border px-6 py-4 text-center">
          <h1 className="text-lg font-semibold tracking-tight">Login ke RadGate</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Masukkan email dan password untuk melanjutkan
          </p>
        </div>

        <CardContent className="pt-4">
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit((values) => login.mutate(values))}
            noValidate
          >
            <div className="space-y-1.5">
              <Label htmlFor="email" required>
                Email
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="nama@example.com"
                aria-invalid={!!form.formState.errors.email}
                {...form.register('email')}
              />
              <FieldError message={form.formState.errors.email?.message} />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" required>
                  Password
                </Label>
                <Link
                  to={ROUTES.public.forgotPassword}
                  className="text-xs text-primary hover:underline"
                >
                  Lupa Password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="pr-9"
                  aria-invalid={!!form.formState.errors.password}
                  {...form.register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              <FieldError message={form.formState.errors.password?.message} />
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="size-4 rounded border-input accent-primary"
                {...form.register('rememberEmail')}
              />
              Ingat email saya
            </label>

            <Button type="submit" variant="dark" className="w-full" disabled={login.isPending}>
              <LogIn />
              {login.isPending ? 'Memproses...' : 'Login'}
            </Button>
          </form>

          <div className="mt-4 border-t border-border pt-4 text-center">
            <p className="mb-2 text-xs text-muted-foreground">Belum punya akun?</p>
            <Button variant="outline" className="w-full" asChild>
              <Link to={ROUTES.public.register}>Daftar Akun Baru</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
