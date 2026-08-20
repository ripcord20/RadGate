import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { qk } from '@/lib/query';
import { formatRupiah } from '@/lib/utils';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableEmpty, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Bill {
  id: string;
  invoiceNumber: string;
  amount: number;
  status: string;
  dueDate: string;
  paidAt: string | null;
}

export default function SubscriptionHistoryPage() {
  const { data } = useQuery({
    queryKey: [...qk.subscription, 'bills'],
    queryFn: async () => (await api.get<Bill[]>('/subscription/bills')).data,
  });

  return (
    <div>
      <PageHeader title="Riwayat Tagihan" />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>No Invoice</TableHead>
            <TableHead>Jumlah</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Jatuh tempo</TableHead>
            <TableHead>Dibayar</TableHead>
            <TableHead>Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(data?.length ?? 0) === 0 && <TableEmpty colSpan={6} />}
          {data?.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{row.invoiceNumber}</TableCell>
              <TableCell>{formatRupiah(row.amount)}</TableCell>
              <TableCell>
                <Badge variant={row.status === 'paid' ? 'success' : 'warning'}>{row.status}</Badge>
              </TableCell>
              <TableCell>{new Date(row.dueDate).toLocaleDateString('id-ID')}</TableCell>
              <TableCell>{row.paidAt ? new Date(row.paidAt).toLocaleDateString('id-ID') : '-'}</TableCell>
              <TableCell className="space-x-2">
                <Link className="text-sm text-primary hover:underline" to={`/subscription/bill/${row.id}`}>
                  Detail
                </Link>
                <Link className="text-sm text-primary hover:underline" to={`/subscription/payment/${row.id}`}>
                  Bayar
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
