import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { qk } from '@/lib/query';
import { PageHeader } from '@/components/page-header';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableEmpty, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface LogRow {
  id: string;
  action: string;
  module: string;
  ipAddress: string | null;
  createdAt: string;
  user: { name: string; email: string } | null;
}

export default function ActivityLogPage() {
  const [search, setSearch] = useState('');
  const { data } = useQuery({
    queryKey: qk.logs({ search }),
    queryFn: async () =>
      (await api.get<LogRow[]>('/logs', { params: { search: search || undefined, perPage: 50 } })).data,
  });

  return (
    <div>
      <PageHeader
        title="Log Aktivitas"
        description="Jejak audit menyimpan selisih nilai lama dan baru, bukan seluruh record."
      />
      <div className="mb-3">
        <Input
          placeholder="Cari aksi atau modul..."
          className="max-w-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Waktu</TableHead>
            <TableHead>Pengguna</TableHead>
            <TableHead>Aksi</TableHead>
            <TableHead>Modul</TableHead>
            <TableHead>IP</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(data?.length ?? 0) === 0 && <TableEmpty colSpan={5} />}
          {data?.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{new Date(row.createdAt).toLocaleString('id-ID')}</TableCell>
              <TableCell>{row.user?.name ?? '-'}</TableCell>
              <TableCell>{row.action}</TableCell>
              <TableCell>{row.module}</TableCell>
              <TableCell>{row.ipAddress ?? '-'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
