import { Body, Controller, Delete, Get, Param, Post, Query, UsePipes } from '@nestjs/common';
import {
  financeCategorySchema,
  financeTransactionSchema,
  type FinanceCategoryInput,
  type FinanceTransactionInput,
} from '@radgate/shared';
import { RequirePermission } from '../../common/decorators';
import { parseListQuery } from '../../common/pagination';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { FinancesService } from './finances.service';

@Controller('finances')
export class FinancesController {
  constructor(private readonly finances: FinancesService) {}

  @Get()
  @RequirePermission('finances', 'view')
  list(@Query() query: Record<string, unknown>) {
    return this.finances.list(parseListQuery(query));
  }

  @Get('summary')
  @RequirePermission('finances', 'view')
  summary(@Query() query: Record<string, unknown>) {
    return this.finances.summary(parseListQuery(query).wilayahId);
  }

  @Get('categories')
  @RequirePermission('finances', 'view')
  categories() {
    return this.finances.categories();
  }

  @Post('categories')
  @RequirePermission('finances', 'create')
  @UsePipes(new ZodValidationPipe(financeCategorySchema))
  createCategory(@Body() body: FinanceCategoryInput) {
    return this.finances.createCategory(body);
  }

  @Post()
  @RequirePermission('finances', 'create')
  @UsePipes(new ZodValidationPipe(financeTransactionSchema))
  create(@Body() body: FinanceTransactionInput) {
    return this.finances.create(body);
  }

  @Delete(':id')
  @RequirePermission('finances', 'delete')
  remove(@Param('id') id: string) {
    return this.finances.remove(id);
  }
}
