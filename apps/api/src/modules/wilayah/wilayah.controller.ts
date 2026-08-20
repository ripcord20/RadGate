import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UsePipes } from '@nestjs/common';
import { wilayahSchema, type WilayahInput } from '@radgate/shared';
import { RequirePermission } from '../../common/decorators';
import { parseListQuery } from '../../common/pagination';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { WilayahService } from './wilayah.service';

@Controller('wilayah')
export class WilayahController {
  constructor(private readonly wilayah: WilayahService) {}

  @Get()
  @RequirePermission('settings', 'view')
  list(@Query() query: Record<string, unknown>) {
    return this.wilayah.list(parseListQuery(query));
  }

  @Post()
  @RequirePermission('settings', 'create')
  @UsePipes(new ZodValidationPipe(wilayahSchema))
  create(@Body() body: WilayahInput) {
    return this.wilayah.create(body);
  }

  @Patch(':id')
  @RequirePermission('settings', 'update')
  update(@Param('id') id: string, @Body() body: Partial<WilayahInput>) {
    return this.wilayah.update(id, wilayahSchema.partial().parse(body));
  }

  @Delete(':id')
  @RequirePermission('settings', 'delete')
  remove(@Param('id') id: string) {
    return this.wilayah.remove(id);
  }
}
