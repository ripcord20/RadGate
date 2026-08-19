import type { QuotaMetric } from '@radgate/shared';
import { cn, formatNumber } from '@/lib/utils';
import { useApp } from '@/providers/app-provider';

const METRIC_LABELS: Record<QuotaMetric, string> = {
  customers: 'Pelanggan',
  nas: 'NAS',
  mikrotik: 'Mikrotik',
  hotspot_vouchers: 'Voucher',
  whatsapp_messages: 'Pesan WA',
};

/**
 * Bar kuota yang muncul di header modul terkait. Tampilan saja: penegakan kuota
 * sepenuhnya di backend, karena pemeriksaan di sini bisa dilewati siapa pun yang
 * memanggil API langsung.
 */
export function QuotaIndicator({ metric, className }: { metric: QuotaMetric; className?: string }) {
  const { quota } = useApp();
  const usage = quota(metric);
  if (!usage) return null;

  const ratio = usage.limit > 0 ? Math.min(usage.used / usage.limit, 1) : 0;
  const tone =
    ratio >= 1 ? 'bg-destructive' : ratio >= 0.85 ? 'bg-warning' : 'bg-primary';

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className="text-xs text-muted-foreground">
        {METRIC_LABELS[metric]}{' '}
        <span className="tabular font-medium text-foreground">
          {formatNumber(usage.used)}/{formatNumber(usage.limit)}
        </span>
      </span>
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted-foreground/15">
        <div className={cn('h-full rounded-full transition-all', tone)} style={{ width: `${ratio * 100}%` }} />
      </div>
    </div>
  );
}
