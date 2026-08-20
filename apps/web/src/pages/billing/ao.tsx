import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { queryClient } from '@/lib/query';
import { formatPhone } from '@/lib/utils';
import { useActiveWilayah, useApp } from '@/providers/app-provider';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableEmpty, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface AoRow {
  id: string;
  name: string;
  phone: string;
  status: string;
  wilayah: { name: string; code: string };
  _count: { customers: number };
}

export default function AccountOfficerPage() {
  const wilayahId = useActiveWilayah();
  const { can, wilayahOptions } = useApp();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('62');

  const { data } = useQuery({
    queryKey: ['ao', wilayahId],
    queryFn: async () => (await api.get<AoRow[]>('/ao', { params: { wilayahId } })).data,
  });

  const create = useMutation({
    mutationFn: () =>
      api.post('/ao', {
        name,
        phone,
        wilayahId: wilayahId ?? wilayahOptions[0]?.id,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['ao'] });
      setName('');
      setPhone('62');
      toast.success('AO ditambahkan');
    },
    onError: (e: { message?: string }) => toast.error(e.message ?? 'Gagal'),
  });

  return (
    <div>
      <PageHeader title="Manajemen Account Officer" />
      {can('billing', 'create') && (
        <div className="mb-4 flex flex-wrap gap-2">
          <Input placeholder="Nama" className="max-w-40" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="62812..." className="max-w-40" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <Button disabled={!name || phone.length < 10 || create.isPending} onClick={() => create.mutate()}>
            Tambah
          </Button>
        </div>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama</TableHead>
            <TableHead>Telepon</TableHead>
            <TableHead>Wilayah</TableHead>
            <TableHead>Jumlah pelanggan</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(data?.length ?? 0) === 0 && <TableEmpty colSpan={6} />}
          {data?.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="font-medium">{row.name}</TableCell>
              <TableCell>{formatPhone(row.phone)}</TableCell>
              <TableCell>{row.wilayah.code}</TableCell>
              <TableCell>{row._count.customers}</TableCell>
              <TableCell>
                <Badge variant={row.status === 'aktif' ? 'success' : 'neutral'}>{row.status}</Badge>
              </TableCell>
              <TableCell>
                <Link className="text-sm text-primary hover:underline" to={`/ao/detail/${row.id}`}>
                  Detail
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
