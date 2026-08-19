import { ModuleScaffold } from '@/components/module-scaffold';

export default function CustomerDevicesPage() {
  return (
    <ModuleScaffold
      title="Devices"
      stage="Setelah tahap inti"
      description="Telemetri ONT lewat TR-069/ACS."
      columns={["Username","Info Perangkat","IP & Status","Layanan","Uptime","Pon Mode","RX Power","Suhu","Informasi Terakhir","Aksi"]}
      filters={["RX Power","Mode PON","Merek","Semua Wilayah"]}
      endpoints={["GET /customers/devices","GET /customers/devices/summary"]}
    />
  );
}
