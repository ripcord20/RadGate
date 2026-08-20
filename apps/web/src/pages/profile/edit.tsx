import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { AuthUser } from '@radgate/shared';
import { ROUTES } from '@radgate/shared';
import { api } from '@/lib/api';
import { queryClient, qk } from '@/lib/query';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function ProfileEditForm({ user }: { user: AuthUser }) {
  const navigate = useNavigate();
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone ?? '');
  const [password, setPassword] = useState('');

  const save = useMutation({
    mutationFn: () =>
      api.patch('/profile', {
        name,
        phone: phone || undefined,
        password: password || undefined,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
      await queryClient.invalidateQueries({ queryKey: qk.bootstrap });
      toast.success('Profil disimpan');
      navigate(ROUTES.profile.detail);
    },
    onError: (e: { message?: string }) => toast.error(e.message ?? 'Gagal'),
  });

  return (
    <Card className="max-w-lg">
      <CardContent className="grid gap-3 pt-4">
        <div>
          <Label>Nama</Label>
          <Input className="mt-1" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <Label>Telepon</Label>
          <Input className="mt-1" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="62812..." />
        </div>
        <div>
          <Label>Password baru</Label>
          <Input
            type="password"
            className="mt-1"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Kosongkan jika tidak diubah"
          />
        </div>
        <Button disabled={!name || save.isPending} onClick={() => save.mutate()}>
          Simpan
        </Button>
      </CardContent>
    </Card>
  );
}

export default function ProfileEditPage() {
  const { data } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => (await api.get<AuthUser>('/profile')).data,
  });

  return (
    <div>
      <PageHeader title="Ubah Profil" />
      {data ? <ProfileEditForm user={data} /> : null}
    </div>
  );
}
