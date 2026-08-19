import type * as React from 'react';
import type { QuotaMetric } from '@radgate/shared';
import { cn } from '@/lib/utils';
import { QuotaIndicator } from './layout/quota-indicator';

interface PageHeaderProps {
  title: string;
  description?: string;
  /** Bar kuota ditampilkan pada modul yang pembuatan datanya dibatasi paket langganan. */
  quota?: QuotaMetric;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, quota, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('mb-4 flex flex-wrap items-start justify-between gap-3', className)}>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
          {quota && <QuotaIndicator metric={quota} />}
        </div>
        {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
