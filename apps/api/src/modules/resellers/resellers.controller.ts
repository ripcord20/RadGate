import { Body, Controller, Get, Param, Post, Query, UsePipes } from '@nestjs/common';
import { resellerSchema, type ResellerInput } from '@radgate/shared';
import { z } from 'zod';
import { RequirePermission } from '../../common/decorators';
import { parseListQuery } from '../../common/pagination';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { ResellersService } from './resellers.service';

const paySchema = z.object({
  amount: z.number().int().min(1),
  notes: z.string().trim().max(500).nullish(),
});

@Controller('resellers')
export class ResellersController {
  constructor(private readonly resellers: ResellersService) {}

  @Get()
  @RequirePermission('resellers', 'view')
  list(@Query() query: Record<string, unknown>) {
    const type = typeof query.type === 'string' ? query.type : undefined;
    return this.resellers.list(parseListQuery(query), type);
  }

  @Post()
  @RequirePermission('resellers', 'create')
  @UsePipes(new ZodValidationPipe(resellerSchema))
  create(@Body() body: ResellerInput) {
    return this.resellers.create(body);
  }

  @Get(':id')
  @RequirePermission('resellers', 'view')
  detail(@Param('id') id: string) {
    return this.resellers.detail(id);
  }

  @Get(':id/customers')
  @RequirePermission('resellers', 'view')
  customers(@Param('id') id: string, @Query() query: Record<string, unknown>) {
    return this.resellers.customers(id, parseListQuery(query));
  }

  @Get(':id/logs')
  @RequirePermission('resellers', 'view')
  logs(@Param('id') id: string) {
    return this.resellers.logs(id);
  }

  @Post(':id/pay')
  @RequirePermission('resellers', 'update')
  pay(@Param('id') id: string, @Body() body: unknown) {
    const parsed = paySchema.parse(body);
    return this.resellers.pay(id, parsed.amount, parsed.notes ?? undefined);
  }
}
