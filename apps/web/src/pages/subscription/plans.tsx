import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ROUTES } from '@radgate/shared';
import { api } from '@/lib/api';
import { qk } from '@/lib/query';
import { formatRupiah } from '@/lib/utils';
import { useApp } from '@/providers/app-provider';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Plan {
  id: string;
  name: string;
  priceMonthly: number;
  priceYearly: number;
}

export default function SubscriptionPlansPage() {
  const { can } = useApp();
  const { data } = useQuery({
    queryKey: [...qk.subscription, 'plans'],
    queryFn: async () => (await api.get<Plan[]>('/subscription/plans')).data,
  });

  return (
    <div className="space-y-4">
      <PageHeader title="Paket Langganan" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data?.map((p) => (
          <Card key={p.id}>
            <CardHeader>
              <CardTitle>{p.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>{formatRupiah(p.priceMonthly)} / bulan</p>
              <p>{formatRupiah(p.priceYearly)} / tahun</p>
              {can('subscription', 'update') && (
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button size="sm" asChild>
                    <Link to={`${ROUTES.subscription.confirm}?planId=${p.id}&billingCycle=monthly`}>Bulanan</Link>
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <Link to={`${ROUTES.subscription.confirm}?planId=${p.id}&billingCycle=yearly`}>Tahunan</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
