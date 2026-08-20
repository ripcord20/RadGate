import { Body, Controller, Get, Patch, UsePipes } from '@nestjs/common';
import { settingsPatchSchema, type SettingsPatchInput } from '@radgate/shared';
import { RequirePermission } from '../../common/decorators';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { requireScope } from '../../common/request-context';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('settings')
export class SettingsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @RequirePermission('settings', 'view')
  async get() {
    const tenantId = requireScope().tenantId;
    const row = await this.prisma.setting.findUnique({ where: { tenantId } });
    return {
      companyName: row?.companyName ?? 'RadGate',
      logoUrl: row?.logoUrl ?? null,
      address: row?.address ?? null,
      phone: row?.phone ?? null,
      taxEnabled: row?.taxEnabled ?? false,
      taxPercent: row?.taxPercent ?? 0,
      currency: 'IDR',
      timezone: row?.timezone ?? 'Asia/Jakarta',
    };
  }

  @Patch()
  @RequirePermission('settings', 'update')
  @UsePipes(new ZodValidationPipe(settingsPatchSchema))
  async patch(@Body() body: SettingsPatchInput) {
    const tenantId = requireScope().tenantId;
    return this.prisma.setting.upsert({
      where: { tenantId },
      create: {
        tenantId,
        companyName: body.companyName ?? 'RadGate',
        address: body.address ?? undefined,
        phone: body.phone ?? undefined,
        taxEnabled: body.taxEnabled ?? false,
        taxPercent: body.taxPercent ?? 0,
        timezone: body.timezone ?? 'Asia/Jakarta',
      },
      update: body,
    });
  }
}
