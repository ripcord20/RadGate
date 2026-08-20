import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { Paginated } from '@radgate/shared';
import { api } from '@/lib/api';
import { queryClient, qk } from '@/lib/query';
import { useApp } from '@/providers/app-provider';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableEmpty, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface WilayahRow {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
}

export default function WilayahPage() {
  const { can, refresh } = useApp();
  const { data } = useQuery({
    queryKey: qk.wilayah,
    queryFn: async () => (await api.get<Paginated<WilayahRow>>('/wilayah', { params: { perPage: 100 } })).data,
  });
  const [name, setName] = useState('');
  const [code, setCode] = useState('');

  const create = useMutation({
    mutationFn: () => api.post('/wilayah', { name, code: code.toUpperCase(), isActive: true }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: qk.wilayah });
      await refresh();
      setName('');
      setCode('');
      toast.success('Wilayah ditambahkan');
    },
    onError: (e: { message?: string }) => toast.error(e.message ?? 'Gagal'),
  });

  return (
    <div>
      <PageHeader title="Wilayah" />
      {can('settings', 'create') && (
        <div className="mb-4 flex flex-wrap gap-2">
          <Input placeholder="Nama" value={name} onChange={(e) => setName(e.target.value)} className="max-w-48" />
          <Input placeholder="Kode (MDR)" value={code} onChange={(e) => setCode(e.target.value)} className="max-w-32" />
          <Button disabled={!name || !code || create.isPending} onClick={() => create.mutate()}>
            Tambah
          </Button>
        </div>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama</TableHead>
            <TableHead>Kode</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(data?.data.length ?? 0) === 0 && <TableEmpty colSpan={3} />}
          {data?.data.map((w) => (
            <TableRow key={w.id}>
              <TableCell>{w.name}</TableCell>
              <TableCell>{w.code}</TableCell>
              <TableCell>{w.isActive ? 'Aktif' : 'Nonaktif'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
