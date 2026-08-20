import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ROUTES } from '@radgate/shared';
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
}

export default function SubscriptionPaymentPage() {
  const { id } = useParams<{ id: string }>();
  const { data } = useQuery({
    queryKey: [...qk.subscription, 'bill', id],
    queryFn: async () => (await api.get<Bill>(`/subscription/bills/${id}`)).data,
    enabled: !!id,
  });

  return (
    <div>
      <PageHeader title="Pembayaran Langganan" />
      <Card className="max-w-lg">
        <CardContent className="space-y-3 pt-4 text-sm">
          <p className="font-medium">{data?.invoiceNumber ?? '-'}</p>
          <Badge variant={data?.status === 'paid' ? 'success' : 'warning'}>{data?.status ?? '-'}</Badge>
          <p className="text-lg font-semibold">{formatRupiah(data?.amount)}</p>
          <p className="text-muted-foreground">
            Pembayaran langganan operator dicatat pada invoice ini. Transfer ke rekening resmi, lalu konfirmasi
            melalui halaman konfirmasi atau hubungi admin.
          </p>
          <div className="flex gap-2">
            <Button asChild>
              <Link to={ROUTES.subscription.confirm}>Konfirmasi</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to={ROUTES.subscription.billingHistory}>Riwayat</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
