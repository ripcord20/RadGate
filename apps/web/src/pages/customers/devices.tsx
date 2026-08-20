import { useQuery } from '@tanstack/react-query';
import type { Paginated } from '@radgate/shared';
import { api } from '@/lib/api';
import { qk } from '@/lib/query';
import { useActiveWilayah } from '@/providers/app-provider';
import { PageHeader } from '@/components/page-header';
import { Table, TableBody, TableCell, TableEmpty, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface CustomerRow {
  id: string;
  name: string;
  customerCode: string;
  pppoeUsername: string;
  ipAddress: string | null;
  package: { name: string };
}

export default function CustomerDevicesPage() {
  const wilayahId = useActiveWilayah();
  const { data } = useQuery({
    queryKey: qk.devices(wilayahId),
    queryFn: async () =>
      (await api.get<Paginated<CustomerRow>>('/customers', { params: { wilayahId, perPage: 50 } })).data,
  });

  return (
    <div>
      <PageHeader
        title="Devices"
        description="Telemetri ONT lewat TR-069/ACS menyusul. Saat ini menampilkan nama pelanggan dan alamat IP dari data pelanggan."
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Pelanggan</TableHead>
            <TableHead>Username</TableHead>
            <TableHead>IP</TableHead>
            <TableHead>Layanan</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(data?.data.length ?? 0) === 0 && <TableEmpty colSpan={4} />}
          {data?.data.map((row) => (
            <TableRow key={row.id}>
              <TableCell>
                <div className="font-medium">{row.name}</div>
                <div className="text-xs text-muted-foreground">{row.customerCode}</div>
              </TableCell>
              <TableCell>{row.pppoeUsername}</TableCell>
              <TableCell>{row.ipAddress ?? 'DHCP'}</TableCell>
              <TableCell>{row.package.name}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
