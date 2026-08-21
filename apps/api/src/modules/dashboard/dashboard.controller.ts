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

    const [customerGroups, invoiceGroups, ticketGroups, monthFinance, ytdFinance] = await Promise.all([
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
      },
    };
  }
}
