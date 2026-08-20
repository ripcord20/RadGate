import { useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { InvoiceStatus } from '@radgate/shared';
import { api } from '@/lib/api';
import { queryClient, qk } from '@/lib/query';
import { formatRupiah } from '@/lib/utils';
import { PageHeader } from '@/components/page-header';
import { Badge, INVOICE_STATUS_LABEL, INVOICE_STATUS_VARIANT } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useApp } from '@/providers/app-provider';

export default function BillingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { can } = useApp();
  const { data, isLoading } = useQuery({
    queryKey: qk.invoice(id ?? ''),
    queryFn: async () => (await api.get(`/billing/${id}`)).data,
    enabled: !!id,
  });

  const pay = useMutation({
    mutationFn: () => api.post(`/billing/${id}/pay`, { amount: data.total, method: 'cash' }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: qk.invoice(id ?? '') });
      await queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Pembayaran dicatat');
    },
    onError: (e: { message?: string }) => toast.error(e.message ?? 'Gagal'),
  });

  if (isLoading || !data) return <Skeleton className="h-64" />;

  return (
    <div className="space-y-4">
      <PageHeader
        title={data.invoiceNumber}
        description={data.customer?.name}
        actions={
          can('billing', 'update') && data.status !== 'paid' ? (
            <Button onClick={() => pay.mutate()} disabled={pay.isPending}>
              Catat Lunas (Tunai)
            </Button>
          ) : null
        }
      />
      <Card>
        <CardContent className="space-y-2 pt-4 text-sm">
          <p>
            Status{' '}
            <Badge variant={INVOICE_STATUS_VARIANT[data.status as InvoiceStatus]}>
              {INVOICE_STATUS_LABEL[data.status as InvoiceStatus]}
            </Badge>
          </p>
          <p>Paket {data.package?.name}</p>
          <p>Jumlah {formatRupiah(data.amount)}</p>
          <p>Diskon {formatRupiah(data.discount)}</p>
          <p>Pajak {formatRupiah(data.tax)}</p>
          <p className="font-semibold">Total {formatRupiah(data.total)}</p>
        </CardContent>
      </Card>
    </div>
  );
}
