import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { queryClient, qk } from '@/lib/query';
import { useApp } from '@/providers/app-provider';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableEmpty, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface NotificationRow {
  id: string;
  type: string;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
}

export default function NotificationsPage() {
  const { can } = useApp();
  const { data } = useQuery({
    queryKey: qk.notifications,
    queryFn: async () => (await api.get<NotificationRow[]>('/notifications')).data,
  });

  const markRead = useMutation({
    mutationFn: (id: string) => api.post(`/notifications/${id}/read`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: qk.notifications });
    },
    onError: (e: { message?: string }) => toast.error(e.message ?? 'Gagal'),
  });

  return (
    <div>
      <PageHeader title="Pusat Notifikasi" />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Waktu</TableHead>
            <TableHead>Jenis</TableHead>
            <TableHead>Judul</TableHead>
            <TableHead>Isi</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(data?.length ?? 0) === 0 && <TableEmpty colSpan={6} />}
          {data?.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{new Date(row.createdAt).toLocaleString('id-ID')}</TableCell>
              <TableCell>{row.type}</TableCell>
              <TableCell>{row.title}</TableCell>
              <TableCell className="max-w-md">{row.body}</TableCell>
              <TableCell>
                <Badge variant={row.readAt ? 'neutral' : 'warning'}>{row.readAt ? 'dibaca' : 'baru'}</Badge>
              </TableCell>
              <TableCell>
                {can('notifications', 'update') && !row.readAt && (
                  <Button size="sm" variant="outline" onClick={() => markRead.mutate(row.id)}>
                    Tandai dibaca
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
