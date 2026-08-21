import { useQuery } from '@tanstack/react-query';
import { FileDown, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import type { CustomerStatus, InvoiceStatus } from '@radgate/shared';
import { api, downloadAuthenticated } from '@/lib/api';
import { qk } from '@/lib/query';
import { formatRupiah } from '@/lib/utils';
import { useActiveWilayah } from '@/providers/app-provider';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Badge, CUSTOMER_STATUS_VARIANT, INVOICE_STATUS_LABEL, INVOICE_STATUS_VARIANT } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableEmpty, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface StatusCount {
  status: string;
  _count: { _all: number };
}

interface BillingGroup {
  status: InvoiceStatus;
  count: number;
  total: number;
}

interface FinancesReport {
  income: number;
  expense: number;
  profit: number;
  from: string;
  to: string;
}

interface SummaryReport {
  customers: StatusCount[];
  finances: FinancesReport;
  billing: BillingGroup[];
  generatedAt: string;
}

export default function ReportsPage() {
  const wilayahId = useActiveWilayah();

  const exportFile = async (kind: 'xlsx' | 'pdf') => {
    try {
      await downloadAuthenticated(
        `/reports/export.${kind}`,
        `laporan-radgate.${kind}`,
        { wilayahId },
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal mengunduh laporan');
    }
  };

  const summary = useQuery({
    queryKey: qk.reports(wilayahId, 'summary'),
    queryFn: async () =>
      (await api.get<SummaryReport>('/reports/summary', { params: { wilayahId } })).data,
  });
  const customers = useQuery({
    queryKey: qk.reports(wilayahId, 'customers'),
    queryFn: async () =>
      (await api.get<StatusCount[]>('/reports/customers', { params: { wilayahId } })).data,
  });
  const finances = useQuery({
    queryKey: qk.reports(wilayahId, 'finances'),
    queryFn: async () =>
      (await api.get<FinancesReport>('/reports/finances', { params: { wilayahId } })).data,
  });
  const billing = useQuery({
    queryKey: qk.reports(wilayahId, 'billing'),
    queryFn: async () =>
      (await api.get<BillingGroup[]>('/reports/billing', { params: { wilayahId } })).data,
  });

  return (
    <div>
      <PageHeader
        title="Rekap Laporan"
        description={
          summary.data?.generatedAt
            ? `Snapshot ${new Date(summary.data.generatedAt).toLocaleString('id-ID')}`
            : 'Dibaca dari snapshot harian, bukan tabel mentah.'
        }
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => void exportFile('xlsx')}>
              <FileSpreadsheet /> Excel
            </Button>
            <Button variant="outline" size="sm" onClick={() => void exportFile('pdf')}>
              <FileDown /> PDF
            </Button>
          </>
        }
      />
      <Tabs defaultValue="rekap">
        <TabsList>
          <TabsTrigger value="rekap">Rekap</TabsTrigger>
          <TabsTrigger value="pelanggan">Pelanggan</TabsTrigger>
          <TabsTrigger value="keuangan">Keuangan</TabsTrigger>
          <TabsTrigger value="tagihan">Tagihan</TabsTrigger>
        </TabsList>

        <TabsContent value="rekap">
          <div className="grid gap-3 sm:grid-cols-3">
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">Pendapatan bulan ini</p>
                <p className="font-semibold">{formatRupiah(summary.data?.finances.income)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">Pengeluaran bulan ini</p>
                <p className="font-semibold">{formatRupiah(summary.data?.finances.expense)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">Profit</p>
                <p className="font-semibold">{formatRupiah(summary.data?.finances.profit)}</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="pelanggan">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Jumlah</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(customers.data?.length ?? 0) === 0 && <TableEmpty colSpan={2} />}
              {customers.data?.map((row) => (
                <TableRow key={row.status}>
                  <TableCell>
                    <Badge variant={CUSTOMER_STATUS_VARIANT[row.status as CustomerStatus] ?? 'neutral'}>
                      {row.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{row._count._all}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="keuangan">
          <div className="grid gap-3 sm:grid-cols-3">
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">Pemasukan</p>
                <p className="font-semibold">{formatRupiah(finances.data?.income)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">Pengeluaran</p>
                <p className="font-semibold">{formatRupiah(finances.data?.expense)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">Profit</p>
                <p className="font-semibold">{formatRupiah(finances.data?.profit)}</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tagihan">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Jumlah invoice</TableHead>
                <TableHead>Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(billing.data?.length ?? 0) === 0 && <TableEmpty colSpan={3} />}
              {billing.data?.map((row) => (
                <TableRow key={row.status}>
                  <TableCell>
                    <Badge variant={INVOICE_STATUS_VARIANT[row.status]}>{INVOICE_STATUS_LABEL[row.status]}</Badge>
                  </TableCell>
                  <TableCell>{row.count}</TableCell>
                  <TableCell>{formatRupiah(row.total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>
    </div>
  );
}
