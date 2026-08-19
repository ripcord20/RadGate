import { Controller, Get, Query } from '@nestjs/common';
import { TASK_STATUSES, type Task, type TaskStatus } from '@radgate/shared';
import { TasksService } from './tasks.service';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Get()
  async list(@Query('status') status?: string): Promise<Task[]> {
    const parsed = TASK_STATUSES.includes(status as TaskStatus)
      ? (status as TaskStatus)
      : undefined;

    // Frontend memanggil dengan `status=running` untuk indikator di header. Nilai
    // `running` dari klien mencakup job yang belum diambil worker, jadi keduanya disatukan.
    const rows =
      parsed === 'running' ? await this.tasks.listRunning() : await this.tasks.list(parsed);

    return rows.map((t) => ({
      id: t.id,
      type: t.type,
      status: t.status as TaskStatus,
      progress: t.progress,
      total: t.total,
      error: t.error,
      createdAt: t.createdAt.toISOString(),
      finishedAt: t.finishedAt?.toISOString() ?? null,
    }));
  }
}
