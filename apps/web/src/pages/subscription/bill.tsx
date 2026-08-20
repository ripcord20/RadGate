import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { qk } from '@/lib/query';
import { formatRupiah } from '@/lib/utils';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface Bill {
  id: string;
  invoiceNumber: string;
  amount: number;
  status: string;
  dueDate: string;
  paidAt: string | null;
  paymentReference: string | null;
}

export default function SubscriptionBillPage() {
  const { id } = useParams<{ id: string }>();
  const { data } = useQuery({
    queryKey: [...qk.subscription, 'bill', id],
    queryFn: async () => (await api.get<Bill>(`/subscription/bills/${id}`)).data,
    enabled: !!id,
  });

  return (
    <div>
      <PageHeader
        title={data?.invoiceNumber ?? 'Detail Tagihan Langganan'}
        actions={
          id ? (
            <Button asChild variant="outline">
              <Link to={`/subscription/payment/${id}`}>Bayar</Link>
            </Button>
          ) : null
        }
      />
      <Card className="max-w-lg">
        <CardContent className="space-y-2 pt-4 text-sm">
          <Badge variant={data?.status === 'paid' ? 'success' : 'warning'}>{data?.status ?? '-'}</Badge>
          <p>Jumlah: {formatRupiah(data?.amount)}</p>
          <p>Jatuh tempo: {data?.dueDate ? new Date(data.dueDate).toLocaleDateString('id-ID') : '-'}</p>
          <p>Dibayar: {data?.paidAt ? new Date(data.paidAt).toLocaleDateString('id-ID') : '-'}</p>
          {data?.paymentReference && <p>Referensi: {data.paymentReference}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
