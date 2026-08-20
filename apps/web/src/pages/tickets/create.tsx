import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { TicketPriority } from '@radgate/shared';
import { ROUTES, TICKET_PRIORITIES } from '@radgate/shared';
import { api } from '@/lib/api';
import { queryClient } from '@/lib/query';
import { useActiveWilayah, useApp } from '@/providers/app-provider';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input, Textarea } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function TicketCreatePage() {
  const navigate = useNavigate();
  const wilayahId = useActiveWilayah();
  const { can, wilayahOptions } = useApp();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TicketPriority>('sedang');

  const create = useMutation({
    mutationFn: () =>
      api.post('/tickets', {
        title,
        description,
        wilayahId: wilayahId ?? wilayahOptions[0]?.id,
        priority,
        status: 'baru',
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['tickets'] });
      toast.success('Tiket dibuat');
      navigate(ROUTES.tickets.index);
    },
    onError: (e: { message?: string }) => toast.error(e.message ?? 'Gagal'),
  });

  return (
    <div>
      <PageHeader title="Buat Tiket" />
      <Card className="max-w-lg">
        <CardContent className="grid gap-3 pt-4">
          <div>
            <Label required>Judul</Label>
            <Input className="mt-1" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <Label required>Deskripsi</Label>
            <Textarea className="mt-1" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div>
            <Label>Prioritas</Label>
            <select
              className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
              value={priority}
              onChange={(e) => setPriority(e.target.value as TicketPriority)}
            >
              {TICKET_PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          {can('tickets', 'create') && (
            <Button disabled={!title || !description || create.isPending} onClick={() => create.mutate()}>
              Simpan
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
