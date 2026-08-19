import { ModuleScaffold } from '@/components/module-scaffold';

export default function TicketCreatePage() {
  return (
    <ModuleScaffold
      title="Buat Tiket"
      stage="Tahap 6"
      actions={["Simpan"]}
      endpoints={["POST /tickets"]}
    />
  );
}
