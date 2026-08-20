import { Body, Controller, Get, Param, Post, Query, UsePipes } from '@nestjs/common';
import { aoSchema, type AoInput } from '@radgate/shared';
import { RequirePermission } from '../../common/decorators';
import { parseListQuery } from '../../common/pagination';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { AoService } from './ao.service';

@Controller('ao')
export class AoController {
  constructor(private readonly ao: AoService) {}

  @Get()
  @RequirePermission('billing', 'view')
  list(@Query() query: Record<string, unknown>) {
    return this.ao.list(parseListQuery(query).wilayahId);
  }

  @Post()
  @RequirePermission('billing', 'create')
  @UsePipes(new ZodValidationPipe(aoSchema))
  create(@Body() body: AoInput) {
    return this.ao.create(body);
  }

  @Get(':id')
  @RequirePermission('billing', 'view')
  detail(@Param('id') id: string) {
    return this.ao.detail(id);
  }
}
