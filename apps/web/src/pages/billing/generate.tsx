import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ROUTES } from '@radgate/shared';
import { api } from '@/lib/api';
import { queryClient } from '@/lib/query';
import { useActiveWilayah, useApp } from '@/providers/app-provider';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

const MONTHS = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

export default function BillingGeneratePage() {
  const navigate = useNavigate();
  const wilayahId = useActiveWilayah();
  const { can } = useApp();
  const now = new Date();
  const [periodMonth, setPeriodMonth] = useState(now.getMonth() + 1);
  const [periodYear, setPeriodYear] = useState(now.getFullYear());
  const [includeTax, setIncludeTax] = useState(true);

  const generate = useMutation({
    mutationFn: () =>
      api.post('/billing/generate', {
        periodMonth,
        periodYear,
        wilayahId,
        customerIds: [],
        includeTax,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Generate tagihan dimulai');
      navigate(ROUTES.billing.index);
    },
    onError: (e: { message?: string }) => toast.error(e.message ?? 'Gagal generate'),
  });

  return (
    <div>
      <PageHeader
        title="Generate Tagihan"
        description="Menjalankan job latar belakang. Tagihan yang sama untuk pelanggan dan periode tidak dibuat ulang."
      />
      <Card className="max-w-lg">
        <CardContent className="grid gap-3 pt-4">
          <div>
            <Label>Bulan</Label>
            <select
              className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
              value={periodMonth}
              onChange={(e) => setPeriodMonth(Number(e.target.value))}
            >
              {MONTHS.map((name, i) => (
                <option key={name} value={i + 1}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Tahun</Label>
            <select
              className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
              value={periodYear}
              onChange={(e) => setPeriodYear(Number(e.target.value))}
            >
              {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="size-4 rounded border-input accent-primary"
              checked={includeTax}
              onChange={(e) => setIncludeTax(e.target.checked)}
            />
            Sertakan pajak
          </label>
          {can('billing', 'create') && (
            <Button disabled={generate.isPending} onClick={() => generate.mutate()}>
              {generate.isPending ? 'Memproses...' : 'Jalankan Generate'}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
