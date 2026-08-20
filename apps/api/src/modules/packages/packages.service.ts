import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { InternetPackageInput } from '@radgate/shared';
import { paginated, type ListQuery } from '../../common/pagination';
import { requireScope } from '../../common/request-context';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PackagesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListQuery) {
    const tenantId = requireScope().tenantId;
    const where = {
      tenantId,
      ...(query.search ? { name: { contains: query.search, mode: 'insensitive' as const } } : {}),
      ...(query.status === 'aktif' ? { isActive: true } : {}),
      ...(query.status === 'nonaktif' ? { isActive: false } : {}),
    };

    const [total, data] = await this.prisma.$transaction([
      this.prisma.internetPackage.count({ where }),
      this.prisma.internetPackage.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (query.page - 1) * query.perPage,
        take: query.perPage,
        include: { _count: { select: { customers: true } } },
      }),
    ]);

    return paginated(
      data.map(({ _count, ...row }) => ({ ...row, customerCount: _count.customers })),
      total,
      query,
    );
  }

  create(input: InternetPackageInput) {
    return this.prisma.internetPackage.create({
      data: { tenantId: requireScope().tenantId, ...input, mikrotikProfile: input.mikrotikProfile ?? undefined },
    });
  }

  async update(id: string, input: Partial<InternetPackageInput>) {
    await this.requireOne(id);
    return this.prisma.internetPackage.update({ where: { id }, data: input });
  }

  async remove(id: string) {
    await this.requireOne(id);
    const used = await this.prisma.customer.count({ where: { packageId: id } });
    if (used > 0) {
      throw new ConflictException('Paket tidak bisa dihapus karena masih dipakai pelanggan. Nonaktifkan saja.');
    }
    return this.prisma.internetPackage.delete({ where: { id } });
  }

  private async requireOne(id: string) {
    const row = await this.prisma.internetPackage.findFirst({
      where: { id, tenantId: requireScope().tenantId },
    });
    if (!row) throw new NotFoundException('Paket tidak ditemukan');
    return row;
  }
}
