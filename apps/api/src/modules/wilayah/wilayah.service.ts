import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { WilayahInput } from '@radgate/shared';
import { Prisma } from '@prisma/client';
import { paginated, type ListQuery } from '../../common/pagination';
import { requireScope } from '../../common/request-context';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class WilayahService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListQuery) {
    const tenantId = requireScope().tenantId;
    const where = {
      tenantId,
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' as const } },
              { code: { contains: query.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [total, data] = await this.prisma.$transaction([
      this.prisma.wilayah.count({ where }),
      this.prisma.wilayah.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (query.page - 1) * query.perPage,
        take: query.perPage,
      }),
    ]);

    return paginated(data, total, query);
  }

  async create(input: WilayahInput) {
    try {
      return await this.prisma.wilayah.create({
        data: {
          tenantId: requireScope().tenantId,
          name: input.name,
          code: input.code.toUpperCase(),
          isActive: input.isActive,
        },
      });
    } catch (error) {
      this.rethrowUnique(error);
    }
  }

  async update(id: string, input: Partial<WilayahInput>) {
    await this.requireOne(id);
    try {
      return await this.prisma.wilayah.update({
        where: { id },
        data: {
          ...(input.name != null ? { name: input.name } : {}),
          ...(input.code != null ? { code: input.code.toUpperCase() } : {}),
          ...(input.isActive != null ? { isActive: input.isActive } : {}),
        },
      });
    } catch (error) {
      this.rethrowUnique(error);
    }
  }

  async remove(id: string) {
    await this.requireOne(id);
    const used = await this.prisma.customer.count({ where: { wilayahId: id } });
    if (used > 0) {
      throw new ConflictException('Wilayah tidak bisa dihapus karena masih dipakai pelanggan. Nonaktifkan saja.');
    }
    return this.prisma.wilayah.delete({ where: { id } });
  }

  private async requireOne(id: string) {
    const row = await this.prisma.wilayah.findFirst({ where: { id, tenantId: requireScope().tenantId } });
    if (!row) throw new NotFoundException('Wilayah tidak ditemukan');
    return row;
  }

  private rethrowUnique(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictException('Kode wilayah sudah dipakai');
    }
    throw error;
  }
}
