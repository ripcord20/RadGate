import { ModuleScaffold } from '@/components/module-scaffold';

export default function SubscriptionHistoryPage() {
  return (
    <ModuleScaffold
      title="Riwayat Tagihan"
      stage="Tahap 11"
      columns={["No Invoice","Periode","Jumlah","Status","Jatuh Tempo","Dibayar","Aksi"]}
      endpoints={["GET /subscription/invoices"]}
    />
  );
}
