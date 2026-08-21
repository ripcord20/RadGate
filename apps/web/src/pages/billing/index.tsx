import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Filter, Plus, RefreshCw, Search } from 'lucide-react';
import { toast } from 'sonner';
import type { InvoiceStatus, Paginated } from '@radgate/shared';
import { ROUTES } from '@radgate/shared';
import { api } from '@/lib/api';
import { qk } from '@/lib/query';
import { formatMonthYear, formatPhone, formatRupiah } from '@/lib/utils';
import { useActiveWilayah, useApp } from '@/providers/app-provider';
import { FilterBar, filterControlClass } from '@/components/filter-bar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge, INVOICE_STATUS_VARIANT } from '@/components/ui/badge';

interface InvoiceRow {
  id: string;
  invoiceNumber: string;
  total: number;
  status: InvoiceStatus;
  dueDate: string;
  createdAt: string;
  paidAt: string | null;
  periodMonth: number;
  periodYear: number;
  customer: { name: string; customerCode: string; phone: string; pppoeUsername: string };
  package: { name: string };
  wilayah: { code: string; name: string };
}

interface BillingSummary {
  unpaid: { count: number; total: number };
  overdue: { count: number; total: number };
  debt: { count: number; total: number };
  paid: { count: number; total: number };
  hutang: number;
  totalUnpaid: number;
  totalPaid: number;
}

const CARD_STATUS_LABEL: Record<InvoiceStatus, string> = {
  unpaid: 'Pending',
  overdue: 'Terlambat',
  paid: 'Lunas',
  debt: 'Hutang',
  cancelled: 'Batal',
};

