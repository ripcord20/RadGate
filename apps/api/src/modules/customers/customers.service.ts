import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { hash } from '@node-rs/argon2';
import type { CustomerBulkStatusInput, CustomerInput, CustomerPatchInput, CustomerStatus } from '@radgate/shared';
import { CryptoService } from '../../common/crypto';
import { NetworkClient } from '../../common/network.client';
import { paginated, type ListQuery } from '../../common/pagination';
import { QuotaService } from '../../common/quota.service';
import { requireScope, tenantWhere } from '../../common/request-context';
import { PrismaService } from '../../prisma/prisma.service';

const PUBLIC_SELECT = {
  id: true,
  customerCode: true,
  name: true,
  email: true,
  phone: true,
  nik: true,
  address: true,
  latitude: true,
  longitude: true,
  pppoeUsername: true,
  ipMode: true,
  ipAddress: true,
  billingType: true,
  installationDate: true,
  dueDay: true,
  installationFee: true,
  discount: true,
  notes: true,
  status: true,
  wilayahId: true,
  packageId: true,
  createdAt: true,
  updatedAt: true,
  wilayah: { select: { id: true, name: true, code: true } },
  package: { select: { id: true, name: true, price: true, speedUp: true, speedDown: true } },
} satisfies Prisma.CustomerSelect;

