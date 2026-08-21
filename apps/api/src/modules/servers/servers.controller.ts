import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UsePipes } from '@nestjs/common';
import {
  mikrotikSchema,
  nasMigrateSchema,
  nasPatchSchema,
  nasSchema,
  portForwardingSchema,
  type MikrotikInput,
  type NasInput,
  type NasMigrateInput,
  type NasPatchInput,
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

  @Post('nas/:id/default')
  @RequirePermission('servers', 'update')
  setDefaultNas(@Param('id') id: string) {
    return this.servers.setDefaultNas(id);
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

  @Post('nas/migrate')
  @RequirePermission('servers', 'update')
  @UsePipes(new ZodValidationPipe(nasMigrateSchema))
  migrateNas(@Body() body: NasMigrateInput) {
    return this.servers.migrateNas(body);
  }

  @Get('nas/:id')
  @RequirePermission('servers', 'view')
  nasDetail(@Param('id') id: string, @Query('reveal') reveal?: string) {
    return this.servers.nasDetail(id, reveal === '1' || reveal === 'true');
  }

  @Patch('nas/:id')
  @RequirePermission('servers', 'update')
  @UsePipes(new ZodValidationPipe(nasPatchSchema))
  updateNas(@Param('id') id: string, @Body() body: NasPatchInput) {
    return this.servers.updateNas(id, body);
  }

  @Delete('nas/:id')
  @RequirePermission('servers', 'delete')
  removeNas(@Param('id') id: string) {
    return this.servers.removeNas(id);
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
