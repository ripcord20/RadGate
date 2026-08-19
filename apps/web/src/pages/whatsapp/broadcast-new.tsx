import { ModuleScaffold } from '@/components/module-scaffold';

export default function WhatsappBroadcastNewPage() {
  return (
    <ModuleScaffold
      title="Broadcast Baru"
      stage="Tahap 7"
      actions={["Kirim","Jadwalkan"]}
      endpoints={["POST /whatsapp/broadcasts"]}
    />
  );
}
