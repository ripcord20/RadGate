import { useQuery } from '@tanstack/react-query';
import type { Paginated } from '@radgate/shared';
import { api } from '@/lib/api';
import { qk } from '@/lib/query';
import { formatRupiah, formatSpeed } from '@/lib/utils';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PackageRow {
  id: string;
  name: string;
  speedUp: number;
  speedDown: number;
  price: number;
  isActive: boolean;
  customerCount: number;
}

export default function CustomerLayananPage() {
  const { data } = useQuery({
    queryKey: qk.packages(null),
    queryFn: async () =>
      (await api.get<Paginated<PackageRow>>('/internet-packages', { params: { perPage: 100 } })).data,
  });

  return (
    <div className="space-y-4">
      <PageHeader title="Layanan" description="Daftar paket internet yang bisa dipasangkan ke pelanggan." />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data?.data.map((p) => (
          <Card key={p.id}>
            <CardHeader>
              <CardTitle>{p.name}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>
                {formatSpeed(p.speedDown)} / {formatSpeed(p.speedUp)}
              </p>
              <p className="font-medium text-foreground">{formatRupiah(p.price)}</p>
              <Badge variant={p.isActive ? 'success' : 'neutral'}>{p.isActive ? 'aktif' : 'nonaktif'}</Badge>
              <p>{p.customerCount} pelanggan</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
