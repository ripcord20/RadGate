import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { queryClient, qk } from '@/lib/query';
import { formatPhone } from '@/lib/utils';
import { useApp } from '@/providers/app-provider';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableEmpty, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Device {
  id: string;
  name: string;
  phoneNumber: string;
  provider: string;
  status: string;
  lastConnectedAt: string | null;
}

export default function WhatsappInternalPage() {
  const { can } = useApp();
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('62');
  const [qr, setQr] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: qk.whatsapp('devices'),
    queryFn: async () => (await api.get<Device[]>('/whatsapp/devices')).data,
  });

  const pair = useMutation({
    mutationFn: async () => {
      const res = await api.post<Device & { qr?: string }>('/whatsapp/devices', {
        name,
        phoneNumber,
        provider: 'internal',
      });
      return res.data;
    },
    onSuccess: async (row) => {
      await queryClient.invalidateQueries({ queryKey: qk.whatsapp('devices') });
      setName('');
      setPhoneNumber('62');
      setQr(row.qr ?? null);
      toast.success('Perangkat ditambahkan');
    },
    onError: (e: { message?: string }) => toast.error(e.message ?? 'Gagal'),
  });

  const reconnect = useMutation({
    mutationFn: async (id: string) => (await api.post<{ qr?: string }>(`/whatsapp/devices/${id}/reconnect`)).data,
    onSuccess: async (row) => {
      await queryClient.invalidateQueries({ queryKey: qk.whatsapp('devices') });
      setQr(row.qr ?? null);
      toast.success('Reconnect dimulai');
    },
    onError: (e: { message?: string }) => toast.error(e.message ?? 'Gagal'),
  });

  const internal = data?.filter((d) => d.provider === 'internal') ?? [];

  return (
    <div>
      <PageHeader
        title="Perangkat WhatsApp"
        description="Gateway internal. Kode QR pairing ditampilkan sebagai teks; sesi tidak dikirim ke browser."
      />
      {can('whatsapp', 'create') && (
        <div className="mb-4 flex flex-wrap gap-2">
          <Input placeholder="Nama" className="max-w-40" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="62812..." className="max-w-40" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
          <Button disabled={!name || phoneNumber.length < 10 || pair.isPending} onClick={() => pair.mutate()}>
            Tambah Perangkat
          </Button>
        </div>
      )}
      {qr && (
        <Card className="mb-4 max-w-lg">
          <CardContent className="pt-4 font-mono text-xs break-all">{qr}</CardContent>
        </Card>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama</TableHead>
            <TableHead>Nomor</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Terhubung terakhir</TableHead>
            <TableHead>Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {internal.length === 0 && <TableEmpty colSpan={5} />}
          {internal.map((d) => (
            <TableRow key={d.id}>
              <TableCell>{d.name}</TableCell>
              <TableCell>{formatPhone(d.phoneNumber)}</TableCell>
              <TableCell>
                <Badge variant={d.status === 'connected' ? 'success' : 'warning'}>{d.status}</Badge>
              </TableCell>
              <TableCell>{d.lastConnectedAt ? new Date(d.lastConnectedAt).toLocaleString('id-ID') : '-'}</TableCell>
              <TableCell className="space-x-2">
                {can('whatsapp', 'update') && (
                  <Button size="sm" variant="outline" onClick={() => reconnect.mutate(d.id)}>
                    Reconnect
                  </Button>
                )}
                <Link className="text-sm text-primary hover:underline" to={`/whatsapp/inbox/${d.phoneNumber}`}>
                  Inbox
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
