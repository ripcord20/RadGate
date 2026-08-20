import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { queryClient, qk } from '@/lib/query';
import { formatPhone } from '@/lib/utils';
import { useApp } from '@/providers/app-provider';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableEmpty, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Device {
  id: string;
  name: string;
  phoneNumber: string;
  provider: string;
  status: string;
}

export default function WhatsappExternalApiPage() {
  const { can } = useApp();
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('62');

  const { data } = useQuery({
    queryKey: qk.whatsapp('devices'),
    queryFn: async () => (await api.get<Device[]>('/whatsapp/devices')).data,
  });

  const create = useMutation({
    mutationFn: () =>
      api.post('/whatsapp/devices', { name, phoneNumber, provider: 'external' }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: qk.whatsapp('devices') });
      setName('');
      setPhoneNumber('62');
      toast.success('Penyedia eksternal disimpan');
    },
    onError: (e: { message?: string }) => toast.error(e.message ?? 'Gagal'),
  });

  const external = data?.filter((d) => d.provider === 'external') ?? [];

  return (
    <div>
      <PageHeader
        title="WhatsApp External API"
        description="Konfigurasi penyedia pihak ketiga sebagai alternatif gateway internal. Kredensial sesi tidak ditampilkan."
      />
      {can('whatsapp', 'create') && (
        <div className="mb-4 flex flex-wrap gap-2">
          <Input placeholder="Nama penyedia" className="max-w-48" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="62812..." className="max-w-40" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
          <Button disabled={!name || phoneNumber.length < 10 || create.isPending} onClick={() => create.mutate()}>
            Simpan
          </Button>
        </div>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama</TableHead>
            <TableHead>Nomor</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {external.length === 0 && <TableEmpty colSpan={3} />}
          {external.map((d) => (
            <TableRow key={d.id}>
              <TableCell>{d.name}</TableCell>
              <TableCell>{formatPhone(d.phoneNumber)}</TableCell>
              <TableCell>
                <Badge variant={d.status === 'connected' ? 'success' : 'warning'}>{d.status}</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
