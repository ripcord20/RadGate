import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { Paginated } from '@radgate/shared';
import { api } from '@/lib/api';
import { queryClient, qk } from '@/lib/query';
import { useApp } from '@/providers/app-provider';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableEmpty, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Device {
  id: string;
  name: string;
  phoneNumber: string;
}

interface Message {
  id: string;
  direction: string;
  content: string;
  status: string;
  createdAt: string;
}

export default function WhatsappInboxPage() {
  const { number } = useParams<{ number: string }>();
  const { can } = useApp();
  const [phone, setPhone] = useState(number ?? '');
  const [content, setContent] = useState('');
  const [deviceId, setDeviceId] = useState('');

  const devices = useQuery({
    queryKey: qk.whatsapp('devices'),
    queryFn: async () => (await api.get<Device[]>('/whatsapp/devices')).data,
  });

  const inbox = useQuery({
    queryKey: qk.whatsapp(`inbox:${number}`),
    queryFn: async () =>
      (await api.get<Paginated<Message>>(`/whatsapp/inbox/${number}`, { params: { perPage: 100 } })).data,
    enabled: !!number,
  });

  const send = useMutation({
    mutationFn: () =>
      api.post('/whatsapp/send', {
        deviceId: deviceId || devices.data?.[0]?.id,
        phoneNumber: number ?? phone,
        content,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: qk.whatsapp(`inbox:${number}`) });
      setContent('');
      toast.success('Pesan terkirim');
    },
    onError: (e: { message?: string }) => toast.error(e.message ?? 'Gagal'),
  });

  return (
    <div>
      <PageHeader title="Inbox WhatsApp" description={number ? `Percakapan dengan ${number}` : 'Pilih nomor pelanggan'} />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Waktu</TableHead>
            <TableHead>Arah</TableHead>
            <TableHead>Isi</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(inbox.data?.data.length ?? 0) === 0 && <TableEmpty colSpan={4} message="Belum ada percakapan" />}
          {inbox.data?.data.map((m) => (
            <TableRow key={m.id}>
              <TableCell>{new Date(m.createdAt).toLocaleString('id-ID')}</TableCell>
              <TableCell>{m.direction === 'out' ? 'Keluar' : 'Masuk'}</TableCell>
              <TableCell className="max-w-md whitespace-pre-wrap">{m.content}</TableCell>
              <TableCell>{m.status}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {can('whatsapp', 'create') && (
        <div className="mt-4 flex flex-wrap gap-2">
          <select
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
            value={deviceId}
            onChange={(e) => setDeviceId(e.target.value)}
          >
            <option value="">Perangkat</option>
            {devices.data?.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          {!number && (
            <Input placeholder="62812..." className="max-w-40" value={phone} onChange={(e) => setPhone(e.target.value)} />
          )}
          <Textarea className="min-h-9 max-w-md" value={content} onChange={(e) => setContent(e.target.value)} />
          <Button
            disabled={!content || !(number || phone) || send.isPending}
            onClick={() => send.mutate()}
          >
            Kirim
          </Button>
        </div>
      )}
    </div>
  );
}
