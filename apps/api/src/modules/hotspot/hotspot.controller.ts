import { Body, Controller, Get, Post, Query, UsePipes } from '@nestjs/common';
import {
  hotspotProfileSchema,
  hotspotVoucherBatchSchema,
  type HotspotProfileInput,
  type HotspotVoucherBatchInput,
} from '@radgate/shared';
import { RequirePermission } from '../../common/decorators';
import { parseListQuery } from '../../common/pagination';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { HotspotService } from './hotspot.service';

@Controller('hotspot')
export class HotspotController {
  constructor(private readonly hotspot: HotspotService) {}

  @Get('profiles')
  @RequirePermission('hotspot', 'view')
  profiles() {
    return this.hotspot.profiles();
  }

  @Post('profiles')
  @RequirePermission('hotspot', 'create')
  @UsePipes(new ZodValidationPipe(hotspotProfileSchema))
  createProfile(@Body() body: HotspotProfileInput) {
    return this.hotspot.createProfile(body);
  }

  @Get('vouchers')
  @RequirePermission('hotspot', 'view')
  vouchers(@Query() query: Record<string, unknown>) {
    return this.hotspot.vouchers(parseListQuery(query));
  }

  @Post('vouchers/generate')
  @RequirePermission('hotspot', 'create')
  @UsePipes(new ZodValidationPipe(hotspotVoucherBatchSchema))
  generate(@Body() body: HotspotVoucherBatchInput) {
    return this.hotspot.generate(body);
  }

  @Get('usage')
  @RequirePermission('hotspot', 'view')
  usage(@Query() query: Record<string, unknown>) {
    return this.hotspot.usage(parseListQuery(query).wilayahId);
  }

  @Get('quota')
  @RequirePermission('hotspot', 'view')
  quota(@Query() query: Record<string, unknown>) {
    return this.hotspot.usage(parseListQuery(query).wilayahId);
  }
}
