import {
  Injectable,
  Logger,
  type OnApplicationBootstrap,
  type OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue, Worker, type Job } from 'bullmq';
import IORedis, { type Redis } from 'ioredis';
import { runWithScope, type RequestScope } from '../../common/request-context';
import type { TaskType } from './tasks.service';

export interface JobData {
  taskId: string;
  type: TaskType;
  scope: RequestScope;
  payload: Record<string, unknown>;
}

export type JobHandler = (job: JobData) => Promise<void>;

const QUEUE_NAME = 'radgate-jobs';

/**
 * Antrean Redis. HTTP hanya mendaftarkan baris `tasks` lalu mendorong job ke sini;
 * pekerja yang mengerjakannya berjalan di proses yang sama pada pengembangan, dan
 * bisa dipisah ke proses tersendiri nanti tanpa mengubah pemanggil.
 */
@Injectable()
export class QueueService implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(QueueService.name);
  private readonly handlers = new Map<TaskType, JobHandler>();
  private connection: Redis | null = null;
  private queue: Queue<JobData> | null = null;
  private worker: Worker<JobData> | null = null;
  private inline = true;

  constructor(private readonly config: ConfigService) {}

  register(type: TaskType, handler: JobHandler) {
    this.handlers.set(type, handler);
  }

  async onApplicationBootstrap() {
    const url = this.config.get<string>('REDIS_URL') ?? 'redis://127.0.0.1:6379';
    try {
      this.connection = new IORedis(url, {
        maxRetriesPerRequest: null,
        enableReadyCheck: true,
        connectTimeout: 3_000,
      });
      await this.connection.ping();
      this.queue = new Queue<JobData>(QUEUE_NAME, { connection: this.connection });
      this.worker = new Worker<JobData>(QUEUE_NAME, (job) => this.execute(job), {
        connection: this.connection.duplicate(),
        concurrency: 2,
      });
      this.worker.on('failed', (job, err) => {
        this.logger.error(`Job ${job?.id} gagal: ${err.message}`);
      });
      this.inline = false;
      this.logger.log('Antrean BullMQ terhubung ke Redis');
    } catch (error) {
      this.logger.warn(
        `Redis tidak tersedia, job dijalankan sebaris di proses API (${error instanceof Error ? error.message : 'gagal'})`,
      );
      this.inline = true;
      await this.connection?.quit().catch(() => undefined);
      this.connection = null;
    }
  }

  async onModuleDestroy() {
    await this.worker?.close();
    await this.queue?.close();
    await this.connection?.quit().catch(() => undefined);
  }

  async dispatch(data: JobData) {
    if (this.inline || !this.queue) {
      setImmediate(() => {
        void runWithScope(data.scope, () => this.runHandler(data));
      });
      return;
    }
    await this.queue.add(data.type, data, { removeOnComplete: 100, removeOnFail: 50 });
  }

  private async execute(job: Job<JobData>) {
    await runWithScope(job.data.scope, () => this.runHandler(job.data));
  }

  private async runHandler(data: JobData) {
    const handler = this.handlers.get(data.type);
    if (!handler) {
      throw new Error(`Tidak ada pekerja untuk jenis job ${data.type}`);
    }
    await handler(data);
  }
}
