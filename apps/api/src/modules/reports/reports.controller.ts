import { Controller, Get, Query } from '@nestjs/common';
import { RequirePermission } from '../../common/decorators';
import { parseListQuery } from '../../common/pagination';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get('summary')
  @RequirePermission('reports', 'view')
  summary(@Query() query: Record<string, unknown>) {
    return this.reports.summary(parseListQuery(query).wilayahId);
  }

  @Get('customers')
  @RequirePermission('reports', 'view')
  customers(@Query() query: Record<string, unknown>) {
    return this.reports.customers(parseListQuery(query).wilayahId);
  }

  @Get('finances')
  @RequirePermission('reports', 'view')
  finances(@Query() query: Record<string, unknown>) {
    return this.reports.finances(parseListQuery(query).wilayahId);
  }

  @Get('billing')
  @RequirePermission('reports', 'view')
  billing(@Query() query: Record<string, unknown>) {
    return this.reports.billing(parseListQuery(query).wilayahId);
  }
}
