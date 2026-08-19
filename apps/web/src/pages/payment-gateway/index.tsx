import { ModuleScaffold } from '@/components/module-scaffold';

export default function PaymentGatewayPage() {
  return (
    <ModuleScaffold
      title="Payment Gateway"
      stage="Tahap 8"
      description="Transaksi pembayaran online, status callback, dan penarikan dana."
      columns={["Referensi","Invoice","Metode","Jumlah","Fee","Bersih","Status","Tarik Dana","Waktu"]}
      actions={["Sejarah Penarikan","Export"]}
      filters={["Semua Tipe","All Methods","Semua Wilayah","Rentang Tanggal"]}
      endpoints={["GET /payments","GET /payments/summary"]}
    />
  );
}
