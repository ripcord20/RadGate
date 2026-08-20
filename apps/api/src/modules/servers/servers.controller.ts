import { Body, Controller, Get, Param, Post, Query, UsePipes } from '@nestjs/common';
import {
  mikrotikSchema,
  nasSchema,
  portForwardingSchema,
  type MikrotikInput,
  type NasInput,
  type PortForwardingInput,
} from '@radgate/shared';
import { RequirePermission } from '../../common/decorators';
import { parseListQuery } from '../../common/pagination';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { ServersService } from './servers.service';

@Controller()
export class ServersController {
  constructor(private readonly servers: ServersService) {}

  @Get('nas')
  @RequirePermission('servers', 'view')
  listNas(@Query() query: Record<string, unknown>) {
    return this.servers.listNas(parseListQuery(query));
  }

  @Post('nas')
  @RequirePermission('servers', 'create')
  @UsePipes(new ZodValidationPipe(nasSchema))
  createNas(@Body() body: NasInput) {
    return this.servers.createNas(body);
  }

  @Get('nas/port-forwarding')
  @RequirePermission('servers', 'view')
  listPorts(@Query() query: Record<string, unknown>) {
    return this.servers.listPorts(parseListQuery(query));
  }

  @Post('nas/port-forwarding')
  @RequirePermission('servers', 'create')
  @UsePipes(new ZodValidationPipe(portForwardingSchema))
  createPort(@Body() body: PortForwardingInput) {
    return this.servers.createPort(body);
  }

  @Get('mikrotik')
  @RequirePermission('servers', 'view')
  listMikrotik(@Query() query: Record<string, unknown>) {
    return this.servers.listMikrotik(parseListQuery(query));
  }

  @Post('mikrotik')
  @RequirePermission('servers', 'create')
  @UsePipes(new ZodValidationPipe(mikrotikSchema))
  createMikrotik(@Body() body: MikrotikInput) {
    return this.servers.createMikrotik(body);
  }

  @Post('mikrotik/sync-all')
  @RequirePermission('servers', 'update')
  syncAll() {
    return this.servers.syncAll();
  }

  @Post('mikrotik/:id/sync')
  @RequirePermission('servers', 'update')
  syncOne(@Param('id') id: string) {
    return this.servers.syncMikrotik(id);
  }
}
