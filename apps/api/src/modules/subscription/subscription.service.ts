import { Injectable, NotFoundException } from '@nestjs/common';
import type { SubscribeInput } from '@radgate/shared';
import { QUOTA_METRICS, type QuotaMetric } from '@radgate/shared';
import { requireScope } from '../../common/request-context';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SubscriptionService {
  constructor(private readonly prisma: PrismaService) {}

  async overview() {
    const tenantId = requireScope().tenantId;
    const subscription = await this.prisma.subscription.findFirst({
      where: { tenantId },
      include: { plan: true },
    });
    const usage = await this.limits();
    return { subscription, usage };
  }

  async status() {
    const row = await this.prisma.subscription.findFirst({
      where: { tenantId: requireScope().tenantId },
      include: { plan: true },
    });
    if (!row) throw new NotFoundException('Langganan tidak ditemukan');
    return {
      status: row.status,
      expiresAt: row.expiresAt,
      planName: row.plan.name,
      billingCycle: row.billingCycle,
    };
  }

  plans() {
    return this.prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { priceMonthly: 'asc' },
    });
  }

  async limits() {
    const tenantId = requireScope().tenantId;
    const [usageRows, subscription] = await Promise.all([
      this.prisma.subscriptionUsage.findMany({ where: { tenantId } }),
      this.prisma.subscription.findFirst({
        where: { tenantId, status: 'aktif' },
        include: { plan: true },
      }),
    ]);
    const used = new Map(usageRows.map((r) => [r.metric, r.used]));
    const limits = (subscription?.plan?.limits ?? {}) as Partial<Record<QuotaMetric, number>>;
    return QUOTA_METRICS.map((metric) => ({
      metric,
      used: used.get(metric) ?? 0,
      limit: limits[metric] ?? 0,
    }));
  }

  bills() {
    return this.prisma.subscriptionInvoice.findMany({
      where: { tenantId: requireScope().tenantId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  bill(id: string) {
    return this.prisma.subscriptionInvoice.findFirst({
      where: { id, tenantId: requireScope().tenantId },
    });
  }

  async subscribe(input: SubscribeInput) {
    const tenantId = requireScope().tenantId;
    const plan = await this.prisma.subscriptionPlan.findFirst({
      where: { id: input.planId, isActive: true },
    });
    if (!plan) throw new NotFoundException('Paket langganan tidak ditemukan');

    const now = new Date();
    const expiresAt = new Date(now);
    if (input.billingCycle === 'yearly') expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    else expiresAt.setMonth(expiresAt.getMonth() + 1);

    const amount = input.billingCycle === 'yearly' ? plan.priceYearly : plan.priceMonthly;

    const existing = await this.prisma.subscription.findFirst({ where: { tenantId } });
    const subscription = existing
      ? await this.prisma.subscription.update({
          where: { id: existing.id },
          data: {
            planId: plan.id,
            status: 'aktif',
            startedAt: now,
            expiresAt,
            billingCycle: input.billingCycle,
          },
        })
      : await this.prisma.subscription.create({
          data: {
            tenantId,
            planId: plan.id,
            status: 'aktif',
            startedAt: now,
            expiresAt,
            billingCycle: input.billingCycle,
          },
        });

    const count = await this.prisma.subscriptionInvoice.count({ where: { tenantId } });
    const invoice = await this.prisma.subscriptionInvoice.create({
      data: {
        tenantId,
        subscriptionId: subscription.id,
        invoiceNumber: `SUB-${String(count + 1).padStart(4, '0')}`,
        amount,
        status: 'unpaid',
        dueDate: expiresAt,
      },
    });

    return { subscription, invoice };
  }
}
