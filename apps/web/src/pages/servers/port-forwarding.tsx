import { ModuleScaffold } from '@/components/module-scaffold';

export default function PortForwardingPage() {
  return (
    <ModuleScaffold
      title="Port Forwarding"
      stage="Tahap 5"
      columns={["Nama","Protokol","Port Eksternal","IP Internal","Port Internal","Status","Aksi"]}
      actions={["Tambah"]}
      endpoints={["GET /nas/port-forwarding"]}
    />
  );
}
