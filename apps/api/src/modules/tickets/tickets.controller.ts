import { Body, Controller, Get, Param, Patch, Post, Query, UsePipes } from '@nestjs/common';
import { ticketSchema, type TicketInput } from '@radgate/shared';
import { RequirePermission } from '../../common/decorators';
import { parseListQuery } from '../../common/pagination';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { TicketsService } from './tickets.service';

@Controller('tickets')
export class TicketsController {
  constructor(private readonly tickets: TicketsService) {}

  @Get()
  @RequirePermission('tickets', 'view')
  list(@Query() query: Record<string, unknown>) {
    return this.tickets.list(parseListQuery(query));
  }

  @Get('technicians')
  @RequirePermission('tickets', 'view')
  technicians() {
    return this.tickets.technicians();
  }

  @Get(':id')
  @RequirePermission('tickets', 'view')
  detail(@Param('id') id: string) {
    return this.tickets.detail(id);
  }

  @Post()
  @RequirePermission('tickets', 'create')
  @UsePipes(new ZodValidationPipe(ticketSchema))
  create(@Body() body: TicketInput) {
    return this.tickets.create(body);
  }

  @Patch(':id')
  @RequirePermission('tickets', 'update')
  update(@Param('id') id: string, @Body() body: Partial<TicketInput>) {
    return this.tickets.update(id, ticketSchema.partial().parse(body));
  }

  @Post(':id/comments')
  @RequirePermission('tickets', 'update')
  comment(@Param('id') id: string, @Body() body: { comment: string }) {
    return this.tickets.comment(id, body.comment);
  }
}
