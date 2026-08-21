import { Controller, Get, Header, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
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

  @Get('export.xlsx')
  @RequirePermission('reports', 'view')
  @Header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  async excel(@Query() query: Record<string, unknown>, @Res() res: Response) {
    const buf = await this.reports.toExcel(parseListQuery(query).wilayahId);
    res.setHeader('Content-Disposition', 'attachment; filename="laporan-radgate.xlsx"');
    res.send(buf);
  }

  @Get('export.pdf')
  @RequirePermission('reports', 'view')
  @Header('Content-Type', 'application/pdf')
  async pdf(@Query() query: Record<string, unknown>, @Res() res: Response) {
    const buf = await this.reports.toPdf(parseListQuery(query).wilayahId);
    res.setHeader('Content-Disposition', 'attachment; filename="laporan-radgate.pdf"');
    res.send(buf);
  }
}
