import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { queryClient, qk } from '@/lib/query';
import { formatRupiah, formatSpeed } from '@/lib/utils';
import { useApp } from '@/providers/app-provider';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Profile {
  id: string;
  name: string;
  mikrotikProfile: string | null;
  speedUp: number;
  speedDown: number;
  durationMinutes: number;
  dataQuotaMb: number | null;
  price: number;
}

export default function HotspotProfilePage() {
  const { can } = useApp();
  const { data } = useQuery({
    queryKey: [...qk.hotspot(null), 'profiles'],
    queryFn: async () => (await api.get<Profile[]>('/hotspot/profiles')).data,
  });

  const [name, setName] = useState('');
  const [speedDown, setSpeedDown] = useState(10);
  const [speedUp, setSpeedUp] = useState(10);
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [price, setPrice] = useState(10000);

  const create = useMutation({
    mutationFn: () =>
      api.post('/hotspot/profiles', { name, speedUp, speedDown, durationMinutes, price }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['hotspot'] });
      setName('');
      toast.success('Profil ditambahkan');
    },
    onError: (e: { message?: string }) => toast.error(e.message ?? 'Gagal'),
  });

  return (
    <div className="space-y-4">
      <PageHeader title="Profil Hotspot" />
      {can('hotspot', 'create') && (
        <Card>
          <CardHeader>
            <CardTitle>Tambah profil</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-6">
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
              <Label>Durasi (menit)</Label>
              <Input
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
              />
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
        {data?.map((p) => (
          <Card key={p.id}>
            <CardHeader>
              <CardTitle>{p.name}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>
                {formatSpeed(p.speedDown)} / {formatSpeed(p.speedUp)}
              </p>
              <p>{p.durationMinutes} menit</p>
              <p>{p.dataQuotaMb ? `${p.dataQuotaMb} MB` : 'Tanpa kuota data'}</p>
              <p className="font-medium text-foreground">{formatRupiah(p.price)}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
