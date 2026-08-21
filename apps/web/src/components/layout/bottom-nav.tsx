import { NavLink } from 'react-router-dom';
import { CreditCard, Crown, Home, Receipt, Users } from 'lucide-react';
import { ROUTES } from '@radgate/shared';
import { cn } from '@/lib/utils';
import { useApp } from '@/providers/app-provider';

const ITEMS = [
  { module: 'dashboard' as const, label: 'Home', to: ROUTES.dashboard.index, icon: Home },
  { module: 'customers' as const, label: 'Pelanggan', to: ROUTES.customers.index, icon: Users },
  { module: 'billing' as const, label: 'Tagihan', to: ROUTES.billing.index, icon: Receipt },
  { module: 'finances' as const, label: 'Keuangan', to: ROUTES.finances.index, icon: CreditCard },
  { module: 'subscription' as const, label: 'Langganan', to: ROUTES.subscription.index, icon: Crown },
];

/**
 * Pintasan lima modul yang paling sering dibuka petugas di layar sempit. Sidebar tetap
 * menjadi menu lengkap; ini hanya mengganti kebiasaan menggeser laci di ponsel.
 */
export function BottomNav() {
  const { can } = useApp();
  const items = ITEMS.filter((item) => can(item.module));
  if (items.length === 0) return null;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card lg:hidden"
      aria-label="Navigasi bawah"
    >
      <ul
        className="grid h-16"
        style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
      >
        {items.map((item) => (
          <li key={item.to} className="min-w-0">
            <NavLink
              to={item.to}
              className={({ isActive }: { isActive: boolean }) =>
                cn(
                  'flex h-full flex-col items-center justify-center gap-0.5 text-[11px]',
                  isActive ? 'text-primary' : 'text-muted-foreground',
                )
              }
            >
              <item.icon className="size-5" />
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
