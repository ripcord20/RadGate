import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import type { CustomerStatus, Paginated } from '@radgate/shared';
import { ROUTES } from '@radgate/shared';
import { api } from '@/lib/api';
import { qk } from '@/lib/query';
import { formatPhone } from '@/lib/utils';
import { useActiveWilayah, useApp } from '@/providers/app-provider';
import { PageHeader } from '@/components/page-header';
import { FilterBar, filterControlClass } from '@/components/filter-bar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge, CUSTOMER_STATUS_VARIANT } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableEmpty, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface CustomerRow {
  id: string;
  customerCode: string;
  name: string;
  phone: string;
  status: CustomerStatus;
  pppoeUsername: string;
  ipAddress: string | null;
  address: string;
  dueDay: number;
  installationDate: string;
  wilayah: { name: string; code: string };
  package: { name: string; price: number };
  odp: { name: string; code: string } | null;
}

interface PackageOption {
  id: string;
  name: string;
}

export default function CustomersPage() {
  const wilayahId = useActiveWilayah();
  const { can } = useApp();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [packageId, setPackageId] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: qk.customers(wilayahId, { search, status, packageId }),
    queryFn: async () =>
      (
        await api.get<Paginated<CustomerRow>>('/customers', {
          params: {
            wilayahId,
            search: search || undefined,
            status: status || undefined,
            packageId: packageId || undefined,
            perPage: 50,
          },
        })
      ).data,
  });

  const summary = useQuery({
    queryKey: [...qk.customers(wilayahId), 'summary'],
    queryFn: async () => (await api.get('/customers/summary', { params: { wilayahId } })).data,
  });

  const packages = useQuery({
    queryKey: qk.packages(wilayahId),
    queryFn: async () =>
      (await api.get<Paginated<PackageOption>>('/internet-packages', { params: { perPage: 100 } })).data,
  });

  return (
    <div>
      <PageHeader
        title="Pelanggan"
        quota="customers"
        description={
          summary.data
            ? `Total ${summary.data.total} · Aktif ${summary.data.aktif} · Expired ${summary.data.expired} · Berhenti ${summary.data.berhenti}`
            : undefined
        }
        actions={
          can('customers', 'create') ? (
            <Button asChild>
              <Link to={ROUTES.customers.add}>
                <Plus /> Tambah
              </Link>
            </Button>
          ) : null
        }
      />

      <FilterBar
        onReset={() => {
          setSearch('');
          setStatus('');
          setPackageId('');
        }}
      >
        <Input
          placeholder="Cari nama, alamat, username..."
          className="max-w-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className={filterControlClass} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Semua Status</option>
          <option value="aktif">Aktif</option>
          <option value="expired">Expired</option>
          <option value="berhenti">Berhenti</option>
          <option value="isolir">Isolir</option>
        </select>
        <select
          className={filterControlClass}
          value={packageId}
          onChange={(e) => setPackageId(e.target.value)}
        >
          <option value="">Semua Paket</option>
          {packages.data?.data.map((pkg) => (
            <option key={pkg.id} value={pkg.id}>
              {pkg.name}
            </option>
          ))}
        </select>
      </FilterBar>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Pelanggan</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Paket & IP</TableHead>
            <TableHead>ODP</TableHead>
            <TableHead>Alamat</TableHead>
            <TableHead>Telepon</TableHead>
            <TableHead>Jatuh Tempo</TableHead>
            <TableHead>Instalasi</TableHead>
            <TableHead>Wilayah</TableHead>
            <TableHead>Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {!isLoading && (data?.data.length ?? 0) === 0 && (
            <TableEmpty colSpan={10} message="Belum ada pelanggan" />
          )}
          {data?.data.map((row) => (
            <TableRow key={row.id}>
              <TableCell>
                <div className="font-medium">{row.name}</div>
                <div className="text-xs text-muted-foreground">
                  {row.customerCode} · {row.pppoeUsername}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={CUSTOMER_STATUS_VARIANT[row.status]}>{row.status}</Badge>
              </TableCell>
              <TableCell>
                <div>{row.package.name}</div>
                <div className="text-xs text-muted-foreground">{row.ipAddress ?? 'DHCP'}</div>
              </TableCell>
              <TableCell>{row.odp?.code ?? '-'}</TableCell>
              <TableCell className="max-w-48 truncate">{row.address}</TableCell>
              <TableCell>{formatPhone(row.phone)}</TableCell>
              <TableCell>Tanggal {row.dueDay}</TableCell>
              <TableCell>
                {row.installationDate
                  ? new Date(row.installationDate).toLocaleDateString('id-ID')
                  : '-'}
              </TableCell>
              <TableCell>{row.wilayah.code}</TableCell>
              <TableCell className="space-x-2 whitespace-nowrap">
                <Link className="text-sm text-primary hover:underline" to={`/customers/detail/${row.id}`}>
                  Detail
                </Link>
                {can('customers', 'update') && (
                  <Link className="text-sm text-primary hover:underline" to={`/customers/edit/${row.id}`}>
                    Edit
                  </Link>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
