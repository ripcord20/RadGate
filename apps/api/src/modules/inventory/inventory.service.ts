import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { InventoryItemInput, InventoryMovementInput } from '@radgate/shared';
import { paginated, type ListQuery } from '../../common/pagination';
import { requireScope, tenantWhere } from '../../common/request-context';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async items(query: ListQuery) {
    const scope = requireScope();
    const selected = scope.wilayahId ?? query.wilayahId ?? null;
    const where = {
      tenantId: scope.tenantId,
      AND: [
        ...(selected ? [{ OR: [{ wilayahId: selected }, { wilayahId: null }] }] : []),
        ...(query.search
          ? [
              {
                OR: [
                  { name: { contains: query.search, mode: 'insensitive' as const } },
                  { code: { contains: query.search, mode: 'insensitive' as const } },
                ],
              },
            ]
          : []),
      ],
    };
    const [total, data] = await this.prisma.$transaction([
      this.prisma.inventoryItem.count({ where }),
      this.prisma.inventoryItem.findMany({
        where,
        include: { category: true, wilayah: { select: { name: true } } },
        orderBy: { name: 'asc' },
        skip: (query.page - 1) * query.perPage,
        take: query.perPage,
      }),
    ]);
    return paginated(data, total, query);
  }

  categories() {
    return this.prisma.inventoryCategory.findMany({
      where: { tenantId: requireScope().tenantId },
      orderBy: { name: 'asc' },
    });
  }

  createCategory(name: string) {
    return this.prisma.inventoryCategory.create({
      data: { tenantId: requireScope().tenantId, name },
    });
  }

  async createItem(input: InventoryItemInput) {
    const scope = requireScope();
    const stock = input.stock ?? 0;
    return this.prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.create({
        data: {
          tenantId: scope.tenantId,
          categoryId: input.categoryId,
          code: input.code,
          name: input.name,
          unit: input.unit,
          unitPrice: input.unitPrice,
          description: input.description ?? undefined,
          wilayahId: input.wilayahId ?? undefined,
          stock,
        },
      });
      if (stock > 0) {
        await tx.inventoryTransaction.create({
          data: {
            itemId: item.id,
            type: 'in',
            quantity: stock,
            stockAfter: stock,
            notes: 'Stok awal',
            createdBy: scope.userId,
          },
        });
      }
      return item;
    });
  }

  async transactions(query: ListQuery) {
    const items = await this.prisma.inventoryItem.findMany({
      where: tenantWhere(query.wilayahId),
      select: { id: true },
    });
    const ids = items.map((i) => i.id);
    const where = { itemId: { in: ids } };
    const [total, data] = await this.prisma.$transaction([
      this.prisma.inventoryTransaction.count({ where }),
      this.prisma.inventoryTransaction.findMany({
        where,
        include: { item: { select: { name: true, code: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.perPage,
        take: query.perPage,
      }),
    ]);
    return paginated(data, total, query);
  }

  async move(input: InventoryMovementInput) {
    const scope = requireScope();
    const item = await this.prisma.inventoryItem.findFirst({
      where: { id: input.itemId, tenantId: scope.tenantId },
    });
    if (!item) throw new NotFoundException('Barang tidak ditemukan');

    const next = input.type === 'in' ? item.stock + input.quantity : item.stock - input.quantity;
    if (next < 0) throw new ConflictException('Stok tidak mencukupi');

    return this.prisma.$transaction(async (tx) => {
      await tx.inventoryItem.update({ where: { id: item.id }, data: { stock: next } });
      return tx.inventoryTransaction.create({
        data: {
          itemId: item.id,
          type: input.type,
          quantity: input.quantity,
          stockAfter: next,
          notes: input.notes ?? undefined,
          createdBy: scope.userId,
        },
      });
    });
  }
}
