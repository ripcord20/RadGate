import { ModuleScaffold } from '@/components/module-scaffold';

export default function SubscriptionPaymentPage() {
  return (
    <ModuleScaffold
      title="Pembayaran Langganan"
      stage="Tahap 11"
      endpoints={["POST /subscription/payments"]}
    />
  );
}
