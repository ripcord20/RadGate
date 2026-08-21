import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
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
import type { Paginated } from '@radgate/shared';
import { ROUTES } from '@radgate/shared';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '@/lib/api';
import { qk, queryClient } from '@/lib/query';
import { cn, formatNumber, formatRupiah } from '@/lib/utils';
import { useApp } from '@/providers/app-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DashboardMapPreview } from './map-preview';

interface DashboardStats {
  customers: {
    total: number;
    online: number;
    offline: number;
    expired: number;
    stopped: number;
    aktif: number;
    isolir: number;
    newThisMonth: number;
    newYtd: number;
    newLastMonth: number;
  };
  tickets: { total: number; open: number; inProgress: number; done: number };
  invoices: { total: number; paid: number; unpaid: number; overdue: number };
  finance: {
    month: { income: number; expense: number; profit: number; label: string };
    ytd: { income: number; expense: number; profit: number };
    months: { key: string; label: string; income: number; expense: number }[];
  };
  packages: { name: string; count: number }[];
  defaultNas: { id: string; name: string } | null;
}

interface NasRow {
  id: string;
  name: string;
  isDefault: boolean;
}

function MetricChip({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="flex min-w-0 flex-col items-center text-center">
      <Icon className={cn('size-5', tone ?? 'text-muted-foreground')} />
      <p className="mt-1 truncate text-[10px] text-muted-foreground">{label}</p>
      <p className={cn('tabular text-base font-bold', tone ?? 'text-foreground')}>{value}</p>
    </div>
  );
}

