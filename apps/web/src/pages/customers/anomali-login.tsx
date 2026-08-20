import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { qk } from '@/lib/query';
import { useActiveWilayah } from '@/providers/app-provider';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableEmpty, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Anomaly {
  id: string;
  type: string;
  detail: unknown;
  detectedAt: string;
  isResolved: boolean;
  customer: { id: string; name: string; customerCode: string };
}

export default function AnomaliLoginPage() {
  const wilayahId = useActiveWilayah();
  const { data } = useQuery({
    queryKey: [...qk.customers(wilayahId), 'anomalies'],
    queryFn: async () =>
      (await api.get<Anomaly[]>('/customers/anomalies', { params: { wilayahId } })).data,
  });

  return (
    <div>
      <PageHeader
        title="Anomali Login"
        description="Deteksi pemakaian satu akun PPPoE dari beberapa lokasi atau perangkat."
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Pelanggan</TableHead>
            <TableHead>Jenis anomali</TableHead>
            <TableHead>Detail</TableHead>
            <TableHead>Terdeteksi</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(data?.length ?? 0) === 0 && <TableEmpty colSpan={5} />}
          {data?.map((row) => (
            <TableRow key={row.id}>
              <TableCell>
                <div className="font-medium">{row.customer.name}</div>
                <div className="text-xs text-muted-foreground">{row.customer.customerCode}</div>
              </TableCell>
              <TableCell>{row.type}</TableCell>
              <TableCell className="max-w-md truncate text-xs text-muted-foreground">
                {row.detail ? JSON.stringify(row.detail) : '-'}
              </TableCell>
              <TableCell>{new Date(row.detectedAt).toLocaleString('id-ID')}</TableCell>
              <TableCell>
                <Badge variant={row.isResolved ? 'success' : 'warning'}>
                  {row.isResolved ? 'selesai' : 'terbuka'}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
