import { ConflictException, Injectable, NotFoundException, type OnModuleInit } from '@nestjs/common';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import type { GenerateInvoiceInput, InvoicePaymentInput, InvoiceStatus } from '@radgate/shared';
import { paginated, type ListQuery } from '../../common/pagination';
import { requireScope, tenantWhere } from '../../common/request-context';
import { PrismaService } from '../../prisma/prisma.service';
import { TasksService } from '../tasks/tasks.service';

@Injectable()
export class BillingService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tasks: TasksService,
  ) {}

  onModuleInit() {
    this.tasks.register('invoice.generate', async (job) => {
      await this.runGenerate(job.taskId, job.payload as unknown as GenerateInvoiceInput);
    });
  }

  async list(query: ListQuery, extra: { periodMonth?: number; periodYear?: number }) {
    const where = {
      ...tenantWhere(query.wilayahId),
      ...(query.status ? { status: query.status as InvoiceStatus } : {}),
      ...(extra.periodMonth ? { periodMonth: extra.periodMonth } : {}),
      ...(extra.periodYear ? { periodYear: extra.periodYear } : {}),
      ...(query.search
        ? {
            OR: [
              { invoiceNumber: { contains: query.search, mode: 'insensitive' as const } },
              { customer: { name: { contains: query.search, mode: 'insensitive' as const } } },
            ],
          }
        : {}),
    };

    const [total, data] = await this.prisma.$transaction([
      this.prisma.invoice.count({ where }),
      this.prisma.invoice.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true, customerCode: true } },
          package: { select: { id: true, name: true } },
          wilayah: { select: { id: true, name: true, code: true } },
        },
        orderBy: { createdAt: query.sortDir },
        skip: (query.page - 1) * query.perPage,
        take: query.perPage,
      }),
    ]);

    return paginated(data, total, query);
  }

  async summary(wilayahId?: string | null) {
    const base = tenantWhere(wilayahId);
    const groups = await this.prisma.invoice.groupBy({
      by: ['status'],
      where: base,
      _count: { _all: true },
      _sum: { total: true },
    });

    const byStatus = Object.fromEntries(groups.map((g) => [g.status, { count: g._count._all, total: g._sum.total ?? 0 }]));
    const unpaid = (byStatus.unpaid?.total ?? 0) + (byStatus.overdue?.total ?? 0);
    const debt = byStatus.debt?.total ?? 0;
    const paid = byStatus.paid?.total ?? 0;

    return {
      unpaid: byStatus.unpaid ?? { count: 0, total: 0 },
      overdue: byStatus.overdue ?? { count: 0, total: 0 },
      debt: byStatus.debt ?? { count: 0, total: 0 },
      paid: byStatus.paid ?? { count: 0, total: 0 },
      pendingCount: (byStatus.unpaid?.count ?? 0) + (byStatus.overdue?.count ?? 0),
      hutang: debt,
      totalUnpaid: unpaid + debt,
      totalPaid: paid,
    };
  }

  async detail(id: string) {
    const row = await this.prisma.invoice.findFirst({
      where: { id, ...tenantWhere() },
      include: {
        customer: true,
        package: true,
        wilayah: true,
      },
    });
    if (!row) throw new NotFoundException('Tagihan tidak ditemukan');
    return row;
  }

  async generate(input: GenerateInvoiceInput) {
    const task = await this.tasks.enqueueAndRun('invoice.generate', input as unknown as Record<string, unknown>);
    return { taskId: task.id };
  }

  private async runGenerate(taskId: string, input: GenerateInvoiceInput) {
    try {
      await this.tasks.updateProgress(taskId, 0);
      const scope = requireScope();
      const settings = await this.prisma.setting.findUnique({ where: { tenantId: scope.tenantId } });

      const customers = await this.prisma.customer.findMany({
        where: {
          tenantId: scope.tenantId,
          status: 'aktif',
          deletedAt: null,
          ...(input.wilayahId ? { wilayahId: input.wilayahId } : tenantWhere(input.wilayahId)),
          ...(input.customerIds.length ? { id: { in: input.customerIds } } : {}),
        },
        include: { package: true },
      });

      await this.tasks.updateProgress(taskId, 0, customers.length);

      let created = 0;
      let skipped = 0;
      let lastNumber = await this.nextInvoiceSeed();

      for (const [index, customer] of customers.entries()) {
        const amount = customer.package.price;
        const discount = customer.discount;
        const taxable = Math.max(0, amount - discount);
        const tax =
          input.includeTax && settings?.taxEnabled ? Math.round((taxable * (settings.taxPercent ?? 0)) / 100) : 0;
        const total = taxable + tax;
        const dueDate = this.dueDate(input.periodYear, input.periodMonth, customer.dueDay);

        try {
          lastNumber += 1;
          await this.prisma.invoice.create({
            data: {
              tenantId: scope.tenantId,
              wilayahId: customer.wilayahId,
              customerId: customer.id,
              packageId: customer.packageId,
              invoiceNumber: `INV-${String(lastNumber).padStart(4, '0')}`,
              periodMonth: input.periodMonth,
              periodYear: input.periodYear,
              amount,
              discount,
              tax,
              total,
              status: 'unpaid',
              dueDate,
            },
          });
          created += 1;
        } catch {
          skipped += 1;
        }

        if (index % 25 === 0) await this.tasks.updateProgress(taskId, index + 1, customers.length);
      }

      await this.tasks.finish(taskId, { created, skipped, total: customers.length });
    } catch (error) {
      await this.tasks.fail(taskId, error instanceof Error ? error.message : 'Generate gagal');
    }
  }

  async pay(id: string, input: InvoicePaymentInput) {
    const invoice = await this.detail(id);
    if (invoice.status === 'paid' || invoice.status === 'cancelled') {
      throw new ConflictException('Tagihan ini sudah tidak bisa dibayar');
    }

    const scope = requireScope();
    const fullyPaid = input.amount >= invoice.total;
    const status: InvoiceStatus = fullyPaid ? 'paid' : input.amount > 0 ? 'debt' : invoice.status;

    const updated = await this.prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        status,
        paidAt: fullyPaid ? input.paidAt : invoice.paidAt,
        paidBy: scope.userId,
        paymentMethod: input.method,
        notes: input.notes ?? invoice.notes,
      },
    });

    await this.prisma.invoicePayment.create({
      data: {
        invoiceId: invoice.id,
        amount: input.amount,
        method: input.method,
        paidAt: input.paidAt,
        receivedBy: scope.userId,
        reference: input.reference ?? undefined,
        notes: input.notes ?? undefined,
      },
    });

    await this.recordIncome(updated, input.amount, input.method);
    return updated;
  }

  private async recordIncome(invoice: { id: string; wilayahId: string; invoiceNumber: string }, amount: number, method: string) {
    const scope = requireScope();
    let category = await this.prisma.financeCategory.findFirst({
      where: { tenantId: scope.tenantId, type: 'income', name: 'Tagihan pelanggan' },
    });
    if (!category) {
      category = await this.prisma.financeCategory.create({
        data: { tenantId: scope.tenantId, type: 'income', name: 'Tagihan pelanggan' },
      });
    }

    await this.prisma.financeTransaction.create({
      data: {
        tenantId: scope.tenantId,
        wilayahId: invoice.wilayahId,
        categoryId: category.id,
        type: 'income',
        amount,
        description: `Pembayaran ${invoice.invoiceNumber} (${method})`,
        transactionDate: new Date(),
        referenceType: 'invoice',
        referenceId: invoice.id,
        createdBy: scope.userId,
      },
    });
  }

  private async nextInvoiceSeed() {
    const last = await this.prisma.invoice.findFirst({
      where: { tenantId: requireScope().tenantId },
      orderBy: { createdAt: 'desc' },
      select: { invoiceNumber: true },
    });
    const match = last?.invoiceNumber.match(/(\d+)$/);
    return match ? Number(match[1]) : 0;
  }

  private dueDate(year: number, month: number, dueDay: number) {
    const lastDay = new Date(year, month, 0).getDate();
    return new Date(year, month - 1, Math.min(dueDay, lastDay));
  }

  async invoicePdf(id: string): Promise<Uint8Array> {
    const invoice = await this.detail(id);
    const settings = await this.prisma.setting.findUnique({
      where: { tenantId: requireScope().tenantId },
    });

    const pdf = await PDFDocument.create();
    const page = pdf.addPage([595.28, 841.89]);
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const ink = rgb(0.12, 0.16, 0.22);
    let y = 800;

    const line = (text: string, size = 11, face = font) => {
      page.drawText(latin(text), { x: 48, y, size, font: face, color: ink });
      y -= size + 8;
    };

    line(settings?.companyName ?? 'RadGate', 18, bold);
    line(`Invoice ${invoice.invoiceNumber}`, 14, bold);
    line(`Pelanggan: ${invoice.customer.name}`);
    line(`Kode: ${invoice.customer.customerCode}`);
    line(`Wilayah: ${invoice.wilayah.name}`);
    line(`Paket: ${invoice.package.name}`);
    line(`Periode: ${invoice.periodMonth}/${invoice.periodYear}`);
    line(`Jumlah: ${rupiah(invoice.amount)}`);
    line(`Diskon: ${rupiah(invoice.discount)}`);
    line(`Pajak: ${rupiah(invoice.tax)}`);
    line(`Total: ${rupiah(invoice.total)}`, 13, bold);
    line(`Status: ${invoice.status}`);
    line(`Jatuh tempo: ${invoice.dueDate.toISOString().slice(0, 10)}`);
    y -= 12;
    line('Dokumen ini dihasilkan RadGate. Uang dalam rupiah penuh.', 9);

    return pdf.save();
  }
}

function latin(value: string) {
  return value.replace(/[^\u0020-\u007E]/g, '?');
}

function rupiah(value: number) {
  return `Rp ${value.toLocaleString('en-US')}`;
}
