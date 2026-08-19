import { ModuleScaffold } from '@/components/module-scaffold';

export default function MappingPage() {
  return (
    <ModuleScaffold
      title="Pemetaan"
      stage="Tahap 6"
      description="Peta Leaflet dengan penanda pelanggan, ODP, dan jalur distribusi."
      actions={["Panel Jaringan","Kontrol Layer","Mode Peta","Statistik","Export"]}
      endpoints={["GET /mapping/customers","GET /mapping/odp"]}
    />
  );
}
