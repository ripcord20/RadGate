import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatPhone } from '@/lib/utils';
import { useActiveWilayah } from '@/providers/app-provider';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableEmpty, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface AoRow {
  id: string;
  name: string;
  phone: string;
  status: string;
  wilayah: { name: string; code: string };
  _count: { customers: number };
}

export default function AccountOfficerActivePage() {
  const wilayahId = useActiveWilayah();
  const { data } = useQuery({
    queryKey: ['ao', wilayahId],
    queryFn: async () => (await api.get<AoRow[]>('/ao', { params: { wilayahId } })).data,
  });
  const active = data?.filter((row) => row.status === 'aktif') ?? [];

  return (
    <div>
      <PageHeader title="AO Aktif" />
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
          {active.length === 0 && <TableEmpty colSpan={6} />}
          {active.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="font-medium">{row.name}</TableCell>
              <TableCell>{formatPhone(row.phone)}</TableCell>
              <TableCell>{row.wilayah.code}</TableCell>
              <TableCell>{row._count.customers}</TableCell>
              <TableCell>
                <Badge variant="success">{row.status}</Badge>
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