function MetricCard({
  title,
  loading,
  children,
}: {
  title: string;
  loading: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold">{title}</h2>
      {loading ? <Skeleton className="h-16" /> : <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">{children}</div>}
    </section>
  );
}

export default function DashboardPage() {
  const { activeWilayahId, bootstrap, can } = useApp();
  const [nasId, setNasId] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: qk.dashboard(activeWilayahId),
    queryFn: async () =>
      (
        await api.get<DashboardStats>('/dashboard', {
          params: { wilayahId: activeWilayahId ?? undefined },
        })
      ).data,
  });

  const nasList = useQuery({
    queryKey: qk.nas(activeWilayahId),
    queryFn: async () =>
      (await api.get<Paginated<NasRow>>('/nas', { params: { wilayahId: activeWilayahId, perPage: 100 } })).data,
    enabled: can('servers', 'view'),
  });

  const setDefault = useMutation({
    mutationFn: (id: string) => api.post(`/nas/${id}/default`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: qk.dashboard(activeWilayahId) });
      await queryClient.invalidateQueries({ queryKey: ['nas'] });
      toast.success('Server default disimpan');
    },
    onError: (e: { message?: string }) => toast.error(e.message ?? 'Gagal'),
  });

  const c = data?.customers;
  const t = data?.tickets;
  const i = data?.invoices;
  const selectedNas = nasId || nasList.data?.data[0]?.id || '';

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
      {bootstrap?.settings.companyName && (
        <p className="-mt-3 text-sm text-muted-foreground">{bootstrap.settings.companyName}</p>
      )}

      <MetricCard title="Pelanggan" loading={isLoading}>
        <MetricChip icon={Users} label="Total" value={formatNumber(c?.total)} tone="text-primary" />
        <MetricChip icon={Wifi} label="Online" value={formatNumber(c?.online)} tone="text-success" />
        <MetricChip icon={WifiOff} label="Offline" value={formatNumber(c?.offline)} />
        <MetricChip icon={Clock} label="Expired" value={formatNumber(c?.expired)} tone="text-warning" />
        <MetricChip icon={CircleSlash} label="Berhenti" value={formatNumber(c?.stopped)} tone="text-destructive" />
      </MetricCard>

      <MetricCard title="Tiket Bulan ini" loading={isLoading}>
        <MetricChip icon={Ticket} label="Total" value={formatNumber(t?.total)} tone="text-primary" />
        <MetricChip icon={AlertCircle} label="Baru" value={formatNumber(t?.open)} tone="text-warning" />
        <MetricChip icon={Clock} label="Proses" value={formatNumber(t?.inProgress)} tone="text-primary" />
        <MetricChip icon={CheckCircle2} label="Selesai" value={formatNumber(t?.done)} tone="text-success" />
      </MetricCard>

      <MetricCard title="Tagihan Bulan ini" loading={isLoading}>
        <MetricChip icon={Receipt} label="Tagihan" value={formatNumber(i?.total)} tone="text-primary" />
        <MetricChip icon={ArrowUp} label="Lunas" value={formatNumber(i?.paid)} tone="text-success" />
        <MetricChip icon={ArrowDown} label="Belum" value={formatNumber(i?.unpaid)} tone="text-warning" />
        <MetricChip icon={AlertCircle} label="Terlambat" value={formatNumber(i?.overdue)} tone="text-destructive" />
      </MetricCard>

      {data && !data.defaultNas && (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-amber-700">
            <AlertCircle className="size-4" /> Server Default Belum Dipilih
          </h2>
          <p className="mt-2 text-sm">
            Untuk menampilkan monitoring jaringan realtime, pilih server yang akan dijadikan default.
            Klik <span className="font-medium">Jadikan Default</span> setelah memilih NAS.
          </p>
          {can('servers', 'update') && (nasList.data?.data.length ?? 0) > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <select
                className="h-10 min-w-40 flex-1 rounded-xl border border-amber-200 bg-white px-3 text-sm"
                value={selectedNas}
                onChange={(e) => setNasId(e.target.value)}
              >
                {nasList.data?.data.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.name}
                  </option>
                ))}
              </select>
              <Button
                className="rounded-xl"
                disabled={!selectedNas || setDefault.isPending}
                onClick={() => setDefault.mutate(selectedNas)}
              >
                Jadikan Default
              </Button>
            </div>
          ) : (
            <Button asChild variant="outline" className="mt-3 rounded-xl" size="sm">
              <Link to={ROUTES.servers.nas}>Buka NAS</Link>
            </Button>
          )}
        </section>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Analisis Pelanggan</h2>
            <Link to={ROUTES.reports.index} className="text-xs text-primary hover:underline">
              Lihat Semua
            </Link>
          </div>
          {isLoading ? (
            <Skeleton className="h-32" />
          ) : (
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Total pelanggan aktif</dt>
                <dd className="tabular font-semibold">{formatNumber(c?.aktif)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Pelanggan baru YTD</dt>
                <dd className="tabular font-semibold">{formatNumber(c?.newYtd)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Pelanggan baru bulan ini</dt>
                <dd className="tabular font-semibold">{formatNumber(c?.newThisMonth)}</dd>
              </div>
              <p className="text-xs text-muted-foreground">vs bulan lalu: {formatNumber(c?.newLastMonth)}</p>
            </dl>
          )}
        </section>
        <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Analisis Keuangan</h2>
            <Link to={ROUTES.finances.index} className="text-xs text-primary hover:underline">
              Lihat Semua
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium">Bulan ini</p>
              <p className="text-xs text-muted-foreground">{data?.finance.month.label}</p>
              <p className="mt-2 text-xs text-muted-foreground">Total Pendapatan</p>
              <p className="text-lg font-bold tabular text-success">{formatRupiah(data?.finance.month.income)}</p>
              <p className="mt-2 text-xs text-muted-foreground">Total Pengeluaran</p>
              <p className="text-lg font-bold tabular text-destructive">{formatRupiah(data?.finance.month.expense)}</p>
              <p className="mt-2 text-xs text-muted-foreground">Profit bulan ini</p>
              <p className="text-lg font-bold tabular">{formatRupiah(data?.finance.month.profit)}</p>
            </div>
            <div>
              <p className="text-xs font-medium">Year to Date</p>
              <p className="text-xs text-muted-foreground">Dari awal tahun sampai hari ini</p>
              <p className="mt-2 text-xs text-muted-foreground">Total Pendapatan</p>
              <p className="text-lg font-bold tabular text-success">{formatRupiah(data?.finance.ytd.income)}</p>
              <p className="mt-2 text-xs text-muted-foreground">Total Pengeluaran</p>
              <p className="text-lg font-bold tabular text-destructive">{formatRupiah(data?.finance.ytd.expense)}</p>
              <p className="mt-2 text-xs text-muted-foreground">Total Profit</p>
              <p className="text-lg font-bold tabular">{formatRupiah(data?.finance.ytd.profit)}</p>
            </div>
          </div>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="rounded-2xl lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle>Pendapatan dan pengeluaran 12 bulan</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            {isLoading ? (
              <Skeleton className="h-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.finance.months ?? []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" fontSize={12} />
                  <YAxis fontSize={12} tickFormatter={(v: number) => `${Math.round(v / 1000)}rb`} />
                  <Tooltip formatter={(value) => formatRupiah(Number(value ?? 0))} />
                  <Legend />
                  <Bar dataKey="income" name="Pendapatan" fill="var(--color-primary, #2563eb)" radius={2} />
                  <Bar dataKey="expense" name="Pengeluaran" fill="var(--color-destructive, #dc2626)" radius={2} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle>Distribusi Paket Internet</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-40" />
            ) : (data?.packages.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada pelanggan.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Paket</TableHead>
                    <TableHead>Jumlah</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.packages.map((pkg) => (
                    <TableRow key={pkg.name}>
                      <TableCell>{pkg.name}</TableCell>
                      <TableCell>{formatNumber(pkg.count)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <DashboardMapPreview wilayahId={activeWilayahId} />
    </div>
  );
}
