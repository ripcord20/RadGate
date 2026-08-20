import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { Paginated } from '@radgate/shared';
import { api } from '@/lib/api';
import { queryClient, qk } from '@/lib/query';
import { formatRupiah } from '@/lib/utils';
import { useActiveWilayah, useApp } from '@/providers/app-provider';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ResellerRow {
  id: string;
  name: string;
  balance: number;
}

export default function ResellerPayPage() {
  const wilayahId = useActiveWilayah();
  const { can } = useApp();
  const [params, setParams] = useSearchParams();
  const id = params.get('id') ?? '';
  const [amount, setAmount] = useState(0);
  const [notes, setNotes] = useState('');

  const resellers = useQuery({
    queryKey: qk.resellers(wilayahId),
    queryFn: async () =>
      (await api.get<Paginated<ResellerRow>>('/resellers', { params: { wilayahId, perPage: 100 } })).data,
  });

  const detail = useQuery({
    queryKey: [...qk.resellers(wilayahId), id],
    queryFn: async () => (await api.get<ResellerRow>(`/resellers/${id}`)).data,
    enabled: !!id,
  });

  const pay = useMutation({
    mutationFn: () => api.post(`/resellers/${id}/pay`, { amount, notes: notes || undefined }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['resellers'] });
      setAmount(0);
      setNotes('');
      toast.success('Pembayaran komisi dicatat');
    },
    onError: (e: { message?: string }) => toast.error(e.message ?? 'Gagal'),
  });

  const selected = detail.data ?? resellers.data?.data.find((r) => r.id === id);

  return (
    <div>
      <PageHeader title="Pembayaran Reseller" />
      <Card className="max-w-lg">
        <CardContent className="grid gap-3 pt-4">
          <div>
            <Label>Reseller</Label>
            <select
              className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
              value={id}
              onChange={(e) => setParams(e.target.value ? { id: e.target.value } : {})}
            >
              <option value="">Pilih reseller</option>
              {resellers.data?.data.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
          {selected && (
            <p className="text-sm text-muted-foreground">Saldo komisi: {formatRupiah(selected.balance)}</p>
          )}
          <div>
            <Label>Nominal</Label>
            <Input type="number" className="mt-1" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
          </div>
          <div>
            <Label>Catatan</Label>
            <Input className="mt-1" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          {can('resellers', 'update') && (
            <Button disabled={!id || amount < 1 || pay.isPending} onClick={() => pay.mutate()}>
              Bayar
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
