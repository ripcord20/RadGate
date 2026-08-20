import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UsePipes } from '@nestjs/common';
import { internetPackageSchema, type InternetPackageInput } from '@radgate/shared';
import { RequirePermission } from '../../common/decorators';
import { parseListQuery } from '../../common/pagination';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { PackagesService } from './packages.service';

@Controller('internet-packages')
export class PackagesController {
  constructor(private readonly packages: PackagesService) {}

  @Get()
  @RequirePermission('customers', 'view')
  list(@Query() query: Record<string, unknown>) {
    return this.packages.list(parseListQuery(query));
  }

  @Post()
  @RequirePermission('customers', 'create')
  @UsePipes(new ZodValidationPipe(internetPackageSchema))
  create(@Body() body: InternetPackageInput) {
    return this.packages.create(body);
  }

  @Patch(':id')
  @RequirePermission('customers', 'update')
  update(@Param('id') id: string, @Body() body: Partial<InternetPackageInput>) {
    return this.packages.update(id, internetPackageSchema.partial().parse(body));
  }

  @Delete(':id')
  @RequirePermission('customers', 'delete')
  remove(@Param('id') id: string) {
    return this.packages.remove(id);
  }
}
