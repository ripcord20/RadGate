import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { queryClient, qk } from '@/lib/query';
import { formatRupiah } from '@/lib/utils';
import { useApp } from '@/providers/app-provider';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface Plan {
  id: string;
  name: string;
  priceMonthly: number;
  priceYearly: number;
}

interface SubscribeResult {
  invoice: { id: string };
}

export default function SubscriptionConfirmPage() {
  const navigate = useNavigate();
  const { can } = useApp();
  const [params] = useSearchParams();
  const planId = params.get('planId') ?? '';
  const billingCycle = params.get('billingCycle') === 'yearly' ? 'yearly' : 'monthly';

  const plans = useQuery({
    queryKey: [...qk.subscription, 'plans'],
    queryFn: async () => (await api.get<Plan[]>('/subscription/plans')).data,
  });
  const plan = plans.data?.find((p) => p.id === planId);
  const amount = plan ? (billingCycle === 'yearly' ? plan.priceYearly : plan.priceMonthly) : 0;

  const subscribe = useMutation({
    mutationFn: async () =>
      (await api.post<SubscribeResult>('/subscription/subscribe', { planId, billingCycle })).data,
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: qk.subscription });
      toast.success('Langganan diaktifkan');
      navigate(`/subscription/payment/${data.invoice.id}`);
    },
    onError: (e: { message?: string }) => toast.error(e.message ?? 'Gagal'),
  });

  return (
    <div>
      <PageHeader title="Konfirmasi Langganan" />
      <Card className="max-w-lg">
        <CardContent className="space-y-3 pt-4 text-sm">
          {plan ? (
            <>
              <p className="font-medium">{plan.name}</p>
              <p>Siklus: {billingCycle === 'yearly' ? 'Tahunan' : 'Bulanan'}</p>
              <p className="text-lg font-semibold">{formatRupiah(amount)}</p>
              {can('subscription', 'update') && (
                <Button disabled={!planId || subscribe.isPending} onClick={() => subscribe.mutate()}>
                  Konfirmasi
                </Button>
              )}
            </>
          ) : (
            <p className="text-muted-foreground">Pilih paket dari halaman paket langganan terlebih dahulu.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
