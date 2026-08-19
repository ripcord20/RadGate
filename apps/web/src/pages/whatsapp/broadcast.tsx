import { ModuleScaffold } from '@/components/module-scaffold';

export default function WhatsappBroadcastPage() {
  return (
    <ModuleScaffold
      title="Broadcast WhatsApp"
      quota="whatsapp_messages"
      stage="Tahap 7"
      description="Berjalan sebagai job dengan pembatasan laju agar nomor tidak diblokir."
      columns={["Nama","Template","Perangkat","Target","Terkirim","Gagal","Status","Jadwal"]}
      actions={["Broadcast Baru"]}
      endpoints={["GET /whatsapp/broadcasts"]}
    />
  );
}
