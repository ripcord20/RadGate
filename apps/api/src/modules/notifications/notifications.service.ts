import { Injectable } from '@nestjs/common';
import { requireScope } from '../../common/request-context';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    const scope = requireScope();
    return this.prisma.notification.findMany({
      where: { tenantId: scope.tenantId, userId: scope.userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async markRead(id: string) {
    const scope = requireScope();
    return this.prisma.notification.updateMany({
      where: { id, tenantId: scope.tenantId, userId: scope.userId },
      data: { readAt: new Date() },
    });
  }
}
