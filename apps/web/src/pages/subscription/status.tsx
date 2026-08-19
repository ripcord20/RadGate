import { ModuleScaffold } from '@/components/module-scaffold';

export default function SubscriptionStatusPage() {
  return (
    <ModuleScaffold
      title="Status Langganan"
      stage="Tahap 11"
      description="Pemakaian terhadap kuota paket yang sedang aktif."
      endpoints={["GET /subscription/status","GET /subscription/limits"]}
    />
  );
}
