import { useQuery } from '@tanstack/react-query';
import type { QuotaMetric } from '@radgate/shared';
import { api } from '@/lib/api';
import { qk } from '@/lib/query';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface Status {
  status: string;
  expiresAt: string;
  planName: string;
  billingCycle: string;
}

interface Limit {
  metric: QuotaMetric;
  used: number;
  limit: number;
}

const METRIC_LABELS: Record<QuotaMetric, string> = {
  customers: 'Pelanggan',
  nas: 'NAS',
  mikrotik: 'Mikrotik',
  hotspot_vouchers: 'Voucher',
  whatsapp_messages: 'Pesan WA',
};

export default function SubscriptionStatusPage() {
  const status = useQuery({
    queryKey: [...qk.subscription, 'status'],
    queryFn: async () => (await api.get<Status>('/subscription/status')).data,
  });
  const limits = useQuery({
    queryKey: [...qk.subscription, 'limits'],
    queryFn: async () => (await api.get<Limit[]>('/subscription/limits')).data,
  });

  return (
    <div className="space-y-4">
      <PageHeader title="Status Langganan" description="Pemakaian terhadap kuota paket yang sedang aktif." />
      <Card>
        <CardContent className="space-y-2 pt-4 text-sm">
          <p className="font-medium">{status.data?.planName ?? '-'}</p>
          <Badge variant={status.data?.status === 'aktif' ? 'success' : 'warning'}>{status.data?.status ?? '-'}</Badge>
          <p>Siklus: {status.data?.billingCycle === 'yearly' ? 'Tahunan' : 'Bulanan'}</p>
          <p>
            Berakhir:{' '}
            {status.data?.expiresAt ? new Date(status.data.expiresAt).toLocaleDateString('id-ID') : '-'}
          </p>
        </CardContent>
      </Card>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {limits.data?.map((u) => (
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
