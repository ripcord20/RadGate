import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { Paginated } from '@radgate/shared';
import { api } from '@/lib/api';
import { queryClient, qk } from '@/lib/query';
import { formatRupiah, formatSpeed } from '@/lib/utils';
import { useActiveWilayah, useApp } from '@/providers/app-provider';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableEmpty, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface CustomerOption {
  id: string;
  name: string;
}

interface SpeedRow {
  id: string;
  speedUp: number;
  speedDown: number;
  price: number;
  startsAt: string;
  endsAt: string;
  status: string;
  customer: { id: string; name: string; customerCode: string };
}

function toLocalInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function SpeedOnDemandPage() {
  const wilayahId = useActiveWilayah();
  const { can } = useApp();
  const now = new Date();
  const later = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const [customerId, setCustomerId] = useState('');
  const [speedDown, setSpeedDown] = useState(100);
  const [speedUp, setSpeedUp] = useState(100);
  const [price, setPrice] = useState(25000);
  const [startsAt, setStartsAt] = useState(toLocalInput(now));
  const [endsAt, setEndsAt] = useState(toLocalInput(later));

  const customers = useQuery({
    queryKey: qk.customers(wilayahId),
    queryFn: async () =>
      (await api.get<Paginated<CustomerOption>>('/customers', { params: { wilayahId, perPage: 100 } })).data,
  });

  const { data } = useQuery({
    queryKey: ['speed-on-demand', wilayahId],
    queryFn: async () => (await api.get<SpeedRow[]>('/speed-on-demand', { params: { wilayahId } })).data,
  });

  const create = useMutation({
    mutationFn: () =>
      api.post('/speed-on-demand', {
        customerId,
        speedUp,
        speedDown,
        price,
        startsAt: new Date(startsAt).toISOString(),
        endsAt: new Date(endsAt).toISOString(),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['speed-on-demand'] });
      toast.success('Speed on demand dibuat');
    },
    onError: (e: { message?: string }) => toast.error(e.message ?? 'Gagal'),
  });

  return (
    <div>
      <PageHeader title="Speed on Demand" description="Peningkatan kecepatan sementara berbayar." />
      {can('customers', 'create') && (
        <div className="mb-4 flex flex-wrap gap-2">
          <select
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
          >
            <option value="">Pelanggan</option>
            {customers.data?.data.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <Input type="number" className="max-w-24" value={speedDown} onChange={(e) => setSpeedDown(Number(e.target.value))} />
          <Input type="number" className="max-w-24" value={speedUp} onChange={(e) => setSpeedUp(Number(e.target.value))} />
          <Input type="number" className="max-w-28" value={price} onChange={(e) => setPrice(Number(e.target.value))} />
          <Input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
          <Input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
          <Button disabled={!customerId || create.isPending} onClick={() => create.mutate()}>
            Tambah
          </Button>
        </div>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Pelanggan</TableHead>
            <TableHead>Kecepatan</TableHead>
            <TableHead>Harga</TableHead>
            <TableHead>Mulai</TableHead>
            <TableHead>Berakhir</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(data?.length ?? 0) === 0 && <TableEmpty colSpan={6} />}
          {data?.map((row) => (
            <TableRow key={row.id}>
              <TableCell>
                <div className="font-medium">{row.customer.name}</div>
                <div className="text-xs text-muted-foreground">{row.customer.customerCode}</div>
              </TableCell>
              <TableCell>
                {formatSpeed(row.speedDown)} / {formatSpeed(row.speedUp)}
              </TableCell>
              <TableCell>{formatRupiah(row.price)}</TableCell>
              <TableCell>{new Date(row.startsAt).toLocaleString('id-ID')}</TableCell>
              <TableCell>{new Date(row.endsAt).toLocaleString('id-ID')}</TableCell>
              <TableCell>
                <Badge variant={row.status === 'aktif' ? 'success' : 'neutral'}>{row.status}</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
