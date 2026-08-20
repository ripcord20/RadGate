import { Injectable, NotFoundException } from '@nestjs/common';
import type { TicketInput } from '@radgate/shared';
import { paginated, type ListQuery } from '../../common/pagination';
import { requireScope, tenantWhere } from '../../common/request-context';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TicketsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListQuery) {
    const where = {
      ...tenantWhere(query.wilayahId),
      ...(query.status ? { status: query.status as never } : {}),
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: 'insensitive' as const } },
              { ticketNumber: { contains: query.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };
    const [total, data] = await this.prisma.$transaction([
      this.prisma.ticket.count({ where }),
      this.prisma.ticket.findMany({
        where,
        include: { wilayah: { select: { name: true, code: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.perPage,
        take: query.perPage,
      }),
    ]);
    return paginated(data, total, query);
  }

  async detail(id: string) {
    const row = await this.prisma.ticket.findFirst({
      where: { id, ...tenantWhere() },
      include: { comments: { orderBy: { createdAt: 'asc' } }, wilayah: true },
    });
    if (!row) throw new NotFoundException('Tiket tidak ditemukan');
    return row;
  }

  async create(input: TicketInput) {
    const scope = requireScope();
    const count = await this.prisma.ticket.count({ where: { tenantId: scope.tenantId } });
    return this.prisma.ticket.create({
      data: {
        tenantId: scope.tenantId,
        wilayahId: input.wilayahId,
        customerId: input.customerId ?? undefined,
        ticketNumber: `TKT-${String(count + 1).padStart(4, '0')}`,
        title: input.title,
        description: input.description,
        category: input.category ?? undefined,
        priority: input.priority,
        status: input.status,
        assignedTo: input.assignedTo ?? undefined,
        createdBy: scope.userId,
      },
    });
  }

  async update(id: string, input: Partial<TicketInput>) {
    await this.detail(id);
    return this.prisma.ticket.update({
      where: { id },
      data: {
        ...(input.title != null ? { title: input.title } : {}),
        ...(input.description != null ? { description: input.description } : {}),
        ...(input.status != null ? { status: input.status } : {}),
        ...(input.priority != null ? { priority: input.priority } : {}),
        ...(input.assignedTo !== undefined ? { assignedTo: input.assignedTo } : {}),
        ...(input.status === 'selesai' ? { resolvedAt: new Date() } : {}),
      },
    });
  }

  async   comment(id: string, comment: string) {
    await this.detail(id);
    return this.prisma.ticketComment.create({
      data: { ticketId: id, userId: requireScope().userId, comment },
    });
  }

  technicians() {
    return this.prisma.user.findMany({
      where: { tenantId: requireScope().tenantId, role: 'teknisi', status: 'aktif' },
      select: { id: true, name: true, email: true, phone: true, wilayahId: true },
      orderBy: { name: 'asc' },
    });
  }
}
