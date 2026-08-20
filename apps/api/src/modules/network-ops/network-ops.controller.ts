import { Body, Controller, Get, Post, Query, UsePipes } from '@nestjs/common';
import { speedOnDemandSchema, type SpeedOnDemandInput } from '@radgate/shared';
import { RequirePermission } from '../../common/decorators';
import { parseListQuery } from '../../common/pagination';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { SpeedOnDemandService } from './network-ops.service';

@Controller()
export class NetworkOpsController {
  constructor(private readonly ops: SpeedOnDemandService) {}

  @Get('speed-on-demand')
  @RequirePermission('customers', 'view')
  list(@Query() query: Record<string, unknown>) {
    return this.ops.list(parseListQuery(query).wilayahId);
  }

  @Post('speed-on-demand')
  @RequirePermission('customers', 'create')
  @UsePipes(new ZodValidationPipe(speedOnDemandSchema))
  create(@Body() body: SpeedOnDemandInput) {
    return this.ops.create(body);
  }
}
