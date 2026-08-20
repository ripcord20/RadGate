import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { SettingsPatchInput } from '@radgate/shared';
import { api } from '@/lib/api';
import { queryClient, qk } from '@/lib/query';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApp } from '@/providers/app-provider';

export default function SettingsPage() {
  const { can, refresh } = useApp();
  const { data } = useQuery({
    queryKey: qk.settings,
    queryFn: async () => (await api.get('/settings')).data,
  });
  const { register, handleSubmit, reset } = useForm<SettingsPatchInput>();

  useEffect(() => {
    if (data) reset(data);
  }, [data, reset]);

  const save = useMutation({
    mutationFn: (values: SettingsPatchInput) => api.patch('/settings', values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: qk.settings });
      await refresh();
      toast.success('Pengaturan disimpan');
    },
    onError: (e: { message?: string }) => toast.error(e.message ?? 'Gagal'),
  });

  return (
    <div>
      <PageHeader title="Pengaturan Aplikasi" />
      <Card>
        <CardHeader>
          <CardTitle>Informasi Perusahaan</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid max-w-lg gap-3" onSubmit={handleSubmit((v) => save.mutate(v))}>
            <div>
              <Label>Nama perusahaan</Label>
              <Input {...register('companyName')} />
            </div>
            <div>
              <Label>Alamat</Label>
              <Input {...register('address')} />
            </div>
            <div>
              <Label>Telepon</Label>
              <Input {...register('phone')} />
            </div>
            <div>
              <Label>Pajak (%)</Label>
              <Input type="number" {...register('taxPercent', { valueAsNumber: true })} />
            </div>
            {can('settings', 'update') && (
              <Button type="submit" disabled={save.isPending}>
                Simpan Pengaturan
              </Button>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
