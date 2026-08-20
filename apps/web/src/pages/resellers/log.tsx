import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { Paginated } from '@radgate/shared';
import { api } from '@/lib/api';
import { qk } from '@/lib/query';
import { formatRupiah } from '@/lib/utils';
import { useActiveWilayah } from '@/providers/app-provider';
import { PageHeader } from '@/components/page-header';
import { Table, TableBody, TableCell, TableEmpty, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface ResellerOption {
  id: string;
  name: string;
}

interface LogRow {
  id: string;
  type: string;
  amount: number;
  balanceAfter: number;
  notes: string | null;
  createdAt: string;
}

export default function ResellerLogPage() {
  const wilayahId = useActiveWilayah();
  const [params, setParams] = useSearchParams();
  const id = params.get('id') ?? '';

  const resellers = useQuery({
    queryKey: qk.resellers(wilayahId),
    queryFn: async () =>
      (await api.get<Paginated<ResellerOption>>('/resellers', { params: { wilayahId, perPage: 100 } })).data,
  });

  const { data } = useQuery({
    queryKey: [...qk.resellers(wilayahId), id, 'logs'],
    queryFn: async () => (await api.get<LogRow[]>(`/resellers/${id}/logs`)).data,
    enabled: !!id,
  });

  const selected = resellers.data?.data.find((r) => r.id === id);

  return (
    <div>
      <PageHeader title="Log Reseller" description={selected?.name} />
      <div className="mb-3">
        <select
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
          value={id}
          onChange={(e) => setParams(e.target.value ? { id: e.target.value } : {})}
        >
          <option value="">Pilih reseller</option>
          {resellers.data?.data.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Waktu</TableHead>
            <TableHead>Jenis</TableHead>
            <TableHead>Nominal</TableHead>
            <TableHead>Saldo setelah</TableHead>
            <TableHead>Catatan</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(!id || (data?.length ?? 0) === 0) && <TableEmpty colSpan={5} message={id ? 'Belum ada log' : 'Pilih reseller'} />}
          {data?.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{new Date(row.createdAt).toLocaleString('id-ID')}</TableCell>
              <TableCell>{row.type}</TableCell>
              <TableCell>{formatRupiah(row.amount)}</TableCell>
              <TableCell>{formatRupiah(row.balanceAfter)}</TableCell>
              <TableCell>{row.notes ?? '-'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
