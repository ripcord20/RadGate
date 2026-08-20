import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { Paginated } from '@radgate/shared';
import { api } from '@/lib/api';
import { queryClient, qk } from '@/lib/query';
import { useActiveWilayah, useApp } from '@/providers/app-provider';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableEmpty, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface NasRow {
  id: string;
  name: string;
}

interface PortRow {
  id: string;
  name: string;
  protocol: string;
  externalPort: number;
  internalIp: string;
  internalPort: number;
  isActive: boolean;
  nas: { name: string; ipAddress: string };
}

export default function PortForwardingPage() {
  const wilayahId = useActiveWilayah();
  const { can } = useApp();
  const [nasId, setNasId] = useState('');
  const [name, setName] = useState('');
  const [protocol, setProtocol] = useState<'tcp' | 'udp'>('tcp');
  const [externalPort, setExternalPort] = useState(8080);
  const [internalIp, setInternalIp] = useState('');
  const [internalPort, setInternalPort] = useState(80);

  const nas = useQuery({
    queryKey: qk.nas(wilayahId),
    queryFn: async () =>
      (await api.get<Paginated<NasRow>>('/nas', { params: { wilayahId, perPage: 100 } })).data,
  });

  const { data } = useQuery({
    queryKey: [...qk.nas(wilayahId), 'ports'],
    queryFn: async () =>
      (await api.get<PortRow[]>('/nas/port-forwarding', { params: { wilayahId, perPage: 100 } })).data,
  });

  const create = useMutation({
    mutationFn: () =>
      api.post('/nas/port-forwarding', {
        nasId,
        name,
        protocol,
        externalPort,
        internalIp,
        internalPort,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['nas'] });
      setName('');
      toast.success('Aturan ditambahkan');
    },
    onError: (e: { message?: string }) => toast.error(e.message ?? 'Gagal'),
  });

  return (
    <div>
      <PageHeader title="Port Forwarding" />
      {can('servers', 'create') && (
        <div className="mb-4 flex flex-wrap gap-2">
          <select
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
            value={nasId}
            onChange={(e) => setNasId(e.target.value)}
          >
            <option value="">NAS</option>
            {nas.data?.data.map((n) => (
              <option key={n.id} value={n.id}>
                {n.name}
              </option>
            ))}
          </select>
          <Input placeholder="Nama" className="max-w-36" value={name} onChange={(e) => setName(e.target.value)} />
          <select
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
            value={protocol}
            onChange={(e) => setProtocol(e.target.value as 'tcp' | 'udp')}
          >
            <option value="tcp">TCP</option>
            <option value="udp">UDP</option>
          </select>
          <Input
            type="number"
            className="max-w-24"
            value={externalPort}
            onChange={(e) => setExternalPort(Number(e.target.value))}
          />
          <Input placeholder="IP internal" className="max-w-36" value={internalIp} onChange={(e) => setInternalIp(e.target.value)} />
          <Input
            type="number"
            className="max-w-24"
            value={internalPort}
            onChange={(e) => setInternalPort(Number(e.target.value))}
          />
          <Button
            disabled={!nasId || !name || !internalIp || create.isPending}
            onClick={() => create.mutate()}
          >
            Tambah
          </Button>
        </div>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama</TableHead>
            <TableHead>NAS</TableHead>
            <TableHead>Protokol</TableHead>
            <TableHead>Port eksternal</TableHead>
            <TableHead>IP internal</TableHead>
            <TableHead>Port internal</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(data?.length ?? 0) === 0 && <TableEmpty colSpan={7} />}
          {data?.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{row.name}</TableCell>
              <TableCell>{row.nas.name}</TableCell>
              <TableCell className="uppercase">{row.protocol}</TableCell>
              <TableCell>{row.externalPort}</TableCell>
              <TableCell>{row.internalIp}</TableCell>
              <TableCell>{row.internalPort}</TableCell>
              <TableCell>
                <Badge variant={row.isActive ? 'success' : 'neutral'}>{row.isActive ? 'aktif' : 'nonaktif'}</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
