import { Controller, Get, Query } from '@nestjs/common';
import { RequirePermission } from '../../common/decorators';
import { parseListQuery } from '../../common/pagination';
import { tenantWhere } from '../../common/request-context';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @RequirePermission('dashboard', 'view')
  async stats(@Query() query: Record<string, unknown>) {
    const base = tenantWhere(parseListQuery(query).wilayahId);
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    const fromMonths = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    const [customerGroups, invoiceGroups, ticketGroups, monthFinance, ytdFinance, defaultNas, packageGroups, monthRows] =
      await Promise.all([
      this.prisma.customer.groupBy({
        by: ['status'],
        where: { ...base, deletedAt: null },
        _count: { _all: true },
      }),
      this.prisma.invoice.groupBy({
        by: ['status'],
        where: { ...base, createdAt: { gte: monthStart } },
        _count: { _all: true },
      }),
      this.prisma.ticket.groupBy({
        by: ['status'],
        where: { ...base, createdAt: { gte: monthStart } },
        _count: { _all: true },
      }),
      this.prisma.financeTransaction.groupBy({
        by: ['type'],
        where: { ...base, transactionDate: { gte: monthStart } },
        _sum: { amount: true },
      }),
      this.prisma.financeTransaction.groupBy({
        by: ['type'],
        where: { ...base, transactionDate: { gte: yearStart } },
        _sum: { amount: true },
      }),
      this.prisma.nas.findFirst({
        where: { ...base, isDefault: true },
        select: { id: true, name: true },
      }),
      this.prisma.customer.groupBy({
        by: ['packageId'],
        where: { ...base, deletedAt: null },
        _count: { _all: true },
      }),
      this.prisma.financeTransaction.findMany({
        where: { ...base, transactionDate: { gte: fromMonths } },
        select: { type: true, amount: true, transactionDate: true },
      }),
    ]);

    const c = Object.fromEntries(customerGroups.map((r) => [r.status, r._count._all]));
    const i = Object.fromEntries(invoiceGroups.map((r) => [r.status, r._count._all]));
    const t = Object.fromEntries(ticketGroups.map((r) => [r.status, r._count._all]));
    const monthIncome = monthFinance.find((r) => r.type === 'income')?._sum.amount ?? 0;
    const monthExpense = monthFinance.find((r) => r.type === 'expense')?._sum.amount ?? 0;
    const ytdIncome = ytdFinance.find((r) => r.type === 'income')?._sum.amount ?? 0;
    const ytdExpense = ytdFinance.find((r) => r.type === 'expense')?._sum.amount ?? 0;

    const customerTotal = Object.values(c).reduce((a, b) => a + Number(b), 0);
    const ticketTotal = Object.values(t).reduce((a, b) => a + Number(b), 0);
    const invoiceTotal = Object.values(i).reduce((a, b) => a + Number(b), 0);

    const packageIds = packageGroups.map((g) => g.packageId);
    const packageRows = packageIds.length
      ? await this.prisma.internetPackage.findMany({
          where: { id: { in: packageIds } },
          select: { id: true, name: true },
        })
      : [];
    const packageName = Object.fromEntries(packageRows.map((p) => [p.id, p.name]));

    const monthKeys: { key: string; label: string; income: number; expense: number }[] = [];
    for (let i = 11; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthKeys.push({
        key,
        label: d.toLocaleDateString('id-ID', { month: 'short' }),
        income: 0,
        expense: 0,
      });
    }
    const monthIndex = Object.fromEntries(monthKeys.map((m, idx) => [m.key, idx]));
    for (const row of monthRows) {
      const d = row.transactionDate;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const slot = monthKeys[monthIndex[key] ?? -1];
      if (!slot) continue;
      if (row.type === 'income') slot.income += row.amount;
      else slot.expense += row.amount;
    }

    return {
      customers: {
        total: customerTotal,
        online: 0,
        offline: 0,
        expired: Number(c.expired ?? 0),
        stopped: Number(c.berhenti ?? 0),
        aktif: Number(c.aktif ?? 0),
        isolir: Number(c.isolir ?? 0),
      },
      tickets: {
        total: ticketTotal,
        open: Number(t.baru ?? 0),
        inProgress: Number(t.proses ?? 0),
        done: Number(t.selesai ?? 0),
      },
      invoices: {
        total: invoiceTotal,
        paid: Number(i.paid ?? 0),
        unpaid: Number(i.unpaid ?? 0),
        overdue: Number(i.overdue ?? 0),
      },
      finance: {
        month: {
          income: monthIncome,
          expense: monthExpense,
          profit: monthIncome - monthExpense,
          label: now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
        },
        ytd: { income: ytdIncome, expense: ytdExpense, profit: ytdIncome - ytdExpense },
        months: monthKeys,
      },
      packages: packageGroups
        .map((g) => ({ name: packageName[g.packageId] ?? 'Paket', count: g._count._all }))
        .sort((a, b) => b.count - a.count),
      defaultNas,
    };
  }
}
