import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { Paginated } from '@radgate/shared';
import { api } from '@/lib/api';
import { queryClient, qk } from '@/lib/query';
import { useActiveWilayah, useApp } from '@/providers/app-provider';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface NasRow {
  id: string;
  name: string;
  ipAddress: string;
  status: string;
  wilayah: { name: string };
}

export default function NasPage() {
  const wilayahId = useActiveWilayah();
  const { can, wilayahOptions } = useApp();
  const { data } = useQuery({
    queryKey: qk.nas(wilayahId),
    queryFn: async () =>
      (await api.get<Paginated<NasRow>>('/nas', { params: { wilayahId, perPage: 100 } })).data,
  });

  const [name, setName] = useState('');
  const [ipAddress, setIpAddress] = useState('');
  const [secret, setSecret] = useState('');

  const create = useMutation({
    mutationFn: () =>
      api.post('/nas', {
        name,
        ipAddress,
        secret,
        wilayahId: wilayahId ?? wilayahOptions[0]?.id,
        type: 'mikrotik',
        isDefault: false,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['nas'] });
      setName('');
      setIpAddress('');
      setSecret('');
      toast.success('NAS ditambahkan');
    },
    onError: (e: { message?: string }) => toast.error(e.message ?? 'Gagal'),
  });

  return (
    <div>
      <PageHeader title="Network Access Server" quota="nas" />
      {can('servers', 'create') && (
        <div className="mb-4 flex flex-wrap gap-2">
          <Input placeholder="Nama" value={name} onChange={(e) => setName(e.target.value)} className="max-w-40" />
          <Input placeholder="IP" value={ipAddress} onChange={(e) => setIpAddress(e.target.value)} className="max-w-40" />
          <Input placeholder="RADIUS secret" value={secret} onChange={(e) => setSecret(e.target.value)} className="max-w-40" />
          <Button disabled={!name || !ipAddress || secret.length < 6 || create.isPending} onClick={() => create.mutate()}>
            Tambah
          </Button>
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data?.data.map((n) => (
          <Card key={n.id}>
            <CardHeader>
              <CardTitle>{n.name}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>{n.ipAddress}</p>
              <p>{n.wilayah?.name}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
