import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UsePipes,
} from '@nestjs/common';
import {
  customerBulkStatusSchema,
  customerPatchSchema,
  customerSchema,
  type CustomerBulkStatusInput,
  type CustomerInput,
  type CustomerPatchInput,
} from '@radgate/shared';
import { RequirePermission } from '../../common/decorators';
import { parseListQuery } from '../../common/pagination';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { CustomersService } from './customers.service';

@Controller('customers')
export class CustomersController {
  constructor(private readonly customers: CustomersService) {}

  @Get()
  @RequirePermission('customers', 'view')
  list(@Query() query: Record<string, unknown>) {
    return this.customers.list(parseListQuery({ ...query, status: query.status }));
  }

  @Get('summary')
  @RequirePermission('customers', 'view')
  summary(@Query() query: Record<string, unknown>) {
    return this.customers.summary(parseListQuery(query).wilayahId);
  }

  @Get('anomalies')
  @RequirePermission('customers', 'view')
  anomalies(@Query() query: Record<string, unknown>) {
    return this.customers.anomalies(parseListQuery(query).wilayahId);
  }

  @Get(':id')
  @RequirePermission('customers', 'view')
  detail(@Param('id') id: string) {
    return this.customers.detail(id);
  }

  @Post()
  @RequirePermission('customers', 'create')
  @UsePipes(new ZodValidationPipe(customerSchema))
  create(@Body() body: CustomerInput) {
    return this.customers.create(body);
  }

  @Patch(':id')
  @RequirePermission('customers', 'update')
  @UsePipes(new ZodValidationPipe(customerPatchSchema))
  update(@Param('id') id: string, @Body() body: CustomerPatchInput) {
    return this.customers.update(id, body);
  }

  @Delete(':id')
  @RequirePermission('customers', 'delete')
  remove(@Param('id') id: string) {
    return this.customers.remove(id);
  }

  @Post('bulk/status')
  @RequirePermission('customers', 'update')
  @UsePipes(new ZodValidationPipe(customerBulkStatusSchema))
  bulkStatus(@Body() body: CustomerBulkStatusInput) {
    return this.customers.bulkStatus(body);
  }
}
