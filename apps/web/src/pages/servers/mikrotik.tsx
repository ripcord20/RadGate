import { Link } from 'react-router-dom';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MikrotikRow {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  status: string;
  version: string | null;
  lastSyncAt: string | null;
  syncError: string | null;
  wilayah: { name: string };
}

export default function MikrotikPage() {
  const wilayahId = useActiveWilayah();
  const { can } = useApp();
  const { data } = useQuery({
    queryKey: qk.mikrotik(wilayahId),
    queryFn: async () =>
      (await api.get<Paginated<MikrotikRow>>('/mikrotik', { params: { wilayahId, perPage: 100 } })).data,
  });

  const syncOne = useMutation({
    mutationFn: (id: string) => api.post(`/mikrotik/${id}/sync`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['mikrotik'] });
      toast.success('Sinkronisasi dimulai');
    },
    onError: (e: { message?: string }) => toast.error(e.message ?? 'Gagal'),
  });

  const syncAll = useMutation({
    mutationFn: () => api.post('/mikrotik/sync-all'),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['mikrotik'] });
      toast.success('Sinkronisasi semua perangkat dimulai');
    },
    onError: (e: { message?: string }) => toast.error(e.message ?? 'Gagal'),
  });

  return (
    <div>
      <PageHeader
        title="Perangkat Mikrotik"
        quota="mikrotik"
        actions={
          <div className="flex gap-2">
            {can('servers', 'update') && (
              <Button variant="outline" disabled={syncAll.isPending} onClick={() => syncAll.mutate()}>
                Sync Semua
              </Button>
            )}
            {can('servers', 'create') && (
              <Button asChild>
                <Link to={ROUTES.servers.mikrotikAdd}>Tambah</Link>
              </Button>
            )}
          </div>
        }
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data?.data.map((n) => (
          <Card key={n.id}>
            <CardHeader>
              <CardTitle>{n.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm text-muted-foreground">
              <p>
                {n.host}:{n.port}
              </p>
              <p>User: {n.username}</p>
              <p>{n.wilayah?.name}</p>
              <p>{n.version ?? 'Versi belum tersinkron'}</p>
              <Badge variant={n.status === 'online' ? 'success' : 'warning'}>{n.status}</Badge>
              <p>Sinkron: {n.lastSyncAt ? new Date(n.lastSyncAt).toLocaleString('id-ID') : '-'}</p>
              {n.syncError && <p className="text-destructive">{n.syncError}</p>}
              <div className="flex gap-2 pt-2">
                {can('servers', 'update') && (
                  <Button size="sm" variant="outline" onClick={() => syncOne.mutate(n.id)}>
                    Sync
                  </Button>
                )}
                <Button size="sm" variant="ghost" asChild>
                  <Link to={`/mikrotik/edit/${n.id}`}>Detail</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
