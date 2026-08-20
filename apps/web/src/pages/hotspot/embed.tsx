import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { Paginated } from '@radgate/shared';
import { api } from '@/lib/api';
import { qk } from '@/lib/query';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';

interface VoucherRow {
  id: string;
  code: string;
  status: string;
  profile: { name: string };
}

export default function HotspotEmbedPage() {
  const { id } = useParams<{ id: string }>();
  const { data } = useQuery({
    queryKey: [...qk.hotspot(null), 'embed', id],
    queryFn: async () =>
      (await api.get<Paginated<VoucherRow>>('/hotspot/vouchers', { params: { perPage: 100 } })).data,
    enabled: !!id,
  });
  const voucher = data?.data.find((v) => v.id === id);

  return (
    <div>
      <PageHeader
        title="Halaman Login Hotspot"
        description="Pratinjau captive portal. Kode voucher ditampilkan; kata sandi tidak pernah dikirim ke layar ini."
      />
      <Card className="mx-auto max-w-sm">
        <CardContent className="space-y-3 pt-4 text-center">
          <p className="text-sm text-muted-foreground">Masuk Hotspot</p>
          <p className="font-mono text-lg font-semibold">{voucher?.code ?? id}</p>
          <p className="text-xs text-muted-foreground">
            {voucher ? `${voucher.profile.name} · ${voucher.status}` : 'Voucher tidak ada di halaman daftar saat ini'}
          </p>
          <p className="text-xs text-muted-foreground">ID: {id}</p>
        </CardContent>
      </Card>
    </div>
  );
}
