import { Body, Controller, Get, Post, Query, UsePipes } from '@nestjs/common';
import { odpSchema, type OdpInput } from '@radgate/shared';
import { RequirePermission } from '../../common/decorators';
import { parseListQuery } from '../../common/pagination';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { MappingService } from './mapping.service';

@Controller('mapping')
export class MappingController {
  constructor(private readonly mapping: MappingService) {}

  @Get('odp')
  @RequirePermission('mapping', 'view')
  odp(@Query() query: Record<string, unknown>) {
    return this.mapping.odp(parseListQuery(query).wilayahId);
  }

  @Post('odp')
  @RequirePermission('mapping', 'create')
  @UsePipes(new ZodValidationPipe(odpSchema))
  createOdp(@Body() body: OdpInput) {
    return this.mapping.createOdp(body);
  }

  @Get('customers')
  @RequirePermission('mapping', 'view')
  customers(@Query() query: Record<string, unknown>) {
    return this.mapping.customers(parseListQuery(query).wilayahId);
  }

  @Get('stats')
  @RequirePermission('mapping', 'view')
  stats(@Query() query: Record<string, unknown>) {
    return this.mapping.stats(parseListQuery(query).wilayahId);
  }
}
