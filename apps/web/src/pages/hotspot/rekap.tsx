import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { qk } from '@/lib/query';
import { useActiveWilayah } from '@/providers/app-provider';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';

interface Usage {
  total: number;
  unused: number;
  used: number;
  expired: number;
}

export default function HotspotRekapPage() {
  const wilayahId = useActiveWilayah();
  const { data } = useQuery({
    queryKey: [...qk.hotspot(wilayahId), 'usage'],
    queryFn: async () => (await api.get<Usage>('/hotspot/usage', { params: { wilayahId } })).data,
  });

  return (
    <div>
      <PageHeader title="Rekap Hotspot" description="Penjualan voucher dan status pemakaian per periode." />
      <div className="grid gap-3 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="font-semibold">{data?.total ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Belum dipakai</p>
            <p className="font-semibold">{data?.unused ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Dipakai</p>
            <p className="font-semibold">{data?.used ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Kedaluwarsa</p>
            <p className="font-semibold">{data?.expired ?? 0}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
