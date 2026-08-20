import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { Paginated, TicketPriority, TicketStatus } from '@radgate/shared';
import { api } from '@/lib/api';
import { queryClient, qk } from '@/lib/query';
import { useActiveWilayah, useApp } from '@/providers/app-provider';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge, TICKET_STATUS_VARIANT } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableEmpty, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface TicketRow {
  id: string;
  ticketNumber: string;
  title: string;
  priority: TicketPriority;
  status: TicketStatus;
  createdAt: string;
  wilayah: { name: string };
}

export default function TicketsPage() {
  const wilayahId = useActiveWilayah();
  const { can, wilayahOptions } = useApp();
  const [status, setStatus] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const { data } = useQuery({
    queryKey: qk.tickets(wilayahId, { status }),
    queryFn: async () =>
      (
        await api.get<Paginated<TicketRow>>('/tickets', {
          params: { wilayahId, status: status || undefined, perPage: 50 },
        })
      ).data,
  });

  const create = useMutation({
    mutationFn: () =>
      api.post('/tickets', {
        title,
        description,
        wilayahId: wilayahId ?? wilayahOptions[0]?.id,
        priority: 'sedang',
        status: 'baru',
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['tickets'] });
      setTitle('');
      setDescription('');
      toast.success('Tiket dibuat');
    },
    onError: (e: { message?: string }) => toast.error(e.message ?? 'Gagal'),
  });

  return (
    <div>
      <PageHeader
        title="Manajemen Tiket"
        actions={
          can('tickets', 'create') ? (
            <div className="flex flex-wrap gap-2">
              <Input placeholder="Judul" value={title} onChange={(e) => setTitle(e.target.value)} className="max-w-48" />
              <Input
                placeholder="Deskripsi"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="max-w-56"
              />
              <Button disabled={!title || !description || create.isPending} onClick={() => create.mutate()}>
                Buat Tiket
              </Button>
            </div>
          ) : null
        }
      />
      <div className="mb-3 flex gap-2">
        {['', 'baru', 'proses', 'selesai'].map((s) => (
          <Button key={s} size="sm" variant={status === s ? 'default' : 'outline'} onClick={() => setStatus(s)}>
            {s === '' ? 'Semua' : s}
          </Button>
        ))}
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nomor</TableHead>
            <TableHead>Judul</TableHead>
            <TableHead>Prioritas</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Wilayah</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(data?.data.length ?? 0) === 0 && <TableEmpty colSpan={5} />}
          {data?.data.map((t) => (
            <TableRow key={t.id}>
              <TableCell>
                <Link className="text-primary hover:underline" to={`/tiket/detail/${t.id}`}>
                  {t.ticketNumber}
                </Link>
              </TableCell>
              <TableCell>{t.title}</TableCell>
              <TableCell>{t.priority}</TableCell>
              <TableCell>
                <Badge variant={TICKET_STATUS_VARIANT[t.status]}>{t.status}</Badge>
              </TableCell>
              <TableCell>{t.wilayah?.name}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
