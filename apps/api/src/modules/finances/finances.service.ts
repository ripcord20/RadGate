import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { FinanceCategoryInput, FinanceTransactionInput } from '@radgate/shared';
import { paginated, type ListQuery } from '../../common/pagination';
import { requireScope, tenantWhere } from '../../common/request-context';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FinancesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListQuery) {
    const where: Prisma.FinanceTransactionWhereInput = {
      ...tenantWhere(query.wilayahId),
      ...(query.status === 'income' || query.status === 'expense' ? { type: query.status } : {}),
      ...(query.search ? { description: { contains: query.search, mode: 'insensitive' as const } } : {}),
    };
    const [total, data] = await this.prisma.$transaction([
      this.prisma.financeTransaction.count({ where }),
      this.prisma.financeTransaction.findMany({
        where,
        include: { category: true, wilayah: { select: { id: true, name: true } } },
        orderBy: { transactionDate: query.sortDir },
        skip: (query.page - 1) * query.perPage,
        take: query.perPage,
      }),
    ]);
    return paginated(data, total, query);
  }

  async summary(wilayahId?: string | null) {
    const base = tenantWhere(wilayahId);
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    const groups = await this.prisma.financeTransaction.groupBy({
      by: ['type'],
      where: { ...base, transactionDate: { gte: from } },
      _sum: { amount: true },
    });
    const income = groups.find((g) => g.type === 'income')?._sum.amount ?? 0;
    const expense = groups.find((g) => g.type === 'expense')?._sum.amount ?? 0;
    return { income, expense, profit: income - expense, period: { from, to: now } };
  }

  categories() {
    return this.prisma.financeCategory.findMany({
      where: { tenantId: requireScope().tenantId, isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  createCategory(input: FinanceCategoryInput) {
    return this.prisma.financeCategory.create({
      data: { tenantId: requireScope().tenantId, ...input },
    });
  }

  create(input: FinanceTransactionInput) {
    const scope = requireScope();
    return this.prisma.financeTransaction.create({
      data: {
        tenantId: scope.tenantId,
        categoryId: input.categoryId,
        type: input.type,
        amount: input.amount,
        description: input.description,
        transactionDate: input.transactionDate,
        wilayahId: input.wilayahId ?? scope.wilayahId ?? undefined,
        createdBy: scope.userId,
      },
    });
  }

  async remove(id: string) {
    const row = await this.prisma.financeTransaction.findFirst({ where: { id, ...tenantWhere() } });
    if (!row) throw new NotFoundException('Transaksi tidak ditemukan');
    await this.prisma.financeTransaction.delete({ where: { id } });
    return { ok: true };
  }
}
