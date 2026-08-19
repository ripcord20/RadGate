import { ModuleScaffold } from '@/components/module-scaffold';

export default function HotspotRekapPage() {
  return (
    <ModuleScaffold
      title="Rekap Hotspot"
      stage="Tahap 9"
      description="Penjualan voucher dan pemakaian sesi per periode."
      endpoints={["GET /hotspot/rekap"]}
    />
  );
}
