import { ModuleScaffold } from '@/components/module-scaffold';

export default function InvoiceDetailPage() {
  return (
    <ModuleScaffold
      title="Detail Invoice"
      stage="Tahap 3"
      description="Rincian tagihan, riwayat pembayaran bertahap, dan unduh PDF."
      actions={["Catat Pembayaran","Unduh PDF","Kirim Reminder"]}
      endpoints={["GET /invoices/:id","POST /invoices/:id/payments"]}
    />
  );
}
