import { ModuleScaffold } from '@/components/module-scaffold';

export default function ResellerLogPage() {
  return (
    <ModuleScaffold
      title="Log Reseller"
      stage="Tahap 10"
      columns={["Waktu","Reseller","Jenis","Nominal","Saldo Setelah","Catatan"]}
      endpoints={["GET /resellers/transactions"]}
    />
  );
}
