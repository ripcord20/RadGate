import { ModuleScaffold } from '@/components/module-scaffold';

export default function SpeedOnDemandPage() {
  return (
    <ModuleScaffold
      title="Speed on Demand"
      stage="Tahap 10"
      description="Peningkatan kecepatan sementara berbayar."
      columns={["Pelanggan","Kecepatan","Harga","Mulai","Berakhir","Status","Aksi"]}
      endpoints={["GET /speed-on-demand"]}
    />
  );
}
