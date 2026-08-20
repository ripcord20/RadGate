import { Injectable, NotFoundException } from '@nestjs/common';
import type { MikrotikInput, NasInput, PortForwardingInput } from '@radgate/shared';
import { CryptoService } from '../../common/crypto';
import { paginated, type ListQuery } from '../../common/pagination';
import { QuotaService } from '../../common/quota.service';
import { requireScope, runWithScope, tenantWhere } from '../../common/request-context';
import { PrismaService } from '../../prisma/prisma.service';
import { TasksService } from '../tasks/tasks.service';

@Injectable()
export class ServersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
    private readonly quota: QuotaService,
    private readonly tasks: TasksService,
  ) {}

  async listNas(query: ListQuery) {
    const where = {
      ...tenantWhere(query.wilayahId),
      ...(query.search ? { name: { contains: query.search, mode: 'insensitive' as const } } : {}),
    };
    const [total, rows] = await this.prisma.$transaction([
      this.prisma.nas.count({ where }),
      this.prisma.nas.findMany({
        where,
        include: { wilayah: { select: { name: true, code: true } } },
        orderBy: { name: 'asc' },
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
    const row = await this.prisma.nas.create({
      data: {
        tenantId: scope.tenantId,
        wilayahId: input.wilayahId,
        name: input.name,
        ipAddress: input.ipAddress,
        secretEnc: this.crypto.encrypt(input.secret),
        type: input.type,
        isDefault: input.isDefault,
      },
    });
    await this.quota.bump('nas', 1);
    const { secretEnc: _s, ...safe } = row;
    return safe;
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
    const task = await this.tasks.enqueue('mikrotik.sync', { id });
    void runWithScope(scope, () => this.runSync(task.id, [device.id]));
    return { taskId: task.id };
  }

  async syncAll() {
    const scope = requireScope();
    const devices = await this.prisma.mikrotikDevice.findMany({
      where: { tenantId: scope.tenantId },
      select: { id: true },
    });
    const task = await this.tasks.enqueue('mikrotik.sync', { all: true }, devices.length);
    void runWithScope(scope, () => this.runSync(task.id, devices.map((d) => d.id)));
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
