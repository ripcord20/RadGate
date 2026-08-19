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

interface DashboardStats {
  customers: { total: number; online: number; offline: number; expired: number; stopped: number };
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

function MoneyCard({
  title,
  subtitle,
  income,
  expense,
  profit,
  loading,
}: {
  title: string;
  subtitle: string;
  income?: number;
  expense?: number;
  profit?: number;
  loading: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </CardHeader>
      <CardContent className="space-y-2">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14" />)
        ) : (
          <>
            <div className="rounded-md bg-success/10 p-3">
              <p className="text-xs text-muted-foreground">Total Pendapatan</p>
              <p className="tabular text-base font-semibold text-success">{formatRupiah(income)}</p>
            </div>
            <div className="rounded-md bg-destructive/10 p-3">
              <p className="text-xs text-muted-foreground">Total Pengeluaran</p>
              <p className="tabular text-base font-semibold text-destructive">
                {formatRupiah(expense)}
              </p>
            </div>
            <div className="rounded-md bg-primary/10 p-3">
              <p className="text-xs text-muted-foreground">Profit</p>
              <p className="tabular text-base font-semibold text-primary">{formatRupiah(profit)}</p>
            </div>
          </>
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
        <MoneyCard
          title="Bulan Ini"
          subtitle={data?.finance.month.label ?? '-'}
          income={data?.finance.month.income}
          expense={data?.finance.month.expense}
          profit={data?.finance.month.profit}
          loading={isLoading}
        />
        <MoneyCard
          title="Year to Date"
          subtitle="Dari awal tahun sampai hari ini"
          income={data?.finance.ytd.income}
          expense={data?.finance.ytd.expense}
          profit={data?.finance.ytd.profit}
          loading={isLoading}
        />
      </div>
    </div>
  );
}
