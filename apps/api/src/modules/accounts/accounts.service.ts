import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { hash } from '@node-rs/argon2';
import type { AccountInput, Role } from '@radgate/shared';
import { paginated, type ListQuery } from '../../common/pagination';
import { requireScope } from '../../common/request-context';
import { PrismaService } from '../../prisma/prisma.service';
import { PermissionsService } from '../permissions/permissions.service';

const PUBLIC = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  mode: true,
  status: true,
  wilayahId: true,
  lastLoginAt: true,
  createdAt: true,
  wilayah: { select: { id: true, name: true, code: true } },
} as const;

@Injectable()
export class AccountsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissions: PermissionsService,
  ) {}

  async list(query: ListQuery) {
    const tenantId = requireScope().tenantId;
    const where = {
      tenantId,
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' as const } },
              { email: { contains: query.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };
    const [total, data] = await this.prisma.$transaction([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        select: PUBLIC,
        orderBy: { name: 'asc' },
        skip: (query.page - 1) * query.perPage,
        take: query.perPage,
      }),
    ]);
    return paginated(data, total, query);
  }

  async create(input: AccountInput) {
    if (!input.password) throw new ConflictException('Password wajib diisi saat membuat akun');
    const tenantId = requireScope().tenantId;
    try {
      return await this.prisma.user.create({
        data: {
          tenantId,
          name: input.name,
          email: input.email.toLowerCase(),
          passwordHash: await hash(input.password),
          phone: input.phone ?? undefined,
          role: input.role,
          wilayahId: input.wilayahId ?? undefined,
        },
        select: PUBLIC,
      });
    } catch {
      throw new ConflictException('Email sudah terdaftar');
    }
  }

  async update(id: string, input: Partial<AccountInput>) {
    const tenantId = requireScope().tenantId;
    const existing = await this.prisma.user.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Akun tidak ditemukan');

    const row = await this.prisma.user.update({
      where: { id },
      data: {
        ...(input.name != null ? { name: input.name } : {}),
        ...(input.email != null ? { email: input.email.toLowerCase() } : {}),
        ...(input.phone !== undefined ? { phone: input.phone } : {}),
        ...(input.role != null ? { role: input.role } : {}),
        ...(input.wilayahId !== undefined ? { wilayahId: input.wilayahId } : {}),
        ...(input.password ? { passwordHash: await hash(input.password) } : {}),
      },
      select: PUBLIC,
    });

    if (input.role) this.permissions.invalidate(tenantId, input.role as Role);
    return row;
  }

  async remove(id: string) {
    const scope = requireScope();
    if (id === scope.userId) throw new ConflictException('Tidak bisa menghapus akun sendiri');
    const existing = await this.prisma.user.findFirst({ where: { id, tenantId: scope.tenantId } });
    if (!existing) throw new NotFoundException('Akun tidak ditemukan');
    await this.prisma.user.delete({ where: { id } });
    return { ok: true };
  }
}
