import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { CustomerStatus } from '@radgate/shared';
import { CUSTOMER_STATUSES, ROUTES } from '@radgate/shared';
import { api } from '@/lib/api';
import { queryClient, qk } from '@/lib/query';
import { useActiveWilayah, useApp } from '@/providers/app-provider';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

interface Template {
  id: string;
  name: string;
}

interface Device {
  id: string;
  name: string;
}

export default function WhatsappBroadcastNewPage() {
  const navigate = useNavigate();
  const wilayahId = useActiveWilayah();
  const { can, wilayahOptions } = useApp();
  const [templateId, setTemplateId] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [status, setStatus] = useState('');

  const templates = useQuery({
    queryKey: qk.whatsapp('templates'),
    queryFn: async () => (await api.get<Template[]>('/whatsapp/templates')).data,
  });
  const devices = useQuery({
    queryKey: qk.whatsapp('devices'),
    queryFn: async () => (await api.get<Device[]>('/whatsapp/devices')).data,
  });

  const create = useMutation({
    mutationFn: () =>
      api.post('/whatsapp/broadcasts', {
        templateId,
        deviceId,
        targetFilter: {
          wilayahId: wilayahId ?? wilayahOptions[0]?.id ?? undefined,
          status: (status || undefined) as CustomerStatus | undefined,
        },
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: qk.whatsapp('broadcasts') });
      toast.success('Broadcast diantrekan');
      navigate(ROUTES.whatsapp.broadcast);
    },
    onError: (e: { message?: string }) => toast.error(e.message ?? 'Gagal'),
  });

  return (
    <div>
      <PageHeader title="Broadcast Baru" quota="whatsapp_messages" />
      <Card className="max-w-lg">
        <CardContent className="grid gap-3 pt-4">
          <div>
            <Label>Template</Label>
            <select
              className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
            >
              <option value="">Pilih template</option>
              {templates.data?.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Perangkat</Label>
            <select
              className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
            >
              <option value="">Pilih perangkat</option>
              {devices.data?.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Filter status pelanggan</Label>
            <select
              className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">Semua</option>
              {CUSTOMER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          {can('whatsapp', 'create') && (
            <Button disabled={!templateId || !deviceId || create.isPending} onClick={() => create.mutate()}>
              Kirim
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
