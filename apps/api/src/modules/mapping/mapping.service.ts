import { Injectable } from '@nestjs/common';
import type { OdpInput } from '@radgate/shared';
import { requireScope, tenantWhere } from '../../common/request-context';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MappingService {
  constructor(private readonly prisma: PrismaService) {}

  odp(wilayahId?: string | null) {
    return this.prisma.odp.findMany({
      where: tenantWhere(wilayahId),
      include: { wilayah: { select: { name: true, code: true } } },
      orderBy: { name: 'asc' },
    });
  }

  createOdp(input: OdpInput) {
    return this.prisma.odp.create({
      data: {
        tenantId: requireScope().tenantId,
        wilayahId: input.wilayahId,
        name: input.name,
        code: input.code,
        latitude: input.latitude,
        longitude: input.longitude,
        capacity: input.capacity,
        notes: input.notes ?? undefined,
      },
    });
  }

  customers(wilayahId?: string | null) {
    return this.prisma.customer.findMany({
      where: {
        ...tenantWhere(wilayahId),
        deletedAt: null,
        latitude: { not: null },
        longitude: { not: null },
      },
      select: {
        id: true,
        name: true,
        customerCode: true,
        status: true,
        latitude: true,
        longitude: true,
        address: true,
        package: { select: { name: true } },
      },
    });
  }

  async stats(wilayahId?: string | null) {
    const base = tenantWhere(wilayahId);
    const [odpCount, customerMapped, odp] = await Promise.all([
      this.prisma.odp.count({ where: base }),
      this.prisma.customer.count({
        where: { ...base, deletedAt: null, latitude: { not: null } },
      }),
      this.prisma.odp.aggregate({
        where: base,
        _sum: { capacity: true, usedPorts: true },
      }),
    ]);
    return {
      odp: odpCount,
      customersWithLocation: customerMapped,
      capacity: odp._sum.capacity ?? 0,
      usedPorts: odp._sum.usedPorts ?? 0,
    };
  }
}
