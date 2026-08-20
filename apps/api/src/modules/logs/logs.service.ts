import { Injectable } from '@nestjs/common';
import type { ListQuery } from '../../common/pagination';
import { requireScope } from '../../common/request-context';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class LogsService {
  constructor(private readonly prisma: PrismaService) {}

  list(query: ListQuery) {
    return this.prisma.activityLog.findMany({
      where: {
        tenantId: requireScope().tenantId,
        ...(query.search
          ? {
              OR: [
                { action: { contains: query.search, mode: 'insensitive' } },
                { module: { contains: query.search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.perPage,
      take: query.perPage,
    });
  }
}
