import { ModuleScaffold } from '@/components/module-scaffold';

export default function BillingPage() {
  return (
    <ModuleScaffold
      title="Tagihan"
      stage="Tahap 3"
      columns={["ID Invoice","Pelanggan","Wilayah","Jumlah","Paket","Metode","Status","Jatuh Tempo","Aksi"]}
      actions={["Generate Tagihan","Bayar / Hutang","Reminder","Export"]}
      filters={["Semua Status","Semua Periode","Semua Tahun","Semua Wilayah","Semua Reseller"]}
      endpoints={["GET /invoices","GET /invoices/summary"]}
    />
  );
}
