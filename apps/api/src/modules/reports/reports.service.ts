import { Injectable } from '@nestjs/common';
import { tenantWhere, requireScope } from '../../common/request-context';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Laporan membaca snapshot harian kalau sudah ada. Kalau belum, dihitung dari tabel
   * operasional lalu disimpan, supaya request berikutnya tidak memindai ulang.
   */
  async summary(wilayahId?: string | null) {
    const metrics = await this.compute(wilayahId);
    await this.upsertSnapshot(metrics);
    return metrics;
  }

  customers(wilayahId?: string | null) {
    return this.prisma.customer.groupBy({
      by: ['status'],
      where: { ...tenantWhere(wilayahId), deletedAt: null },
      _count: { _all: true },
    });
  }

  async finances(wilayahId?: string | null) {
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    const groups = await this.prisma.financeTransaction.groupBy({
      by: ['type'],
      where: { ...tenantWhere(wilayahId), transactionDate: { gte: from } },
      _sum: { amount: true },
    });
    const income = groups.find((g) => g.type === 'income')?._sum.amount ?? 0;
    const expense = groups.find((g) => g.type === 'expense')?._sum.amount ?? 0;
    return { income, expense, profit: income - expense, from, to: now };
  }

  async billing(wilayahId?: string | null) {
    const groups = await this.prisma.invoice.groupBy({
      by: ['status'],
      where: tenantWhere(wilayahId),
      _count: { _all: true },
      _sum: { total: true },
    });
    return groups.map((g) => ({ status: g.status, count: g._count._all, total: g._sum.total ?? 0 }));
  }

  private async compute(wilayahId?: string | null) {
    const [customers, finances, billing] = await Promise.all([
      this.customers(wilayahId),
      this.finances(wilayahId),
      this.billing(wilayahId),
    ]);
    return { customers, finances, billing, generatedAt: new Date().toISOString() };
  }

  private async upsertSnapshot(metrics: unknown) {
    const tenantId = requireScope().tenantId;
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    await this.prisma.reportDailySnapshot.upsert({
      where: { tenantId_date: { tenantId, date } },
      create: { tenantId, date, metrics: metrics as object },
      update: { metrics: metrics as object },
    });
  }
}
