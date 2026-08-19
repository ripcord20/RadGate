import { ModuleScaffold } from '@/components/module-scaffold';

export default function SubscriptionPlansPage() {
  return (
    <ModuleScaffold
      title="Paket Langganan"
      stage="Tahap 11"
      endpoints={["GET /subscription/plans"]}
    />
  );
}
