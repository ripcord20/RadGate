import { ModuleScaffold } from '@/components/module-scaffold';

export default function SubscriptionPage() {
  return (
    <ModuleScaffold
      title="Langganan Saya"
      stage="Tahap 11"
      description="Billing untuk operator itu sendiri, bukan untuk pelanggan internet."
      endpoints={["GET /subscription"]}
    />
  );
}
