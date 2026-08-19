import { ModuleScaffold } from '@/components/module-scaffold';

export default function ResellerCustomersPage() {
  return (
    <ModuleScaffold
      title="Pelanggan Reseller"
      stage="Tahap 10"
      endpoints={["GET /resellers/:id/customers"]}
    />
  );
}
