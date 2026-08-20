import { Controller, Get, Query } from '@nestjs/common';
import { RequirePermission } from '../../common/decorators';
import { parseListQuery } from '../../common/pagination';
import { LogsService } from './logs.service';

@Controller('logs')
export class LogsController {
  constructor(private readonly logs: LogsService) {}

  @Get()
  @RequirePermission('settings', 'view')
  list(@Query() query: Record<string, unknown>) {
    return this.logs.list(parseListQuery(query));
  }
}
