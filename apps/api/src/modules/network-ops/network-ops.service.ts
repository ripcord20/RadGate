import { Injectable } from '@nestjs/common';
import type { SpeedOnDemandInput } from '@radgate/shared';
import { tenantWhere } from '../../common/request-context';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SpeedOnDemandService {
  constructor(private readonly prisma: PrismaService) {}

  list(wilayahId?: string | null) {
    return this.prisma.speedOnDemand.findMany({
      where: { customer: { ...tenantWhere(wilayahId), deletedAt: null } },
      include: { customer: { select: { id: true, name: true, customerCode: true } } },
      orderBy: { startsAt: 'desc' },
      take: 100,
    });
  }

  create(input: SpeedOnDemandInput) {
    return this.prisma.speedOnDemand.create({
      data: {
        customerId: input.customerId,
        speedUp: input.speedUp,
        speedDown: input.speedDown,
        price: input.price,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
      },
    });
  }
}
