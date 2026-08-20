import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { TenantSettings } from '@radgate/shared';
import { api } from '@/lib/api';
import { qk } from '@/lib/query';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function SettingsExportPage() {
  const { data } = useQuery({
    queryKey: qk.settings,
    queryFn: async () => (await api.get<TenantSettings>('/settings')).data,
  });

  const download = useMutation({
    mutationFn: async () => {
      const { data: settings } = await api.get<TenantSettings>('/settings');
      const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'radgate-pengaturan.json';
      a.click();
      URL.revokeObjectURL(url);
    },
    onSuccess: () => toast.success('Berkas JSON diunduh'),
    onError: (e: { message?: string }) => toast.error(e.message ?? 'Gagal'),
  });

  return (
    <div>
      <PageHeader
        title="Export Data"
        actions={
          <Button disabled={download.isPending} onClick={() => download.mutate()}>
            Unduh JSON
          </Button>
        }
      />
      <Card className="max-w-lg">
        <CardContent className="space-y-2 pt-4 text-sm">
          <p className="font-medium">{data?.companyName}</p>
          <p className="text-muted-foreground">
            Export saat ini mengunduh pengaturan tenant dari GET /settings sebagai JSON. Data pelanggan dan tagihan
            tidak ikut dalam berkas ini.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
