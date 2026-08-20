import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { ResellerInput } from '@radgate/shared';
import { paginated, type ListQuery } from '../../common/pagination';
import { requireScope, tenantWhere } from '../../common/request-context';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ResellersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListQuery, type?: string) {
    const where = {
      ...tenantWhere(query.wilayahId),
      ...(type === 'reseller' || type === 'biller' ? { type } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' as const } },
              { phone: { contains: query.search } },
            ],
          }
        : {}),
    };
    const [total, data] = await this.prisma.$transaction([
      this.prisma.reseller.count({ where }),
      this.prisma.reseller.findMany({
        where,
        include: { wilayah: { select: { name: true, code: true } } },
        orderBy: { name: 'asc' },
        skip: (query.page - 1) * query.perPage,
        take: query.perPage,
      }),
    ]);
    return paginated(data, total, query);
  }

  async detail(id: string) {
    const row = await this.prisma.reseller.findFirst({
      where: { id, ...tenantWhere() },
      include: {
        wilayah: true,
        customers: { take: 50, orderBy: { name: 'asc' }, select: { id: true, name: true, customerCode: true, status: true } },
        transactions: { take: 50, orderBy: { createdAt: 'desc' } },
      },
    });
    if (!row) throw new NotFoundException('Reseller tidak ditemukan');
    return row;
  }

  create(input: ResellerInput) {
    const scope = requireScope();
    return this.prisma.reseller.create({
      data: {
        tenantId: scope.tenantId,
        wilayahId: input.wilayahId,
        name: input.name,
        phone: input.phone,
        type: input.type,
        commissionType: input.commissionType,
        commissionValue: Math.round(input.commissionValue),
      },
    });
  }

  customers(id: string, query: ListQuery) {
    return this.prisma.customer.findMany({
      where: { resellerId: id, ...tenantWhere(query.wilayahId), deletedAt: null },
      select: {
        id: true,
        name: true,
        customerCode: true,
        status: true,
        phone: true,
        package: { select: { name: true } },
      },
      skip: (query.page - 1) * query.perPage,
      take: query.perPage,
    });
  }

  logs(id: string) {
    return this.prisma.resellerTransaction.findMany({
      where: { resellerId: id, reseller: tenantWhere() },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async pay(id: string, amount: number, notes?: string) {
    if (amount < 1) throw new ConflictException('Nominal pembayaran harus lebih dari 0');
    const reseller = await this.detail(id);
    const next = reseller.balance - amount;
    if (next < 0) throw new ConflictException('Saldo komisi tidak mencukupi');

    const [updated] = await this.prisma.$transaction([
      this.prisma.reseller.update({ where: { id }, data: { balance: next } }),
      this.prisma.resellerTransaction.create({
        data: {
          resellerId: id,
          type: 'payout',
          amount,
          balanceAfter: next,
          notes: notes ?? 'Pembayaran komisi',
        },
      }),
    ]);
    return updated;
  }
}
