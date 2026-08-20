import { useQuery } from '@tanstack/react-query';
import type { TenantSettings } from '@radgate/shared';
import { api } from '@/lib/api';
import { qk } from '@/lib/query';
import { formatPhone } from '@/lib/utils';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function CustomerAppPage() {
  const { data } = useQuery({
    queryKey: qk.settings,
    queryFn: async () => (await api.get<TenantSettings>('/settings')).data,
  });

  return (
    <div>
      <PageHeader
        title="Aplikasi Pelanggan"
        description="Branding aplikasi mobile pelanggan memakai nama perusahaan dari pengaturan."
      />
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>{data?.companyName ?? 'RadGate'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm text-muted-foreground">
          <p>{data?.address ?? 'Alamat belum diisi'}</p>
          <p>{formatPhone(data?.phone)}</p>
          <p>Zona waktu: {data?.timezone ?? 'Asia/Jakarta'}</p>
        </CardContent>
      </Card>
    </div>
  );
}
