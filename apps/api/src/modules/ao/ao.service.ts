import { Injectable, NotFoundException } from '@nestjs/common';
import type { AoInput } from '@radgate/shared';
import { requireScope, tenantWhere } from '../../common/request-context';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AoService {
  constructor(private readonly prisma: PrismaService) {}

  list(wilayahId?: string | null) {
    return this.prisma.accountOfficer.findMany({
      where: tenantWhere(wilayahId),
      include: {
        wilayah: { select: { name: true, code: true } },
        _count: { select: { customers: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async detail(id: string) {
    const row = await this.prisma.accountOfficer.findFirst({
      where: { id, ...tenantWhere() },
      include: {
        wilayah: true,
        customers: {
          include: { customer: { select: { id: true, name: true, customerCode: true, status: true, phone: true } } },
        },
      },
    });
    if (!row) throw new NotFoundException('Account Officer tidak ditemukan');
    return row;
  }

  create(input: AoInput) {
    return this.prisma.accountOfficer.create({
      data: {
        tenantId: requireScope().tenantId,
        wilayahId: input.wilayahId,
        userId: input.userId ?? undefined,
        name: input.name,
        phone: input.phone,
      },
    });
  }
}
