import { ModuleScaffold } from '@/components/module-scaffold';

export default function HotspotVouchersPage() {
  return (
    <ModuleScaffold
      title="Voucher Hotspot"
      quota="hotspot_vouchers"
      stage="Tahap 9"
      columns={["Kode","Profil","Harga","Status","Dipakai","Kedaluwarsa","Reseller","Aksi"]}
      actions={["Single","Generate","Import","Domain Hotspot"]}
      filters={["Semua Status","Semua Paket","Semua Reseller","Semua Wilayah"]}
      endpoints={["GET /hotspot/vouchers","POST /hotspot/vouchers/generate"]}
    />
  );
}
