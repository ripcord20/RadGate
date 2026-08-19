import { ModuleScaffold } from '@/components/module-scaffold';

export default function ResellerPayPage() {
  return (
    <ModuleScaffold
      title="Pembayaran Reseller"
      stage="Tahap 10"
      endpoints={["POST /resellers/:id/payments"]}
    />
  );
}