@Injectable()
export class CustomersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
    private readonly quota: QuotaService,
    private readonly network: NetworkClient,
  ) {}

  async list(query: ListQuery) {
    const where = this.buildWhere(query);
    const [total, rows] = await this.prisma.$transaction([
      this.prisma.customer.count({ where }),
      this.prisma.customer.findMany({
        where,
        select: PUBLIC_SELECT,
        orderBy: { createdAt: query.sortDir },
        skip: (query.page - 1) * query.perPage,
        take: query.perPage,
      }),
    ]);
    return paginated(rows, total, query);
  }

  async summary(wilayahId?: string | null) {
    const base = tenantWhere(wilayahId);
    const [total, aktif, expired, berhenti, isolir] = await Promise.all([
      this.prisma.customer.count({ where: base }),
      this.prisma.customer.count({ where: { ...base, status: 'aktif' } }),
      this.prisma.customer.count({ where: { ...base, status: 'expired' } }),
      this.prisma.customer.count({ where: { ...base, status: 'berhenti' } }),
      this.prisma.customer.count({ where: { ...base, status: 'isolir' } }),
    ]);
    return { total, aktif, expired, berhenti, isolir, online: 0, offline: 0 };
  }

  async detail(id: string) {
    const row = await this.prisma.customer.findFirst({
      where: { id, ...tenantWhere() },
      select: { ...PUBLIC_SELECT, invoices: { orderBy: { createdAt: 'desc' }, take: 12 } },
    });
    if (!row) throw new NotFoundException('Pelanggan tidak ditemukan');
    return row;
  }

  async create(input: CustomerInput) {
    await this.quota.assertRemaining('customers');
    const scope = requireScope();
    this.assertWilayahAccess(input.wilayahId);

    const pkg = await this.prisma.internetPackage.findFirst({
      where: { id: input.packageId, tenantId: scope.tenantId },
    });
    if (!pkg) throw new NotFoundException('Paket internet tidak ditemukan');

    const wilayah = await this.prisma.wilayah.findFirst({
      where: { id: input.wilayahId, tenantId: scope.tenantId },
    });
    if (!wilayah) throw new NotFoundException('Wilayah tidak ditemukan');

    const count = await this.prisma.customer.count({
      where: { tenantId: scope.tenantId, wilayahId: input.wilayahId },
    });
    const customerCode = `${wilayah.code}-${String(count + 1).padStart(4, '0')}`;
    let pppoePasswordEnc: string;
    try {
      pppoePasswordEnc = this.crypto.encrypt(input.pppoePassword);
    } catch {
      throw new InternalServerErrorException(
        'Kunci enkripsi perangkat belum valid. Isi DEVICE_ENCRYPTION_KEY (32 byte base64) di apps/api/.env, lalu jalankan ulang npm run dev:api.',
      );
    }
    const appPasswordHash = await hash(input.appPassword);

    try {
      const row = await this.prisma.withTenant(async (tx) => {
        const created = await tx.customer.create({
          data: {
            tenantId: scope.tenantId,
            wilayahId: input.wilayahId,
            packageId: input.packageId,
            customerCode,
            name: input.name,
            email: input.email,
            phone: input.phone,
            nik: input.nik,
            address: input.address,
            latitude: input.latitude ?? undefined,
            longitude: input.longitude ?? undefined,
            pppoeUsername: input.pppoeUsername,
            pppoePasswordEnc,
            ipMode: input.ipMode,
            ipAddress: input.ipAddress ?? undefined,
            appPasswordHash,
            billingType: input.billingType,
            installationDate: input.installationDate,
            dueDay: input.dueDay,
            installationFee: input.installationFee,
            discount: input.discount,
            notes: input.notes ?? undefined,
            status: input.status,
          },
          select: PUBLIC_SELECT,
        });

        for (const line of input.inventoryItems) {
          const item = await tx.inventoryItem.findFirst({
            where: { id: line.itemId, tenantId: scope.tenantId },
          });
          if (!item) throw new NotFoundException('Barang inventory tidak ditemukan');
          const next = item.stock - line.quantity;
          if (next < 0) throw new ConflictException(`Stok ${item.name} tidak mencukupi`);
          await tx.inventoryItem.update({ where: { id: item.id }, data: { stock: next } });
          await tx.inventoryTransaction.create({
            data: {
              itemId: item.id,
              type: 'out',
              quantity: line.quantity,
              stockAfter: next,
              referenceType: 'customer',
              referenceId: created.id,
              notes: `Pemasangan ${customerCode}`,
              createdBy: scope.userId,
            },
          });
        }

        await this.network.provisionPppoe({
          username: input.pppoeUsername,
          password: input.pppoePassword,
          profile: pkg.mikrotikProfile ?? undefined,
        });

        return created;
      });
      await this.quota.bump('customers', 1);
      return row;
    } catch (error) {
      this.rethrowUnique(error);
    }
  }

  async update(id: string, input: CustomerPatchInput) {
    const existing = await this.requireOne(id);
    if (input.wilayahId) this.assertWilayahAccess(input.wilayahId);

    try {
      return await this.prisma.customer.update({
        where: { id: existing.id },
        data: {
          ...(input.name != null ? { name: input.name } : {}),
          ...(input.email != null ? { email: input.email } : {}),
          ...(input.phone != null ? { phone: input.phone } : {}),
          ...(input.nik !== undefined ? { nik: input.nik } : {}),
          ...(input.address != null ? { address: input.address } : {}),
          ...(input.packageId != null ? { packageId: input.packageId } : {}),
          ...(input.wilayahId != null ? { wilayahId: input.wilayahId } : {}),
          ...(input.pppoeUsername != null ? { pppoeUsername: input.pppoeUsername } : {}),
          ...(input.pppoePassword ? { pppoePasswordEnc: this.crypto.encrypt(input.pppoePassword) } : {}),
          ...(input.appPassword ? { appPasswordHash: await hash(input.appPassword) } : {}),
          ...(input.ipMode != null ? { ipMode: input.ipMode } : {}),
          ...(input.ipAddress !== undefined ? { ipAddress: input.ipAddress } : {}),
          ...(input.billingType != null ? { billingType: input.billingType } : {}),
          ...(input.installationDate != null ? { installationDate: input.installationDate } : {}),
          ...(input.dueDay != null ? { dueDay: input.dueDay } : {}),
          ...(input.installationFee != null ? { installationFee: input.installationFee } : {}),
          ...(input.discount != null ? { discount: input.discount } : {}),
          ...(input.notes !== undefined ? { notes: input.notes } : {}),
          ...(input.status != null ? { status: input.status } : {}),
          ...(input.latitude !== undefined ? { latitude: input.latitude } : {}),
          ...(input.longitude !== undefined ? { longitude: input.longitude } : {}),
        },
        select: PUBLIC_SELECT,
      });
    } catch (error) {
      this.rethrowUnique(error);
    }
  }

  async remove(id: string) {
    const existing = await this.requireOne(id);
    await this.prisma.customer.update({
      where: { id: existing.id },
      data: { deletedAt: new Date(), status: 'berhenti' },
    });
    await this.quota.bump('customers', -1);
    return { ok: true };
  }

  async bulkStatus(input: CustomerBulkStatusInput) {
    const where = { id: { in: input.ids }, ...tenantWhere() };
    const result = await this.prisma.customer.updateMany({
      where,
      data: { status: input.status as CustomerStatus },
    });
    return { updated: result.count };
  }

  anomalies(wilayahId?: string | null) {
    return this.prisma.loginAnomaly.findMany({
      where: { customer: { ...tenantWhere(wilayahId), deletedAt: null } },
      include: { customer: { select: { id: true, name: true, customerCode: true } } },
      orderBy: { detectedAt: 'desc' },
      take: 100,
    });
  }

  private buildWhere(query: ListQuery): Prisma.CustomerWhereInput {
    const base = tenantWhere(query.wilayahId);
    const status = query.status as CustomerStatus | undefined;
    return {
      ...base,
      deletedAt: null,
      ...(status ? { status } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { phone: { contains: query.search } },
              { pppoeUsername: { contains: query.search, mode: 'insensitive' } },
              { customerCode: { contains: query.search, mode: 'insensitive' } },
              { address: { contains: query.search, mode: 'insensitive' } },
              { notes: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
  }

  private async requireOne(id: string) {
    const row = await this.prisma.customer.findFirst({
      where: { id, ...tenantWhere(), deletedAt: null },
    });
    if (!row) throw new NotFoundException('Pelanggan tidak ditemukan');
    return row;
  }

  private assertWilayahAccess(wilayahId: string) {
    const scope = requireScope();
    if (scope.wilayahId && scope.wilayahId !== wilayahId) {
      throw new ConflictException('Anda tidak berwenang pada wilayah itu');
    }
  }

  private rethrowUnique(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictException('Username PPPoE atau kode pelanggan sudah dipakai');
    }
    throw error;
  }
}
