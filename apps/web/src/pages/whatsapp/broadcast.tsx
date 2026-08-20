import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ROUTES } from '@radgate/shared';
import { api } from '@/lib/api';
import { qk } from '@/lib/query';
import { useApp } from '@/providers/app-provider';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableEmpty, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Broadcast {
  id: string;
  status: string;
  totalTargets: number;
  sentCount: number;
  failedCount: number;
  scheduledAt: string | null;
  createdAt: string;
  template: { name: string };
  device: { name: string; phoneNumber: string };
}

export default function WhatsappBroadcastPage() {
  const { can } = useApp();
  const { data } = useQuery({
    queryKey: qk.whatsapp('broadcasts'),
    queryFn: async () => (await api.get<Broadcast[]>('/whatsapp/broadcasts')).data,
  });

  return (
    <div>
      <PageHeader
        title="Broadcast WhatsApp"
        quota="whatsapp_messages"
        description="Berjalan sebagai job dengan pembatasan laju agar nomor tidak diblokir."
        actions={
          can('whatsapp', 'create') ? (
            <Button asChild>
              <Link to={ROUTES.whatsapp.broadcastNew}>Broadcast Baru</Link>
            </Button>
          ) : null
        }
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Template</TableHead>
            <TableHead>Perangkat</TableHead>
            <TableHead>Target</TableHead>
            <TableHead>Terkirim</TableHead>
            <TableHead>Gagal</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Jadwal</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(data?.length ?? 0) === 0 && <TableEmpty colSpan={7} />}
          {data?.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{row.template.name}</TableCell>
              <TableCell>{row.device.name}</TableCell>
              <TableCell>{row.totalTargets}</TableCell>
              <TableCell>{row.sentCount}</TableCell>
              <TableCell>{row.failedCount}</TableCell>
              <TableCell>
                <Badge variant={row.status === 'done' ? 'success' : row.status === 'failed' ? 'destructive' : 'warning'}>
                  {row.status}
                </Badge>
              </TableCell>
              <TableCell>
                {row.scheduledAt
                  ? new Date(row.scheduledAt).toLocaleString('id-ID')
                  : new Date(row.createdAt).toLocaleString('id-ID')}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
