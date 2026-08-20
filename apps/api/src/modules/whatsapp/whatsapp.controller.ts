import { Body, Controller, Get, Param, Post, Query, UsePipes } from '@nestjs/common';
import {
  whatsappBroadcastSchema,
  whatsappDeviceSchema,
  whatsappSendSchema,
  whatsappTemplateSchema,
  type WhatsappBroadcastInput,
  type WhatsappDeviceInput,
  type WhatsappSendInput,
  type WhatsappTemplateInput,
} from '@radgate/shared';
import { RequirePermission } from '../../common/decorators';
import { parseListQuery } from '../../common/pagination';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { WhatsappService } from './whatsapp.service';

@Controller('whatsapp')
export class WhatsappController {
  constructor(private readonly whatsapp: WhatsappService) {}

  @Get('devices')
  @RequirePermission('whatsapp', 'view')
  devices() {
    return this.whatsapp.devices();
  }

  @Post('devices')
  @RequirePermission('whatsapp', 'create')
  @UsePipes(new ZodValidationPipe(whatsappDeviceSchema))
  pair(@Body() body: WhatsappDeviceInput) {
    return this.whatsapp.pair(body);
  }

  @Post('devices/:id/reconnect')
  @RequirePermission('whatsapp', 'update')
  reconnect(@Param('id') id: string) {
    return this.whatsapp.reconnect(id);
  }

  @Get('templates')
  @RequirePermission('whatsapp', 'view')
  templates() {
    return this.whatsapp.templates();
  }

  @Post('templates')
  @RequirePermission('whatsapp', 'create')
  @UsePipes(new ZodValidationPipe(whatsappTemplateSchema))
  createTemplate(@Body() body: WhatsappTemplateInput) {
    return this.whatsapp.createTemplate(body);
  }

  @Get('broadcasts')
  @RequirePermission('whatsapp', 'view')
  broadcasts() {
    return this.whatsapp.broadcasts();
  }

  @Post('broadcasts')
  @RequirePermission('whatsapp', 'create')
  @UsePipes(new ZodValidationPipe(whatsappBroadcastSchema))
  createBroadcast(@Body() body: WhatsappBroadcastInput) {
    return this.whatsapp.createBroadcast(body);
  }

  @Get('inbox/:number')
  @RequirePermission('whatsapp', 'view')
  inbox(@Param('number') number: string, @Query() query: Record<string, unknown>) {
    return this.whatsapp.inbox(number, parseListQuery(query));
  }

  @Post('send')
  @RequirePermission('whatsapp', 'create')
  @UsePipes(new ZodValidationPipe(whatsappSendSchema))
  send(@Body() body: WhatsappSendInput) {
    return this.whatsapp.send(body);
  }

  @Get('usage')
  @RequirePermission('whatsapp', 'view')
  usage() {
    return this.whatsapp.usage();
  }
}
