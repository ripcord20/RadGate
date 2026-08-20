import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { CustomerStatus, Paginated } from '@radgate/shared';
import { api } from '@/lib/api';
import { qk } from '@/lib/query';
import { formatPhone } from '@/lib/utils';
import { useActiveWilayah } from '@/providers/app-provider';
import { PageHeader } from '@/components/page-header';
import { Badge, CUSTOMER_STATUS_VARIANT } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableEmpty, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface ResellerOption {
  id: string;
  name: string;
}

interface CustomerRow {
  id: string;
  name: string;
  customerCode: string;
  status: CustomerStatus;
  phone: string;
  package: { name: string };
}

export default function ResellerCustomersPage() {
  const wilayahId = useActiveWilayah();
  const [params, setParams] = useSearchParams();
  const id = params.get('id') ?? '';

  const resellers = useQuery({
    queryKey: qk.resellers(wilayahId),
    queryFn: async () =>
      (await api.get<Paginated<ResellerOption>>('/resellers', { params: { wilayahId, perPage: 100 } })).data,
  });

  const { data } = useQuery({
    queryKey: [...qk.resellers(wilayahId), id, 'customers'],
    queryFn: async () => (await api.get<CustomerRow[]>(`/resellers/${id}/customers`, { params: { perPage: 100 } })).data,
    enabled: !!id,
  });

  return (
    <div>
      <PageHeader title="Pelanggan Reseller" />
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
            <TableHead>Pelanggan</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Paket</TableHead>
            <TableHead>Telepon</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(!id || (data?.length ?? 0) === 0) && <TableEmpty colSpan={4} message={id ? 'Belum ada pelanggan' : 'Pilih reseller'} />}
          {data?.map((row) => (
            <TableRow key={row.id}>
              <TableCell>
                <div className="font-medium">{row.name}</div>
                <div className="text-xs text-muted-foreground">{row.customerCode}</div>
              </TableCell>
              <TableCell>
                <Badge variant={CUSTOMER_STATUS_VARIANT[row.status]}>{row.status}</Badge>
              </TableCell>
              <TableCell>{row.package.name}</TableCell>
              <TableCell>{formatPhone(row.phone)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
