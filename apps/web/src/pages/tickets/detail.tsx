import { useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { queryClient, qk } from '@/lib/query';
import { PageHeader } from '@/components/page-header';
import { Badge, TICKET_STATUS_VARIANT } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useApp } from '@/providers/app-provider';
import { useState } from 'react';
import type { TicketStatus } from '@radgate/shared';

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { can } = useApp();
  const [comment, setComment] = useState('');
  const { data, isLoading } = useQuery({
    queryKey: [...qk.tickets(null), id],
    queryFn: async () => (await api.get(`/tickets/${id}`)).data,
    enabled: !!id,
  });

  const patch = useMutation({
    mutationFn: (status: TicketStatus) => api.patch(`/tickets/${id}`, { status }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['tickets'] });
      toast.success('Status diubah');
    },
  });

  const addComment = useMutation({
    mutationFn: () => api.post(`/tickets/${id}/comments`, { comment }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['tickets'] });
      setComment('');
    },
    onError: (e: { message?: string }) => toast.error(e.message ?? 'Gagal'),
  });

  if (isLoading || !data) return <Skeleton className="h-64" />;

  return (
    <div className="space-y-4">
      <PageHeader
        title={data.ticketNumber}
        description={data.title}
        actions={
          can('tickets', 'update') ? (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => patch.mutate('proses')}>
                Proses
              </Button>
              <Button size="sm" onClick={() => patch.mutate('selesai')}>
                Selesai
              </Button>
            </div>
          ) : null
        }
      />
      <Card>
        <CardContent className="space-y-2 pt-4 text-sm">
          <Badge variant={TICKET_STATUS_VARIANT[data.status as TicketStatus]}>{data.status}</Badge>
          <p>{data.description}</p>
        </CardContent>
      </Card>
      <div className="space-y-2">
        {(data.comments ?? []).map((c: { id: string; comment: string; createdAt: string }) => (
          <p key={c.id} className="rounded-md border border-border p-2 text-sm">
            {c.comment}
          </p>
        ))}
      </div>
      {can('tickets', 'update') && (
        <div className="flex gap-2">
          <Input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Komentar" />
          <Button disabled={!comment || addComment.isPending} onClick={() => addComment.mutate()}>
            Kirim
          </Button>
        </div>
      )}
    </div>
  );
}
