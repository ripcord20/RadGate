import { useQuery } from '@tanstack/react-query';
import type { Paginated } from '@radgate/shared';
import { api } from '@/lib/api';
import { qk } from '@/lib/query';
import { formatRupiah } from '@/lib/utils';
import { useActiveWilayah } from '@/providers/app-provider';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableEmpty, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PaymentRow {
  id: string;
  reference: string;
  method: string;
  amount: number;
  fee: number;
  netAmount: number;
  status: string;
  isWithdrawn: boolean;
  createdAt: string;
  invoice: { invoiceNumber: string; total: number } | null;
}

interface Summary {
  total: number;
  pending: number;
  withdrawn: number;
  notWithdrawn: number;
}

interface Withdrawal {
  id: string;
  amount: number;
  bankAccount: string;
  status: string;
  requestedAt: string;
  completedAt: string | null;
}

export default function PaymentGatewayPage() {
  const wilayahId = useActiveWilayah();
  const { data } = useQuery({
    queryKey: qk.payments(wilayahId),
    queryFn: async () =>
      (await api.get<Paginated<PaymentRow>>('/payments', { params: { wilayahId, perPage: 50 } })).data,
  });
  const summary = useQuery({
    queryKey: [...qk.payments(wilayahId), 'summary'],
    queryFn: async () => (await api.get<Summary>('/payments/summary', { params: { wilayahId } })).data,
  });
  const withdrawals = useQuery({
    queryKey: [...qk.payments(null), 'withdrawals'],
    queryFn: async () => (await api.get<Withdrawal[]>('/payments/withdrawals')).data,
  });

  return (
    <div className="space-y-4">
      <PageHeader title="Payment Gateway" description="Transaksi pembayaran online, status callback, dan penarikan dana." />
      <div className="grid gap-3 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="font-semibold">{formatRupiah(summary.data?.total)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Pending</p>
            <p className="font-semibold">{formatRupiah(summary.data?.pending)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Belum ditarik</p>
            <p className="font-semibold">{formatRupiah(summary.data?.notWithdrawn)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Sudah ditarik</p>
            <p className="font-semibold">{formatRupiah(summary.data?.withdrawn)}</p>
          </CardContent>
        </Card>
      </div>
      <Tabs defaultValue="transaksi">
        <TabsList>
          <TabsTrigger value="transaksi">Transaksi</TabsTrigger>
          <TabsTrigger value="penarikan">Penarikan</TabsTrigger>
        </TabsList>
        <TabsContent value="transaksi">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Referensi</TableHead>
                <TableHead>Invoice</TableHead>
                <TableHead>Metode</TableHead>
                <TableHead>Jumlah</TableHead>
                <TableHead>Fee</TableHead>
                <TableHead>Bersih</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tarik dana</TableHead>
                <TableHead>Waktu</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data?.data.length ?? 0) === 0 && <TableEmpty colSpan={9} />}
              {data?.data.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.reference}</TableCell>
                  <TableCell>{row.invoice?.invoiceNumber ?? '-'}</TableCell>
                  <TableCell>{row.method}</TableCell>
                  <TableCell>{formatRupiah(row.amount)}</TableCell>
                  <TableCell>{formatRupiah(row.fee)}</TableCell>
                  <TableCell>{formatRupiah(row.netAmount)}</TableCell>
                  <TableCell>
                    <Badge variant={row.status === 'paid' ? 'success' : 'warning'}>{row.status}</Badge>
                  </TableCell>
                  <TableCell>{row.isWithdrawn ? 'Ya' : 'Tidak'}</TableCell>
                  <TableCell>{new Date(row.createdAt).toLocaleString('id-ID')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>
        <TabsContent value="penarikan">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Jumlah</TableHead>
                <TableHead>Rekening</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Diajukan</TableHead>
                <TableHead>Selesai</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(withdrawals.data?.length ?? 0) === 0 && <TableEmpty colSpan={5} />}
              {withdrawals.data?.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{formatRupiah(row.amount)}</TableCell>
                  <TableCell>{row.bankAccount}</TableCell>
                  <TableCell>
                    <Badge variant={row.status === 'done' || row.status === 'paid' ? 'success' : 'warning'}>
                      {row.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(row.requestedAt).toLocaleString('id-ID')}</TableCell>
                  <TableCell>{row.completedAt ? new Date(row.completedAt).toLocaleString('id-ID') : '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>
    </div>
  );
}
