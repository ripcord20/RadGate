import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  CheckCircle2,
  CircleSlash,
  Clock,
  Receipt,
  Ticket,
  Users,
  Wifi,
  WifiOff,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { api } from '@/lib/api';
import { qk } from '@/lib/query';
import { cn, formatNumber, formatRupiah } from '@/lib/utils';
import { useApp } from '@/providers/app-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/page-header';
import { DashboardMapPreview } from './map-preview';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Link } from 'react-router-dom';
import { ROUTES } from '@radgate/shared';

interface DashboardStats {
  customers: {
    total: number;
    online: number;
    offline: number;
    expired: number;
    stopped: number;
    aktif: number;
    isolir: number;
  };
  tickets: { total: number; open: number; inProgress: number; done: number };
  invoices: { total: number; paid: number; unpaid: number; overdue: number };
  finance: {
    month: { income: number; expense: number; profit: number; label: string };
    ytd: { income: number; expense: number; profit: number };
  };
}

function StatItem({
  icon: Icon,
  label,
  value,
  tone,
  hint,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  tone?: string;
  hint?: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon className={cn('size-4 shrink-0', tone ?? 'text-muted-foreground')} />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="tabular text-sm font-semibold">{value}</p>
      </div>
      {hint && <span className="ml-auto text-xs text-muted-foreground">{hint}</span>}
    </div>
  );
}

function StatRow({
  title,
  icon: Icon,
  children,
  loading,
}: {
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
  loading: boolean;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <Icon className="size-4 text-muted-foreground" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">{children}</div>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { activeWilayahId, bootstrap } = useApp();

  const { data, isLoading } = useQuery({
    queryKey: qk.dashboard(activeWilayahId),
    queryFn: async () =>
      (
        await api.get<DashboardStats>('/dashboard', {
          params: { wilayahId: activeWilayahId ?? undefined },
        })
      ).data,
  });

  const c = data?.customers;
  const t = data?.tickets;
  const i = data?.invoices;

  const share = (part?: number) =>
    c?.total && part != null ? `${Math.round((part / c.total) * 100)}%` : undefined;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Dashboard"
        description={bootstrap?.settings.companyName}
        quota="customers"
      />

      <StatRow title="Pelanggan" icon={Users} loading={isLoading}>
        <StatItem icon={Users} label="Total Pelanggan" value={formatNumber(c?.total)} />
        <StatItem
          icon={Wifi}
          label="Online"
          value={formatNumber(c?.online)}
          tone="text-success"
          hint={share(c?.online)}
        />
        <StatItem
          icon={WifiOff}
          label="Offline"
          value={formatNumber(c?.offline)}
          tone="text-muted-foreground"
          hint={share(c?.offline)}
        />
        <StatItem
          icon={Clock}
          label="Expired"
          value={formatNumber(c?.expired)}
          tone="text-warning"
          hint={share(c?.expired)}
        />
        <StatItem
          icon={CircleSlash}
          label="Berhenti"
          value={formatNumber(c?.stopped)}
          tone="text-destructive"
        />
      </StatRow>

      <StatRow title="Tiket Bulan Ini" icon={Ticket} loading={isLoading}>
        <StatItem icon={Ticket} label="Total Tiket" value={formatNumber(t?.total)} />
        <StatItem icon={AlertCircle} label="Baru" value={formatNumber(t?.open)} tone="text-warning" />
        <StatItem icon={Clock} label="Dalam Proses" value={formatNumber(t?.inProgress)} tone="text-primary" />
        <StatItem icon={CheckCircle2} label="Selesai" value={formatNumber(t?.done)} tone="text-success" />
      </StatRow>

      <StatRow title="Tagihan Bulan Ini" icon={Receipt} loading={isLoading}>
        <StatItem icon={Receipt} label="Total Tagihan" value={formatNumber(i?.total)} />
        <StatItem icon={CheckCircle2} label="Sudah Bayar" value={formatNumber(i?.paid)} tone="text-success" />
        <StatItem icon={Clock} label="Belum Bayar" value={formatNumber(i?.unpaid)} tone="text-warning" />
        <StatItem icon={AlertCircle} label="Terlambat" value={formatNumber(i?.overdue)} tone="text-destructive" />
      </StatRow>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Analisis pelanggan</CardTitle>
            <Link to={ROUTES.reports.index} className="text-xs text-primary hover:underline">
              Laporan
            </Link>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-40" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Jumlah</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Aktif</TableCell>
                    <TableCell>{formatNumber(c?.aktif)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Isolir</TableCell>
                    <TableCell>{formatNumber(c?.isolir)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Expired</TableCell>
                    <TableCell>{formatNumber(c?.expired)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Berhenti</TableCell>
                    <TableCell>{formatNumber(c?.stopped)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Total</TableCell>
                    <TableCell className="font-medium">{formatNumber(c?.total)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
              Online/offline menunggu data sesi RADIUS, jadi angkanya masih 0.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Analisis keuangan</CardTitle>
            <Link to={ROUTES.finances.index} className="text-xs text-primary hover:underline">
              Keuangan
            </Link>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-40" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead></TableHead>
                    <TableHead>Bulan ini</TableHead>
                    <TableHead>Year to date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Pendapatan</TableCell>
                    <TableCell>{formatRupiah(data?.finance.month.income)}</TableCell>
                    <TableCell>{formatRupiah(data?.finance.ytd.income)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Pengeluaran</TableCell>
                    <TableCell>{formatRupiah(data?.finance.month.expense)}</TableCell>
                    <TableCell>{formatRupiah(data?.finance.ytd.expense)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Profit</TableCell>
                    <TableCell className="font-medium">{formatRupiah(data?.finance.month.profit)}</TableCell>
                    <TableCell className="font-medium">{formatRupiah(data?.finance.ytd.profit)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
              Angka terisi setelah ada pembayaran tagihan atau transaksi di menu Keuangan.
            </p>
          </CardContent>
        </Card>
      </div>

      <DashboardMapPreview wilayahId={activeWilayahId} />
    </div>
  );
}
