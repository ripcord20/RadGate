import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UsePipes } from '@nestjs/common';
import { accountSchema, type AccountInput } from '@radgate/shared';
import { RequirePermission } from '../../common/decorators';
import { parseListQuery } from '../../common/pagination';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { AccountsService } from './accounts.service';

@Controller('accounts')
export class AccountsController {
  constructor(private readonly accounts: AccountsService) {}

  @Get()
  @RequirePermission('settings', 'view')
  list(@Query() query: Record<string, unknown>) {
    return this.accounts.list(parseListQuery(query));
  }

  @Post()
  @RequirePermission('settings', 'create')
  @UsePipes(new ZodValidationPipe(accountSchema))
  create(@Body() body: AccountInput) {
    return this.accounts.create(body);
  }

  @Patch(':id')
  @RequirePermission('settings', 'update')
  update(@Param('id') id: string, @Body() body: Partial<AccountInput>) {
    return this.accounts.update(id, accountSchema.partial().parse(body));
  }

  @Delete(':id')
  @RequirePermission('settings', 'delete')
  remove(@Param('id') id: string) {
    return this.accounts.remove(id);
  }
}
