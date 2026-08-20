import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { InvoiceStatus, Paginated } from '@radgate/shared';
import { api } from '@/lib/api';
import { queryClient, qk } from '@/lib/query';
import { formatRupiah } from '@/lib/utils';
import { useActiveWilayah, useApp } from '@/providers/app-provider';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Badge, INVOICE_STATUS_LABEL, INVOICE_STATUS_VARIANT } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableEmpty, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface InvoiceRow {
  id: string;
  invoiceNumber: string;
  total: number;
  status: InvoiceStatus;
  dueDate: string;
  periodMonth: number;
  periodYear: number;
  customer: { name: string; customerCode: string };
  package: { name: string };
  wilayah: { code: string };
}

export default function BillingPage() {
  const wilayahId = useActiveWilayah();
  const { can } = useApp();
  const now = new Date();
  const [status, setStatus] = useState('');

  const { data } = useQuery({
    queryKey: qk.invoices(wilayahId, { status }),
    queryFn: async () =>
      (
        await api.get<Paginated<InvoiceRow>>('/billing', {
          params: { wilayahId, status: status || undefined, perPage: 50 },
        })
      ).data,
  });

  const summary = useQuery({
    queryKey: [...qk.invoices(wilayahId), 'summary'],
    queryFn: async () => (await api.get('/billing/summary', { params: { wilayahId } })).data,
  });

  const generate = useMutation({
    mutationFn: () =>
      api.post('/billing/generate', {
        periodMonth: now.getMonth() + 1,
        periodYear: now.getFullYear(),
        wilayahId,
        customerIds: [],
        includeTax: true,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Generate tagihan dimulai');
    },
    onError: (e: { message?: string }) => toast.error(e.message ?? 'Gagal generate'),
  });

  return (
    <div>
      <PageHeader
        title="Tagihan"
        description={
          summary.data
            ? `Hutang ${formatRupiah(summary.data.hutang)} · Belum lunas ${formatRupiah(summary.data.totalUnpaid)}`
            : undefined
        }
        actions={
          can('billing', 'create') ? (
            <Button onClick={() => generate.mutate()} disabled={generate.isPending}>
              Generate Tagihan Bulan Ini
            </Button>
          ) : null
        }
      />

      <div className="mb-3">
        <select
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">Semua Status</option>
          <option value="unpaid">Belum Bayar</option>
          <option value="overdue">Terlambat</option>
          <option value="paid">Lunas</option>
          <option value="debt">Hutang</option>
        </select>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID Invoice</TableHead>
            <TableHead>Pelanggan</TableHead>
            <TableHead>Wilayah</TableHead>
            <TableHead>Jumlah</TableHead>
            <TableHead>Paket</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Periode</TableHead>
            <TableHead>Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(data?.data.length ?? 0) === 0 && <TableEmpty colSpan={8} />}
          {data?.data.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{row.invoiceNumber}</TableCell>
              <TableCell>{row.customer.name}</TableCell>
              <TableCell>{row.wilayah.code}</TableCell>
              <TableCell>{formatRupiah(row.total)}</TableCell>
              <TableCell>{row.package.name}</TableCell>
              <TableCell>
                <Badge variant={INVOICE_STATUS_VARIANT[row.status]}>{INVOICE_STATUS_LABEL[row.status]}</Badge>
              </TableCell>
              <TableCell>
                {row.periodMonth}/{row.periodYear}
              </TableCell>
              <TableCell>
                <Link className="text-sm text-primary hover:underline" to={`/billing/detail/${row.id}`}>
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
