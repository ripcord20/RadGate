import { Body, Controller, Get, Param, Post, UsePipes } from '@nestjs/common';
import { subscribeSchema, type SubscribeInput } from '@radgate/shared';
import { RequirePermission } from '../../common/decorators';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { SubscriptionService } from './subscription.service';

@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly subscription: SubscriptionService) {}

  @Get()
  @RequirePermission('subscription', 'view')
  overview() {
    return this.subscription.overview();
  }

  @Get('status')
  @RequirePermission('subscription', 'view')
  status() {
    return this.subscription.status();
  }

  @Get('plans')
  @RequirePermission('subscription', 'view')
  plans() {
    return this.subscription.plans();
  }

  @Get('limits')
  @RequirePermission('subscription', 'view')
  limits() {
    return this.subscription.limits();
  }

  @Get('bills')
  @RequirePermission('subscription', 'view')
  bills() {
    return this.subscription.bills();
  }

  @Get('bills/:id')
  @RequirePermission('subscription', 'view')
  bill(@Param('id') id: string) {
    return this.subscription.bill(id);
  }

  @Post('subscribe')
  @RequirePermission('subscription', 'update')
  @UsePipes(new ZodValidationPipe(subscribeSchema))
  subscribe(@Body() body: SubscribeInput) {
    return this.subscription.subscribe(body);
  }
}
