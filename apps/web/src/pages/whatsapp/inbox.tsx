import { ModuleScaffold } from '@/components/module-scaffold';

export default function WhatsappInboxPage() {
  return (
    <ModuleScaffold
      title="Inbox WhatsApp"
      stage="Tahap 7"
      description="Percakapan dua arah dengan pelanggan."
      endpoints={["GET /whatsapp/messages"]}
    />
  );
}
