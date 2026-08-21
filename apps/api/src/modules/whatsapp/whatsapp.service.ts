import { Injectable, NotFoundException, type OnModuleInit } from '@nestjs/common';
import type {
  WhatsappBroadcastInput,
  WhatsappDeviceInput,
  WhatsappSendInput,
  WhatsappTemplateInput,
} from '@radgate/shared';
import { paginated, type ListQuery } from '../../common/pagination';
import { QuotaService } from '../../common/quota.service';
import { requireScope, tenantWhere } from '../../common/request-context';
import { PrismaService } from '../../prisma/prisma.service';
import { TasksService } from '../tasks/tasks.service';
import { StubWhatsappGateway, type WhatsappGateway } from './whatsapp.gateway';

@Injectable()
export class WhatsappService implements OnModuleInit {
  private readonly gateway: WhatsappGateway = new StubWhatsappGateway();

  constructor(
    private readonly prisma: PrismaService,
    private readonly quota: QuotaService,
    private readonly tasks: TasksService,
  ) {}

  onModuleInit() {
    this.tasks.register('whatsapp.broadcast', async (job) => {
      const broadcastId = String(job.payload.broadcastId ?? '');
      await this.runBroadcast(job.taskId, broadcastId, job.payload as unknown as WhatsappBroadcastInput);
    });
  }

  devices() {
    return this.prisma.whatsappDevice.findMany({
      where: { tenantId: requireScope().tenantId },
      select: {
        id: true,
        name: true,
        phoneNumber: true,
        provider: true,
        status: true,
        lastConnectedAt: true,
        createdAt: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async pair(input: WhatsappDeviceInput) {
    const scope = requireScope();
    const qr = await this.gateway.pair(input.name, input.phoneNumber);
    const device = await this.prisma.whatsappDevice.create({
      data: {
        tenantId: scope.tenantId,
        name: input.name,
        phoneNumber: input.phoneNumber,
        provider: input.provider,
        status: 'pairing',
      },
      select: { id: true, name: true, phoneNumber: true, provider: true, status: true },
    });
    return { ...device, qr };
  }

  async reconnect(id: string) {
    const device = await this.requireDevice(id);
    const qr = await this.gateway.pair(device.name, device.phoneNumber);
    await this.prisma.whatsappDevice.update({
      where: { id },
      data: { status: 'pairing' },
    });
    return { id, qr };
  }

  templates() {
    return this.prisma.whatsappTemplate.findMany({
      where: { tenantId: requireScope().tenantId },
      orderBy: { name: 'asc' },
    });
  }

  createTemplate(input: WhatsappTemplateInput) {
    return this.prisma.whatsappTemplate.create({
      data: {
        tenantId: requireScope().tenantId,
        name: input.name,
        content: input.content,
        category: input.category ?? undefined,
        variables: input.variables ?? undefined,
      },
    });
  }

  broadcasts() {
    return this.prisma.whatsappBroadcast.findMany({
      where: { tenantId: requireScope().tenantId },
      include: {
        template: { select: { name: true } },
        device: { select: { name: true, phoneNumber: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async createBroadcast(input: WhatsappBroadcastInput) {
    await this.quota.assertRemaining('whatsapp_messages');
    const scope = requireScope();
    const task = await this.tasks.enqueue('whatsapp.broadcast', input as unknown as Record<string, unknown>);
    const row = await this.prisma.whatsappBroadcast.create({
      data: {
        tenantId: scope.tenantId,
        templateId: input.templateId,
        deviceId: input.deviceId,
        targetFilter: input.targetFilter,
        status: 'queued',
        taskId: task.id,
        scheduledAt: input.scheduledAt ?? undefined,
      },
    });
    await this.tasks.dispatch(task.id, { ...(input as unknown as Record<string, unknown>), broadcastId: row.id });
    return { taskId: task.id, broadcastId: row.id };
  }

  private async runBroadcast(taskId: string, broadcastId: string, input: WhatsappBroadcastInput) {
    try {
      const scope = requireScope();
      const template = await this.prisma.whatsappTemplate.findFirst({
        where: { id: input.templateId, tenantId: scope.tenantId },
      });
      if (!template) throw new NotFoundException('Template tidak ditemukan');

      const targets = await this.prisma.customer.findMany({
        where: {
          tenantId: scope.tenantId,
          deletedAt: null,
          ...(input.targetFilter.wilayahId ? { wilayahId: input.targetFilter.wilayahId } : tenantWhere()),
          ...(input.targetFilter.status ? { status: input.targetFilter.status } : {}),
        },
        select: { id: true, phone: true, name: true },
      });

      await this.tasks.updateProgress(taskId, 0, targets.length);
      let sent = 0;
      let failed = 0;

      for (const [index, customer] of targets.entries()) {
        const content = template.content.replaceAll('{{name}}', customer.name);
        const result = await this.gateway.send(customer.phone, content);
        await this.prisma.whatsappMessage.create({
          data: {
            tenantId: scope.tenantId,
            deviceId: input.deviceId,
            customerId: customer.id,
            phoneNumber: customer.phone,
            direction: 'out',
            content,
            status: result.ok ? 'sent' : 'failed',
            error: result.error,
            sentAt: result.ok ? new Date() : undefined,
          },
        });
        if (result.ok) sent += 1;
        else failed += 1;
        if (index % 10 === 0) await this.tasks.updateProgress(taskId, index + 1, targets.length);
      }

      await this.quota.bump('whatsapp_messages', sent);
      await this.prisma.whatsappBroadcast.update({
        where: { id: broadcastId },
        data: { totalTargets: targets.length, sentCount: sent, failedCount: failed, status: 'done' },
      });
      await this.tasks.finish(taskId, { sent, failed, total: targets.length });
    } catch (error) {
      await this.tasks.fail(taskId, error instanceof Error ? error.message : 'Broadcast gagal');
      await this.prisma.whatsappBroadcast.update({
        where: { id: broadcastId },
        data: { status: 'failed' },
      });
    }
  }

  async inbox(number: string, query: ListQuery) {
    const where = { tenantId: requireScope().tenantId, phoneNumber: number };
    const [total, data] = await this.prisma.$transaction([
      this.prisma.whatsappMessage.count({ where }),
      this.prisma.whatsappMessage.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        skip: (query.page - 1) * query.perPage,
        take: query.perPage,
      }),
    ]);
    return paginated(data, total, query);
  }

  async send(input: WhatsappSendInput) {
    await this.quota.assertRemaining('whatsapp_messages');
    const result = await this.gateway.send(input.phoneNumber, input.content);
    const row = await this.prisma.whatsappMessage.create({
      data: {
        tenantId: requireScope().tenantId,
        deviceId: input.deviceId,
        customerId: input.customerId ?? undefined,
        phoneNumber: input.phoneNumber,
        direction: 'out',
        content: input.content,
        status: result.ok ? 'sent' : 'failed',
        error: result.error,
        sentAt: result.ok ? new Date() : undefined,
      },
    });
    if (result.ok) await this.quota.bump('whatsapp_messages', 1);
    return row;
  }

  async usage() {
    const used = await this.prisma.whatsappMessage.count({
      where: { tenantId: requireScope().tenantId, direction: 'out' },
    });
    return { metric: 'whatsapp_messages' as const, used };
  }

  private async requireDevice(id: string) {
    const row = await this.prisma.whatsappDevice.findFirst({
      where: { id, tenantId: requireScope().tenantId },
    });
    if (!row) throw new NotFoundException('Perangkat WhatsApp tidak ditemukan');
    return row;
  }
}
