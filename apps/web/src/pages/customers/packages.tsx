import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { Paginated } from '@radgate/shared';
import { api } from '@/lib/api';
import { queryClient, qk } from '@/lib/query';
import { formatRupiah, formatSpeed } from '@/lib/utils';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApp } from '@/providers/app-provider';

interface PackageRow {
  id: string;
  name: string;
  speedUp: number;
  speedDown: number;
  price: number;
  isActive: boolean;
  customerCount: number;
}

export default function PackagesPage() {
  const { can } = useApp();
  const { data } = useQuery({
    queryKey: qk.packages(null),
    queryFn: async () => (await api.get<Paginated<PackageRow>>('/internet-packages', { params: { perPage: 100 } })).data,
  });

  const [name, setName] = useState('');
  const [speedDown, setSpeedDown] = useState(50);
  const [speedUp, setSpeedUp] = useState(50);
  const [price, setPrice] = useState(100000);

  const create = useMutation({
    mutationFn: () =>
      api.post('/internet-packages', { name, speedUp, speedDown, price, isActive: true }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: qk.packages(null) });
      setName('');
      toast.success('Paket ditambahkan');
    },
    onError: (e: { message?: string }) => toast.error(e.message ?? 'Gagal'),
  });

  return (
    <div className="space-y-4">
      <PageHeader title="Paket Internet" />
      {can('customers', 'create') && (
        <Card>
          <CardHeader>
            <CardTitle>Tambah paket</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-5">
            <div>
              <Label>Nama</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label>Download (Mbps)</Label>
              <Input type="number" value={speedDown} onChange={(e) => setSpeedDown(Number(e.target.value))} />
            </div>
            <div>
              <Label>Upload (Mbps)</Label>
              <Input type="number" value={speedUp} onChange={(e) => setSpeedUp(Number(e.target.value))} />
            </div>
            <div>
              <Label>Harga</Label>
              <Input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} />
            </div>
            <div className="flex items-end">
              <Button disabled={!name || create.isPending} onClick={() => create.mutate()}>
                Simpan
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data?.data.map((p) => (
          <Card key={p.id}>
            <CardHeader>
              <CardTitle>{p.name}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>
                {formatSpeed(p.speedDown)} / {formatSpeed(p.speedUp)}
              </p>
              <p className="text-foreground font-medium">{formatRupiah(p.price)}</p>
              <p>{p.customerCount} pelanggan</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
