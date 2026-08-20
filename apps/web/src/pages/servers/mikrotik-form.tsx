import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { Paginated } from '@radgate/shared';
import { ROUTES } from '@radgate/shared';
import { api } from '@/lib/api';
import { queryClient, qk } from '@/lib/query';
import { useActiveWilayah, useApp } from '@/providers/app-provider';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface MikrotikRow {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  status: string;
  version: string | null;
  lastSyncAt: string | null;
  wilayah: { name: string };
}

export default function MikrotikFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const wilayahId = useActiveWilayah();
  const { can, wilayahOptions } = useApp();
  const [name, setName] = useState('');
  const [host, setHost] = useState('');
  const [port, setPort] = useState(8728);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const existing = useQuery({
    queryKey: qk.mikrotik(wilayahId),
    queryFn: async () =>
      (await api.get<Paginated<MikrotikRow>>('/mikrotik', { params: { wilayahId, perPage: 100 } })).data,
    enabled: !!id,
  });
  const device = existing.data?.data.find((d) => d.id === id);

  const create = useMutation({
    mutationFn: () =>
      api.post('/mikrotik', {
        name,
        host,
        port,
        username,
        password,
        wilayahId: wilayahId ?? wilayahOptions[0]?.id,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['mikrotik'] });
      toast.success('Perangkat ditambahkan');
      navigate(ROUTES.servers.mikrotik);
    },
    onError: (e: { message?: string }) => toast.error(e.message ?? 'Gagal'),
  });

  if (id) {
    return (
      <div>
        <PageHeader
          title={device?.name ?? 'Perangkat Mikrotik'}
          description="Kredensial disimpan terenkripsi dan tidak pernah dikirim balik ke frontend."
        />
        <Card className="max-w-lg">
          <CardContent className="space-y-2 pt-4 text-sm">
            <p>
              {device?.host}:{device?.port}
            </p>
            <p>User: {device?.username}</p>
            <p>{device?.wilayah?.name}</p>
            <Badge variant={device?.status === 'online' ? 'success' : 'warning'}>{device?.status ?? '-'}</Badge>
            <p>{device?.version ?? 'Versi belum tersinkron'}</p>
            <p>Sinkron: {device?.lastSyncAt ? new Date(device.lastSyncAt).toLocaleString('id-ID') : '-'}</p>
            <Button variant="outline" asChild>
              <Link to={ROUTES.servers.mikrotik}>Kembali</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Tambah Mikrotik"
        quota="mikrotik"
        description="Password hanya dikirim saat simpan dan tidak pernah ditampilkan lagi."
      />
      <Card className="max-w-lg">
        <CardContent className="grid gap-3 pt-4">
          <div>
            <Label required>Nama</Label>
            <Input className="mt-1" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label required>Host</Label>
            <Input className="mt-1" value={host} onChange={(e) => setHost(e.target.value)} />
          </div>
          <div>
            <Label>Port</Label>
            <Input type="number" className="mt-1" value={port} onChange={(e) => setPort(Number(e.target.value))} />
          </div>
          <div>
            <Label required>Username</Label>
            <Input className="mt-1" value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
          <div>
            <Label required>Password</Label>
            <Input type="password" className="mt-1" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {can('servers', 'create') && (
            <Button
              disabled={!name || !host || !username || !password || create.isPending}
              onClick={() => create.mutate()}
            >
              Simpan
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
