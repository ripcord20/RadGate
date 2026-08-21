import { ConflictException, Injectable, NotFoundException, type OnModuleInit } from '@nestjs/common';
import type { MikrotikInput, NasInput, NasMigrateInput, NasPatchInput, PortForwardingInput } from '@radgate/shared';
import { CryptoService } from '../../common/crypto';
import { paginated, type ListQuery } from '../../common/pagination';
import { QuotaService } from '../../common/quota.service';
import { requireScope, tenantWhere } from '../../common/request-context';
import { PrismaService } from '../../prisma/prisma.service';
import { TasksService } from '../tasks/tasks.service';

@Injectable()
export class ServersService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
    private readonly quota: QuotaService,
    private readonly tasks: TasksService,
  ) {}

  onModuleInit() {
    this.tasks.register('mikrotik.sync', async (job) => {
      const ids = (job.payload.ids as string[] | undefined) ?? [];
      await this.runSync(job.taskId, ids);
    });
  }

  async listNas(query: ListQuery) {
    const where = {
      ...tenantWhere(query.wilayahId),
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' as const } },
              { description: { contains: query.search, mode: 'insensitive' as const } },
              { ipAddress: { contains: query.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };
    const [total, rows] = await this.prisma.$transaction([
      this.prisma.nas.count({ where }),
      this.prisma.nas.findMany({
        where,
        include: {
          wilayah: { select: { id: true, name: true, code: true } },
          _count: { select: { customers: true } },
        },
        orderBy: [{ wilayah: { name: 'asc' } }, { name: 'asc' }],
        skip: (query.page - 1) * query.perPage,
        take: query.perPage,
      }),
    ]);
    return paginated(
      rows.map(({ secretEnc: _secret, ...row }) => row),
      total,
      query,
    );
  }

  async createNas(input: NasInput) {
    await this.quota.assertRemaining('nas');
    const scope = requireScope();
    const hasDefault = await this.prisma.nas.findFirst({
      where: { tenantId: scope.tenantId, isDefault: true },
      select: { id: true },
    });
    const row = await this.prisma.nas.create({
      data: {
        tenantId: scope.tenantId,
        wilayahId: input.wilayahId,
        name: input.name,
        ipAddress: input.ipAddress,
        secretEnc: this.crypto.encrypt(input.secret),
        type: input.type,
        description: input.description ?? undefined,
        connectionMode: input.connectionMode,
        protocol: input.protocol ?? undefined,
        isDefault: input.isDefault || !hasDefault,
      },
    });
    await this.quota.bump('nas', 1);
    const { secretEnc: _s, ...safe } = row;
    return safe;
  }

  async setDefaultNas(id: string) {
    const scope = requireScope();
    const nas = await this.prisma.nas.findFirst({ where: { id, tenantId: scope.tenantId } });
    if (!nas) throw new NotFoundException('NAS tidak ditemukan');
    await this.prisma.$transaction([
      this.prisma.nas.updateMany({
        where: { tenantId: scope.tenantId, isDefault: true },
        data: { isDefault: false },
      }),
      this.prisma.nas.update({ where: { id }, data: { isDefault: true } }),
    ]);
    return { ok: true, id };
  }

  async nasDetail(id: string, revealSecret = false) {
    const row = await this.prisma.nas.findFirst({
      where: { id, tenantId: requireScope().tenantId },
      include: {
        wilayah: { select: { id: true, name: true, code: true } },
        _count: { select: { customers: true, portForwardings: true } },
      },
    });
    if (!row) throw new NotFoundException('NAS tidak ditemukan');
    const { secretEnc, ...safe } = row;
    return {
      ...safe,
      secret: revealSecret ? this.crypto.decrypt(secretEnc) : null,
    };
  }

  async updateNas(id: string, input: NasPatchInput) {
    const existing = await this.requireNas(id);
    const onlyOffline = input.status === 'offline' && Object.keys(input).every((k) => k === 'status');
    if (existing.status === 'online' && !onlyOffline) {
      throw new ConflictException('NAS berstatus online tidak bisa diubah. Tandai offline terlebih dahulu.');
    }
    const row = await this.prisma.nas.update({
      where: { id },
      data: {
        ...(input.name != null ? { name: input.name } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.ipAddress != null ? { ipAddress: input.ipAddress } : {}),
        ...(input.secret ? { secretEnc: this.crypto.encrypt(input.secret) } : {}),
        ...(input.type != null ? { type: input.type } : {}),
        ...(input.connectionMode != null ? { connectionMode: input.connectionMode } : {}),
        ...(input.protocol !== undefined ? { protocol: input.protocol } : {}),
        ...(input.wilayahId != null ? { wilayahId: input.wilayahId } : {}),
        ...(input.status != null ? { status: input.status } : {}),
      },
    });
    const { secretEnc: _s, ...safe } = row;
    return safe;
  }

  async removeNas(id: string) {
    const existing = await this.requireNas(id);
    if (existing.status === 'online') {
      throw new ConflictException('NAS berstatus online tidak bisa dihapus. Tandai offline terlebih dahulu.');
    }
    const customers = await this.prisma.customer.count({ where: { nasId: id } });
    if (customers > 0) {
      throw new ConflictException(
        `Masih ada ${customers} pelanggan di NAS ini. Pindahkan dulu lewat Migrasi.`,
      );
    }
    await this.prisma.nas.delete({ where: { id } });
    await this.quota.bump('nas', -1);
    return { ok: true };
  }

  async migrateNas(input: NasMigrateInput) {
    const from = await this.requireNas(input.fromNasId);
    const to = await this.requireNas(input.toNasId);
    const result = await this.prisma.customer.updateMany({
      where: { nasId: from.id, tenantId: requireScope().tenantId, deletedAt: null },
      data: { nasId: to.id },
    });
    return { moved: result.count, fromNasId: from.id, toNasId: to.id };
  }

  private async requireNas(id: string) {
    const nas = await this.prisma.nas.findFirst({ where: { id, tenantId: requireScope().tenantId } });
    if (!nas) throw new NotFoundException('NAS tidak ditemukan');
    return nas;
  }

  listPorts(query: ListQuery) {
    return this.prisma.portForwarding.findMany({
      where: { nas: tenantWhere(query.wilayahId) },
      include: { nas: { select: { name: true, ipAddress: true } } },
      orderBy: { name: 'asc' },
      skip: (query.page - 1) * query.perPage,
      take: query.perPage,
    });
  }

  createPort(input: PortForwardingInput) {
    return this.prisma.portForwarding.create({
      data: {
        nasId: input.nasId,
        name: input.name,
        protocol: input.protocol,
        externalPort: input.externalPort,
        internalIp: input.internalIp,
        internalPort: input.internalPort,
      },
    });
  }

  async listMikrotik(query: ListQuery) {
    const where = {
      ...tenantWhere(query.wilayahId),
      ...(query.search ? { name: { contains: query.search, mode: 'insensitive' as const } } : {}),
    };
    const [total, rows] = await this.prisma.$transaction([
      this.prisma.mikrotikDevice.count({ where }),
      this.prisma.mikrotikDevice.findMany({
        where,
        include: { wilayah: { select: { name: true, code: true } } },
        orderBy: { name: 'asc' },
        skip: (query.page - 1) * query.perPage,
        take: query.perPage,
      }),
    ]);
    return paginated(
      rows.map(({ passwordEnc: _p, ...row }) => row),
      total,
      query,
    );
  }

  async createMikrotik(input: MikrotikInput) {
    await this.quota.assertRemaining('mikrotik');
    const scope = requireScope();
    const row = await this.prisma.mikrotikDevice.create({
      data: {
        tenantId: scope.tenantId,
        wilayahId: input.wilayahId,
        name: input.name,
        host: input.host,
        port: input.port,
        username: input.username,
        passwordEnc: this.crypto.encrypt(input.password),
      },
    });
    await this.quota.bump('mikrotik', 1);
    const { passwordEnc: _p, ...safe } = row;
    return safe;
  }

  async syncMikrotik(id: string) {
    const scope = requireScope();
    const device = await this.prisma.mikrotikDevice.findFirst({
      where: { id, tenantId: scope.tenantId },
    });
    if (!device) throw new NotFoundException('Perangkat Mikrotik tidak ditemukan');
    const task = await this.tasks.enqueueAndRun('mikrotik.sync', { ids: [device.id] });
    return { taskId: task.id };
  }

  async syncAll() {
    const scope = requireScope();
    const devices = await this.prisma.mikrotikDevice.findMany({
      where: { tenantId: scope.tenantId },
      select: { id: true },
    });
    const ids = devices.map((d) => d.id);
    const task = await this.tasks.enqueueAndRun('mikrotik.sync', { ids }, ids.length);
    return { taskId: task.id };
  }

  /**
   * Implementasi RouterOS API hidup di balik interface. Di sini hanya stub: tandai
   * perangkat tersinkronisasi tanpa menghubungi hardware, supaya pengujian tidak
   * membutuhkan Mikrotik sungguhan.
   */
  private async runSync(taskId: string, ids: string[]) {
    try {
      await this.tasks.updateProgress(taskId, 0, ids.length);
      for (const [index, id] of ids.entries()) {
        await this.prisma.mikrotikDevice.update({
          where: { id },
          data: { status: 'online', lastSyncAt: new Date(), version: '7.x-mock', syncError: null },
        });
        await this.tasks.updateProgress(taskId, index + 1, ids.length);
      }
      await this.tasks.finish(taskId, { synced: ids.length });
    } catch (error) {
      await this.tasks.fail(taskId, error instanceof Error ? error.message : 'Sinkronisasi gagal');
    }
  }
}
