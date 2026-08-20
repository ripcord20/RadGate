import { Injectable, Logger } from '@nestjs/common';
import type { TaskStatus } from '@radgate/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { requireScope } from '../../common/request-context';

export type TaskType =
  | 'mikrotik.sync'
  | 'whatsapp.broadcast'
  | 'invoice.generate'
  | 'customer.import'
  | 'device.poll'
  | 'report.snapshot'
  | 'hotspot.generate';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Mendaftarkan job dan mengembalikan barisnya. Pemanggil mengembalikan `id` ke frontend,
   * yang lalu memantau progres lewat `GET /tasks`.
   *
   * Baris database dibuat lebih dulu, sebelum job dikirim ke antrean. Urutan ini penting:
   * kalau prosesnya mati di antara keduanya, yang tertinggal adalah job berstatus
   * `pending` yang terlihat dan bisa diulang, bukan pekerjaan yang hilang tanpa jejak.
   */
  async enqueue(type: TaskType, payload: Record<string, unknown>, total = 0) {
    const scope = requireScope();

    const task = await this.prisma.task.create({
      data: {
        tenantId: scope.tenantId,
        type,
        payload: payload as object,
        status: 'pending',
        progress: 0,
        total,
        createdBy: scope.userId,
      },
    });

    this.logger.log(`Job ${type} didaftarkan sebagai ${task.id}`);
    return task;
  }

  async listRunning() {
    const scope = requireScope();
    return this.prisma.task.findMany({
      where: { tenantId: scope.tenantId, status: { in: ['pending', 'running'] } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async list(status?: TaskStatus) {
    const scope = requireScope();
    return this.prisma.task.findMany({
      where: { tenantId: scope.tenantId, ...(status ? { status } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async updateProgress(taskId: string, progress: number, total?: number) {
    await this.prisma.task.update({
      where: { id: taskId },
      data: { status: 'running', progress, ...(total != null ? { total } : {}) },
    });
  }

  async finish(taskId: string, result?: Record<string, unknown>) {
    await this.prisma.task.update({
      where: { id: taskId },
      data: {
        status: 'success',
        result: (result ?? {}) as object,
        finishedAt: new Date(),
        error: null,
      },
    });
  }

  async fail(taskId: string, error: string) {
    await this.prisma.task.update({
      where: { id: taskId },
      data: { status: 'failed', error, finishedAt: new Date() },
    });
  }
}
