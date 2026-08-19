import { ModuleScaffold } from '@/components/module-scaffold';

export default function SubscriptionBillPage() {
  return (
    <ModuleScaffold
      title="Detail Tagihan Langganan"
      stage="Tahap 11"
      endpoints={["GET /subscription/invoices/:id"]}
    />
  );
}
