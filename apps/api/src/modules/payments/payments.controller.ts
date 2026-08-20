import { Body, Controller, Get, Post, Query, UsePipes } from '@nestjs/common';
import { paymentCheckoutSchema, type PaymentCheckoutInput } from '@radgate/shared';
import { Public, RequirePermission } from '../../common/decorators';
import { parseListQuery } from '../../common/pagination';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { PaymentsService } from './payments.service';

@Controller()
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Get('payments')
  @RequirePermission('payment_gateway', 'view')
  list(@Query() query: Record<string, unknown>) {
    return this.payments.list(parseListQuery(query));
  }

  @Get('payments/summary')
  @RequirePermission('payment_gateway', 'view')
  summary(@Query() query: Record<string, unknown>) {
    return this.payments.summary(parseListQuery(query).wilayahId);
  }

  @Get('payments/by-region')
  @RequirePermission('payment_gateway', 'view')
  byRegion() {
    return this.payments.byRegion();
  }

  @Get('payments/withdrawals')
  @RequirePermission('payment_gateway', 'view')
  withdrawals() {
    return this.payments.withdrawals();
  }

  @Post('payments/checkout')
  @RequirePermission('payment_gateway', 'create')
  @UsePipes(new ZodValidationPipe(paymentCheckoutSchema))
  checkout(@Body() body: PaymentCheckoutInput) {
    return this.payments.checkout(body);
  }

  @Public()
  @Post('webhooks/duitku')
  webhook(@Body() body: { reference?: string; status?: string }) {
    return this.payments.handleWebhook(body);
  }
}