export default function BillingPage() {
  const wilayahId = useActiveWilayah();
  const { can } = useApp();
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [periodMonth, setPeriodMonth] = useState('');
  const [periodYear, setPeriodYear] = useState('');
  const [showFilter, setShowFilter] = useState(false);

  const { data, isFetching, refetch } = useQuery({
    queryKey: qk.invoices(wilayahId, { status, search, periodMonth, periodYear }),
    queryFn: async () =>
      (
        await api.get<Paginated<InvoiceRow>>('/billing', {
          params: {
            wilayahId,
            status: status || undefined,
            search: search || undefined,
            periodMonth: periodMonth || undefined,
            periodYear: periodYear || undefined,
            perPage: 50,
          },
        })
      ).data,
  });

  const summary = useQuery({
    queryKey: [...qk.invoices(wilayahId), 'summary'],
    queryFn: async () => (await api.get<BillingSummary>('/billing/summary', { params: { wilayahId } })).data,
  });

  const reminder = useMutation({
    mutationFn: (id: string) => api.post(`/billing/${id}/reminder`),
    onSuccess: () => toast.success('Reminder dijadwalkan'),
    onError: (e: { message?: string }) => toast.error(e.message ?? 'Gagal mengirim reminder'),
  });

  const s = summary.data;
  const outstanding = (s?.unpaid.total ?? 0) + (s?.overdue.total ?? 0) + (s?.debt.total ?? 0);
  const now = new Date();
  const years = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1];

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Dashboard <span className="mx-1">›</span> Tagihan <span className="mx-1">›</span> Semua
      </p>

      <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <h2 className="text-lg font-semibold">Semua Tagihan</h2>
        <p className="mt-1 text-sm">
          <span className="font-medium text-amber-600">{s?.unpaid.count ?? 0} pending</span>
          <span className="mx-2 font-medium text-destructive">{s?.overdue.count ?? 0} Terlambat</span>
          <span className="font-medium text-destructive">{s?.debt.count ?? 0} hutang</span>
        </p>
        <p className="mt-1 text-sm">
          <span className="font-medium text-destructive">{formatRupiah(s?.hutang)} hutang</span>
          <span className="mx-2 font-medium text-success">{formatRupiah(outstanding)} total</span>
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            variant={status === 'unpaid' ? 'default' : 'outline'}
            className="rounded-full"
            size="sm"
            onClick={() => setStatus(status === 'unpaid' ? '' : 'unpaid')}
          >
            Belum Bayar
          </Button>
          {can('billing', 'create') && (
            <Button asChild className="rounded-full bg-foreground text-background hover:bg-foreground/90">
              <Link to={ROUTES.billing.generate}>
                <Plus /> Generate Tagihan
              </Link>
            </Button>
          )}
          <Button variant="outline" className="rounded-full" size="sm" onClick={() => setShowFilter((v) => !v)}>
            <Filter /> Filter
          </Button>
        </div>

        <div className="relative mt-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="rounded-full pl-9"
            placeholder="Cari nama, alamat, atau username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {showFilter && (
          <div className="mt-3">
            <FilterBar
              onReset={() => {
                setStatus('');
                setSearch('');
                setPeriodMonth('');
                setPeriodYear('');
              }}
            >
              <select className={filterControlClass} value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">Semua Status</option>
                <option value="unpaid">Pending</option>
                <option value="overdue">Terlambat</option>
                <option value="paid">Lunas</option>
                <option value="debt">Hutang</option>
              </select>
              <select
                className={filterControlClass}
                value={periodMonth}
                onChange={(e) => setPeriodMonth(e.target.value)}
              >
                <option value="">Semua Periode</option>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {formatMonthYear(i + 1, now.getFullYear()).split(' ')[0]}
                  </option>
                ))}
              </select>
              <select className={filterControlClass} value={periodYear} onChange={(e) => setPeriodYear(e.target.value)}>
                <option value="">Semua Tahun</option>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <Button type="button" variant="outline" size="sm" onClick={() => void refetch()}>
                <RefreshCw className={isFetching ? 'animate-spin' : undefined} /> Refresh
              </Button>
            </FilterBar>
          </div>
        )}
      </section>

      {(data?.data.length ?? 0) === 0 && (
        <section className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <h3 className="font-semibold">Tidak ada data tagihan</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Tidak ada tagihan yang ditemukan sesuai dengan filter yang diterapkan.
          </p>
        </section>
      )}

      <div className="space-y-3">
        {data?.data.map((row) => (
          <article key={row.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold">{row.invoiceNumber}</h3>
                <p className="text-xs text-muted-foreground">
                  {new Date(row.createdAt).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <Badge variant={INVOICE_STATUS_VARIANT[row.status]} className="rounded-full">
                {CARD_STATUS_LABEL[row.status]}
              </Badge>
            </div>

            <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
              <dt className="text-muted-foreground">Penggunaan</dt>
              <dd>
                <span className="rounded-md bg-muted px-2 py-0.5 text-xs">
                  {formatMonthYear(row.periodMonth, row.periodYear)}
                </span>
              </dd>
              <dt className="text-muted-foreground">Jatuh tempo</dt>
              <dd>
                <span className="rounded-md bg-muted px-2 py-0.5 text-xs">
                  {new Date(row.dueDate).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                </span>
              </dd>
              <dt className="text-muted-foreground">Pelanggan</dt>
              <dd>
                <div className="font-medium">{row.customer.name}</div>
                <div className="text-xs text-muted-foreground">
                  {row.customer.customerCode} · {formatPhone(row.customer.phone)}
                </div>
              </dd>
              <dt className="text-muted-foreground">Paket</dt>
              <dd>{row.package.name}</dd>
              <dt className="text-muted-foreground">Jumlah</dt>
              <dd className="font-semibold">{formatRupiah(row.total)}</dd>
            </dl>

            <div className="mt-3 flex flex-wrap gap-2">
              {can('billing', 'update') && row.status !== 'paid' && row.status !== 'cancelled' && (
                <Button asChild size="sm" variant="outline" className="rounded-full">
                  <Link to={`/billing/detail/${row.id}`}>Bayar atau Hutang</Link>
                </Button>
              )}
              {can('billing', 'update') && (
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full"
                  disabled={reminder.isPending}
                  onClick={() => reminder.mutate(row.id)}
                >
                  Reminder
                </Button>
              )}
              <Button asChild size="sm" className="rounded-full">
                <Link to={`/billing/detail/${row.id}`}>Detail</Link>
              </Button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
