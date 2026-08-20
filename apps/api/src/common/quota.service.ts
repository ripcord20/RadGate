import { ConflictException, Injectable } from '@nestjs/common';
import type { QuotaMetric } from '@radgate/shared';
import { PrismaService } from '../prisma/prisma.service';
import { requireScope } from './request-context';

@Injectable()
export class QuotaService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Diperiksa di backend sebelum operasi pembuatan. Pemeriksaan di frontend hanya
   * menampilkan bar progres dan bisa dilewati siapa pun yang memanggil API langsung.
   */
  async assertRemaining(metric: QuotaMetric): Promise<void> {
    const { used, limit } = await this.current(metric);
    if (limit > 0 && used >= limit) {
      throw new ConflictException({
        statusCode: 409,
        message: `Batas ${metric} tercapai (${limit})`,
        errors: { _: [`QUOTA_EXCEEDED`] },
      });
    }
  }

  async bump(metric: QuotaMetric, delta: number): Promise<void> {
    const scope = requireScope();
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    await this.prisma.subscriptionUsage.upsert({
      where: { tenantId_metric: { tenantId: scope.tenantId, metric } },
      create: {
        tenantId: scope.tenantId,
        metric,
        used: Math.max(0, delta),
        periodStart,
        periodEnd,
      },
      update: { used: { increment: delta } },
    });
  }

  private async current(metric: QuotaMetric): Promise<{ used: number; limit: number }> {
    const scope = requireScope();
    const [usage, subscription] = await Promise.all([
      this.prisma.subscriptionUsage.findUnique({
        where: { tenantId_metric: { tenantId: scope.tenantId, metric } },
      }),
      this.prisma.subscription.findFirst({
        where: { tenantId: scope.tenantId, status: 'aktif' },
        include: { plan: true },
      }),
    ]);

    const limits = (subscription?.plan?.limits ?? {}) as Partial<Record<QuotaMetric, number>>;
    return { used: usage?.used ?? 0, limit: limits[metric] ?? 0 };
  }
}
