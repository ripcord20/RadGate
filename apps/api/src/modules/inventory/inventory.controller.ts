import { Body, Controller, Get, Post, Query, UsePipes } from '@nestjs/common';
import { z } from 'zod';
import { inventoryItemSchema, inventoryMovementSchema, type InventoryItemInput, type InventoryMovementInput } from '@radgate/shared';
import { RequirePermission } from '../../common/decorators';
import { parseListQuery } from '../../common/pagination';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { InventoryService } from './inventory.service';

const categorySchema = z.object({ name: z.string().trim().min(1).max(100) });

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventory: InventoryService) {}

  @Get('items')
  @RequirePermission('inventory', 'view')
  items(@Query() query: Record<string, unknown>) {
    return this.inventory.items(parseListQuery(query));
  }

  @Post('items')
  @RequirePermission('inventory', 'create')
  @UsePipes(new ZodValidationPipe(inventoryItemSchema))
  createItem(@Body() body: InventoryItemInput) {
    return this.inventory.createItem(body);
  }

  @Get('categories')
  @RequirePermission('inventory', 'view')
  categories() {
    return this.inventory.categories();
  }

  @Post('categories')
  @RequirePermission('inventory', 'create')
  @UsePipes(new ZodValidationPipe(categorySchema))
  createCategory(@Body() body: { name: string }) {
    return this.inventory.createCategory(body.name);
  }

  @Get('transactions')
  @RequirePermission('inventory', 'view')
  transactions(@Query() query: Record<string, unknown>) {
    return this.inventory.transactions(parseListQuery(query));
  }

  @Post('transactions')
  @RequirePermission('inventory', 'create')
  @UsePipes(new ZodValidationPipe(inventoryMovementSchema))
  move(@Body() body: InventoryMovementInput) {
    return this.inventory.move(body);
  }
}
