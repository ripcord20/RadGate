import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { QuotaMetric } from '@radgate/shared';
import { ROUTES } from '@radgate/shared';
import { api } from '@/lib/api';
import { qk } from '@/lib/query';
import { formatRupiah } from '@/lib/utils';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Plan {
  name: string;
  priceMonthly: number;
  priceYearly: number;
}

interface Subscription {
  status: string;
  expiresAt: string;
  billingCycle: string;
  plan: Plan;
}

interface Usage {
  metric: QuotaMetric;
  used: number;
  limit: number;
}

interface Overview {
  subscription: Subscription | null;
  usage: Usage[];
}

const METRIC_LABELS: Record<QuotaMetric, string> = {
  customers: 'Pelanggan',
  nas: 'NAS',
  mikrotik: 'Mikrotik',
  hotspot_vouchers: 'Voucher',
  whatsapp_messages: 'Pesan WA',
};

export default function SubscriptionPage() {
  const { data } = useQuery({
    queryKey: qk.subscription,
    queryFn: async () => (await api.get<Overview>('/subscription')).data,
  });
  const sub = data?.subscription;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Langganan Saya"
        description="Billing untuk operator itu sendiri, bukan untuk pelanggan internet."
        actions={
          <Button asChild variant="outline">
            <Link to={ROUTES.subscription.plans}>Lihat paket</Link>
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>{sub?.plan.name ?? 'Belum berlangganan'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {sub ? (
            <>
              <Badge variant={sub.status === 'aktif' ? 'success' : 'warning'}>{sub.status}</Badge>
              <p>Siklus: {sub.billingCycle === 'yearly' ? 'Tahunan' : 'Bulanan'}</p>
              <p>Berakhir: {new Date(sub.expiresAt).toLocaleDateString('id-ID')}</p>
              <p>
                Harga: {formatRupiah(sub.plan.priceMonthly)} / bulan · {formatRupiah(sub.plan.priceYearly)} / tahun
              </p>
            </>
          ) : (
            <p className="text-muted-foreground">Pilih paket untuk mengaktifkan langganan.</p>
          )}
        </CardContent>
      </Card>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data?.usage.map((u) => (
          <Card key={u.metric}>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">{METRIC_LABELS[u.metric]}</p>
              <p className="font-semibold">
                {u.used} / {u.limit}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
