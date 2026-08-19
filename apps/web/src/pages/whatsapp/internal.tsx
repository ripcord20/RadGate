import { ModuleScaffold } from '@/components/module-scaffold';

export default function WhatsappInternalPage() {
  return (
    <ModuleScaffold
      title="Perangkat WhatsApp"
      stage="Tahap 7"
      description="Dilayani service terpisah di subdomain whats. agar restart tidak menjatuhkan API."
      columns={["Nama","Nomor","Status","Terhubung Terakhir","Aksi"]}
      actions={["Tambah Perangkat","Reconnect"]}
      endpoints={["GET /whatsapp/devices"]}
    />
  );
}
