import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { CustomerStatus } from '@radgate/shared';
import { api } from '@/lib/api';
import { formatPhone } from '@/lib/utils';
import { PageHeader } from '@/components/page-header';
import { Badge, CUSTOMER_STATUS_VARIANT } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableEmpty, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface AoDetail {
  id: string;
  name: string;
  phone: string;
  status: string;
  wilayah: { name: string };
  customers: {
    id: string;
    assignedAt: string;
    customer: { id: string; name: string; customerCode: string; status: CustomerStatus; phone: string };
  }[];
}

export default function AccountOfficerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data } = useQuery({
    queryKey: ['ao', id],
    queryFn: async () => (await api.get<AoDetail>(`/ao/${id}`)).data,
    enabled: !!id,
  });

  return (
    <div className="space-y-4">
      <PageHeader title={data?.name ?? 'Detail Account Officer'} description={data?.wilayah.name} />
      <Card>
        <CardContent className="space-y-1 pt-4 text-sm">
          <p>{formatPhone(data?.phone)}</p>
          <Badge variant={data?.status === 'aktif' ? 'success' : 'neutral'}>{data?.status ?? '-'}</Badge>
        </CardContent>
      </Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Pelanggan</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Telepon</TableHead>
            <TableHead>Ditugaskan</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(data?.customers.length ?? 0) === 0 && <TableEmpty colSpan={4} />}
          {data?.customers.map((row) => (
            <TableRow key={row.id}>
              <TableCell>
                <div className="font-medium">{row.customer.name}</div>
                <div className="text-xs text-muted-foreground">{row.customer.customerCode}</div>
              </TableCell>
              <TableCell>
                <Badge variant={CUSTOMER_STATUS_VARIANT[row.customer.status]}>{row.customer.status}</Badge>
              </TableCell>
              <TableCell>{formatPhone(row.customer.phone)}</TableCell>
              <TableCell>{new Date(row.assignedAt).toLocaleDateString('id-ID')}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
