import { Body, Controller, Get, Header, Param, Post, Query, Res, UsePipes } from '@nestjs/common';
import type { Response } from 'express';
import {
  generateInvoiceSchema,
  invoicePaymentSchema,
  type GenerateInvoiceInput,
  type InvoicePaymentInput,
} from '@radgate/shared';
import { RequirePermission } from '../../common/decorators';
import { parseListQuery } from '../../common/pagination';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { BillingService } from './billing.service';

@Controller('billing')
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  @Get()
  @RequirePermission('billing', 'view')
  list(@Query() query: Record<string, unknown>) {
    return this.billing.list(parseListQuery(query), {
      periodMonth: query.periodMonth ? Number(query.periodMonth) : undefined,
      periodYear: query.periodYear ? Number(query.periodYear) : undefined,
    });
  }

  @Get('summary')
  @RequirePermission('billing', 'view')
  summary(@Query() query: Record<string, unknown>) {
    return this.billing.summary(parseListQuery(query).wilayahId);
  }

  @Get(':id/invoice.pdf')
  @RequirePermission('billing', 'view')
  @Header('Content-Type', 'application/pdf')
  async invoicePdf(@Param('id') id: string, @Res() res: Response) {
    const pdf = await this.billing.invoicePdf(id);
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${id}.pdf"`);
    res.send(Buffer.from(pdf));
  }

  @Get(':id')
  @RequirePermission('billing', 'view')
  detail(@Param('id') id: string) {
    return this.billing.detail(id);
  }

  @Post('generate')
  @RequirePermission('billing', 'create')
  @UsePipes(new ZodValidationPipe(generateInvoiceSchema))
  generate(@Body() body: GenerateInvoiceInput) {
    return this.billing.generate(body);
  }

  @Post(':id/pay')
  @RequirePermission('billing', 'update')
  @UsePipes(new ZodValidationPipe(invoicePaymentSchema))
  pay(@Param('id') id: string, @Body() body: InvoicePaymentInput) {
    return this.billing.pay(id, body);
  }

  @Post(':id/reminder')
  @RequirePermission('billing', 'update')
  reminder(@Param('id') id: string) {
    return this.billing.detail(id).then((invoice) => ({
      ok: true,
      invoiceId: invoice.id,
      message: 'Reminder dijadwalkan lewat antrean WhatsApp',
    }));
  }
}
