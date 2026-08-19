import { cva, type VariantProps } from 'class-variance-authority';
import type * as React from 'react';
import { cn } from '@/lib/utils';
import type { CustomerStatus, InvoiceStatus, TicketStatus } from '@radgate/shared';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary/10 text-primary',
        neutral: 'border-border bg-muted text-muted-foreground',
        success: 'border-transparent bg-success/12 text-success',
        warning: 'border-transparent bg-warning/18 text-warning-foreground',
        destructive: 'border-transparent bg-destructive/12 text-destructive',
        outline: 'border-border text-foreground',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>['variant']>;

export function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

/*
 * Pemetaan status ke warna disimpan di satu tempat supaya "expired" tidak pernah tampil
 * hijau di satu layar dan merah di layar lain.
 */

export const CUSTOMER_STATUS_VARIANT: Record<CustomerStatus, BadgeVariant> = {
  aktif: 'success',
  expired: 'warning',
  berhenti: 'neutral',
  isolir: 'destructive',
};

export const INVOICE_STATUS_VARIANT: Record<InvoiceStatus, BadgeVariant> = {
  paid: 'success',
  unpaid: 'warning',
  overdue: 'destructive',
  debt: 'destructive',
  cancelled: 'neutral',
};

export const INVOICE_STATUS_LABEL: Record<InvoiceStatus, string> = {
  paid: 'Lunas',
  unpaid: 'Belum Bayar',
  overdue: 'Terlambat',
  debt: 'Hutang',
  cancelled: 'Dibatalkan',
};

export const TICKET_STATUS_VARIANT: Record<TicketStatus, BadgeVariant> = {
  baru: 'warning',
  proses: 'default',
  selesai: 'success',
};
