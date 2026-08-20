import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { PaymentCheckoutInput } from '@radgate/shared';
import { paginated, type ListQuery } from '../../common/pagination';
import { requireScope, tenantWhere } from '../../common/request-context';
import { PrismaService } from '../../prisma/prisma.service';
import { StubPaymentProvider, type PaymentProvider } from './payment.provider';

@Injectable()
export class PaymentsService {
  private readonly provider: PaymentProvider = new StubPaymentProvider();

  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListQuery) {
    const where = {
      ...tenantWhere(query.wilayahId),
      ...(query.status ? { status: query.status } : {}),
    };
    const [total, data] = await this.prisma.$transaction([
      this.prisma.paymentTransaction.count({ where }),
      this.prisma.paymentTransaction.findMany({
        where,
        include: { invoice: { select: { invoiceNumber: true, total: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.perPage,
        take: query.perPage,
      }),
    ]);
    return paginated(data, total, query);
  }

  async summary(wilayahId?: string | null) {
    const base = tenantWhere(wilayahId);
    const groups = await this.prisma.paymentTransaction.groupBy({
      by: ['status', 'isWithdrawn'],
      where: base,
      _sum: { amount: true, fee: true, netAmount: true },
      _count: { _all: true },
    });
    const total = groups.reduce((s, g) => s + (g._sum.amount ?? 0), 0);
    const pending = groups.filter((g) => g.status === 'pending').reduce((s, g) => s + (g._sum.amount ?? 0), 0);
    const withdrawn = groups.filter((g) => g.isWithdrawn).reduce((s, g) => s + (g._sum.netAmount ?? 0), 0);
    const notWithdrawn = groups.filter((g) => !g.isWithdrawn && g.status === 'paid').reduce((s, g) => s + (g._sum.netAmount ?? 0), 0);
    return { total, pending, withdrawn, notWithdrawn };
  }

  byRegion() {
    return this.prisma.paymentTransaction.groupBy({
      by: ['wilayahId'],
      where: { tenantId: requireScope().tenantId },
      _sum: { amount: true },
      _count: { _all: true },
    });
  }

  withdrawals() {
    return this.prisma.withdrawal.findMany({
      where: { tenantId: requireScope().tenantId },
      orderBy: { requestedAt: 'desc' },
      take: 50,
    });
  }

  async checkout(input: PaymentCheckoutInput) {
    const scope = requireScope();
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: input.invoiceId, tenantId: scope.tenantId },
    });
    if (!invoice) throw new NotFoundException('Tagihan tidak ditemukan');
    if (invoice.status === 'paid' || invoice.status === 'cancelled') {
      throw new ConflictException('Tagihan ini tidak bisa dibayar lewat gateway');
    }

    const reference = randomUUID();
    const fee = Math.round(invoice.total * 0.007);
    const session = await this.provider.checkout({
      reference,
      amount: invoice.total,
      method: input.method,
    });

    const row = await this.prisma.paymentTransaction.create({
      data: {
        tenantId: scope.tenantId,
        wilayahId: invoice.wilayahId,
        invoiceId: invoice.id,
        gateway: this.provider.name,
        reference,
        method: input.method,
        amount: invoice.total,
        fee,
        netAmount: invoice.total - fee,
        status: 'pending',
      },
    });

    return { ...row, checkoutUrl: session.checkoutUrl, providerRef: session.providerRef };
  }

  /**
   * Idempoten lewat unique (tenantId, reference). Callback yang datang dua kali
   * tidak menciptakan pembayaran kedua.
   */
  async handleWebhook(body: { reference?: string; status?: string; tenantId?: string }) {
    const reference = body.reference;
    if (!reference) throw new ConflictException('Referensi callback kosong');

    const existing = await this.prisma.paymentTransaction.findFirst({
      where: { reference },
    });
    if (!existing) throw new NotFoundException('Transaksi tidak ditemukan');
    if (existing.status === 'paid') return { ok: true, duplicated: true };

    const paid = body.status === 'paid' || body.status === 'success';
    if (!paid) {
      await this.prisma.paymentTransaction.update({
        where: { id: existing.id },
        data: { status: body.status ?? 'failed', rawCallback: body },
      });
      return { ok: true };
    }

    await this.prisma.paymentTransaction.update({
      where: { id: existing.id },
      data: { status: 'paid', paidAt: new Date(), rawCallback: body },
    });
    if (existing.invoiceId) {
      await this.prisma.invoice.update({
        where: { id: existing.invoiceId },
        data: { status: 'paid', paidAt: new Date(), paymentMethod: 'gateway' },
      });
    }
    return { ok: true };
  }
}
