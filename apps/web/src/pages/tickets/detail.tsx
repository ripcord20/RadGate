import { ModuleScaffold } from '@/components/module-scaffold';

export default function TicketDetailPage() {
  return (
    <ModuleScaffold
      title="Detail Tiket"
      stage="Tahap 6"
      description="Riwayat komentar, lampiran, penugasan teknisi, dan perubahan status."
      endpoints={["GET /tickets/:id","POST /tickets/:id/comments"]}
    />
  );
}
