import { randomBytes, randomUUID } from 'node:crypto';
import { Injectable, NotFoundException } from '@nestjs/common';
import type { HotspotProfileInput, HotspotVoucherBatchInput } from '@radgate/shared';
import { paginated, type ListQuery } from '../../common/pagination';
import { QuotaService } from '../../common/quota.service';
import { requireScope, runWithScope, tenantWhere } from '../../common/request-context';
import { PrismaService } from '../../prisma/prisma.service';
import { TasksService } from '../tasks/tasks.service';

@Injectable()
export class HotspotService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly quota: QuotaService,
    private readonly tasks: TasksService,
  ) {}

  profiles() {
    return this.prisma.hotspotProfile.findMany({
      where: { tenantId: requireScope().tenantId },
      orderBy: { name: 'asc' },
    });
  }

  createProfile(input: HotspotProfileInput) {
    return this.prisma.hotspotProfile.create({
      data: { tenantId: requireScope().tenantId, ...input },
    });
  }

  async vouchers(query: ListQuery) {
    const where = {
      ...tenantWhere(query.wilayahId),
      ...(query.status ? { status: query.status } : {}),
      ...(query.search ? { code: { contains: query.search, mode: 'insensitive' as const } } : {}),
    };
    const [total, data] = await this.prisma.$transaction([
      this.prisma.hotspotVoucher.count({ where }),
      this.prisma.hotspotVoucher.findMany({
        where,
        include: {
          profile: { select: { name: true, price: true } },
          wilayah: { select: { name: true, code: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.perPage,
        take: query.perPage,
      }),
    ]);
    return paginated(data, total, query);
  }

  async generate(input: HotspotVoucherBatchInput) {
    await this.quota.assertRemaining('hotspot_vouchers');
    const scope = requireScope();
    const task = await this.tasks.enqueue('hotspot.generate', input as unknown as Record<string, unknown>, input.quantity);
    void runWithScope(scope, () => this.runGenerate(task.id, input));
    return { taskId: task.id };
  }

  private async runGenerate(taskId: string, input: HotspotVoucherBatchInput) {
    try {
      const scope = requireScope();
      const profile = await this.prisma.hotspotProfile.findFirst({
        where: { id: input.profileId, tenantId: scope.tenantId },
      });
      if (!profile) throw new NotFoundException('Profil hotspot tidak ditemukan');

      const batchId = randomUUID();
      const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      const prefix = input.prefix ?? '';
      const rows = Array.from({ length: input.quantity }, () => {
        let code = prefix;
        while (code.length < prefix.length + input.codeLength) {
          code += alphabet[randomBytes(1)[0]! % alphabet.length];
        }
        return {
          tenantId: scope.tenantId,
          wilayahId: input.wilayahId,
          profileId: input.profileId,
          resellerId: input.resellerId ?? undefined,
          code,
          password: code,
          batchId,
          status: 'unused',
        };
      });

      await this.prisma.hotspotVoucher.createMany({ data: rows, skipDuplicates: true });
      await this.quota.bump('hotspot_vouchers', rows.length);
      await this.tasks.finish(taskId, { batchId, created: rows.length });
    } catch (error) {
      await this.tasks.fail(taskId, error instanceof Error ? error.message : 'Generate voucher gagal');
    }
  }

  async usage(wilayahId?: string | null) {
    const base = tenantWhere(wilayahId);
    const [total, unused, used, expired] = await Promise.all([
      this.prisma.hotspotVoucher.count({ where: base }),
      this.prisma.hotspotVoucher.count({ where: { ...base, status: 'unused' } }),
      this.prisma.hotspotVoucher.count({ where: { ...base, status: 'used' } }),
      this.prisma.hotspotVoucher.count({ where: { ...base, status: 'expired' } }),
    ]);
    return { total, unused, used, expired };
  }
}
