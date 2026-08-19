import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import type { Task } from '@radgate/shared';
import { api } from '@/lib/api';
import { qk } from '@/lib/query';
import { useApp } from '@/providers/app-provider';

/**
 * Sinkronisasi Mikrotik, broadcast WhatsApp, generate tagihan, dan import Excel berjalan
 * sebagai job latar belakang. Indikator ini memberi tahu bahwa ada pekerjaan berjalan
 * tanpa mengunci layar, dan polling hanya aktif selama masih ada job.
 */
export function TaskIndicator() {
  const { isAuthenticated } = useApp();

  const { data: tasks } = useQuery({
    queryKey: qk.tasks,
    queryFn: async () => (await api.get<Task[]>('/tasks', { params: { status: 'running' } })).data,
    enabled: isAuthenticated,
    refetchInterval: (query) => ((query.state.data?.length ?? 0) > 0 ? 3_000 : 20_000),
  });

  if (!tasks?.length) return null;

  const total = tasks.reduce((sum, t) => sum + t.total, 0);
  const done = tasks.reduce((sum, t) => sum + t.progress, 0);
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <span className="flex h-9 items-center gap-2 rounded-md border border-border bg-background px-3 text-xs">
      <Loader2 className="size-3.5 animate-spin text-primary" />
      <span className="text-muted-foreground">
        {tasks.length} proses berjalan
        {total > 0 && <span className="tabular ml-1 font-medium text-foreground">{percent}%</span>}
      </span>
    </span>
  );
}
