import * as React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ChevronDown, LogOut } from 'lucide-react';
import { cn, initials } from '@/lib/utils';
import { useApp } from '@/providers/app-provider';
import { NAV_ITEMS, type NavItem } from './nav-config';

function isGroupActive(item: NavItem, pathname: string) {
  return item.children?.some((c) => pathname === c.to || pathname.startsWith(`${c.to}/`)) ?? false;
}

function NavGroup({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = isGroupActive(item, pathname);
  // Grup yang memuat halaman aktif harus sudah terbuka setelah reload, bukan menutup dan
  // membuat pengguna kehilangan jejak posisinya.
  const [open, setOpen] = React.useState(active);

  React.useEffect(() => {
    if (active) setOpen(true);
  }, [active]);

  const Icon = item.icon;

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cn(
          'flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors',
          active
            ? 'bg-white/15 font-medium text-white'
            : 'text-white/80 hover:bg-white/10 hover:text-white',
        )}
      >
        <span className="flex items-center gap-3">
          <Icon className="size-[18px] shrink-0" />
          {item.label}
        </span>
        <ChevronDown className={cn('size-4 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="ml-4 mt-1 space-y-0.5 border-l border-sidebar-border pl-3">
          {item.children?.map((child) => (
            <NavLink
              key={child.to}
              to={child.to}
              end
              className={({ isActive }: { isActive: boolean }) =>
                cn(
                  'block rounded-md px-3 py-1.5 text-[13px] transition-colors',
                  isActive
                    ? 'bg-white/15 font-medium text-white'
                    : 'text-white/70 hover:bg-white/10 hover:text-white',
                )
              }
            >
              {child.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

export function Sidebar({ open, onNavigate }: { open: boolean; onNavigate?: () => void }) {
  const { pathname } = useLocation();
  const { bootstrap, can, logout } = useApp();
  const user = bootstrap?.user;

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-sidebar text-sidebar-foreground transition-transform lg:static lg:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full',
      )}
    >
      <div className="flex h-14 items-center border-b border-sidebar-border px-4">
        {bootstrap?.settings.logoUrl ? (
          <img
            src={bootstrap.settings.logoUrl}
            alt={bootstrap.settings.companyName}
            className="max-h-9 object-contain"
          />
        ) : (
          <span className="text-base font-semibold tracking-tight">
            {bootstrap?.settings.companyName ?? 'RadGate'}
          </span>
        )}
      </div>

      <div className="px-4 py-4">
        <div className="flex items-center gap-3 rounded-lg bg-white/5 p-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-sm font-medium">
            {user ? initials(user.name) : '--'}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{user?.name ?? 'Memuat...'}</p>
            <p className="truncate text-xs text-white/60">{user?.role ?? ''}</p>
          </div>
        </div>
      </div>

      <nav
        onClick={onNavigate}
        className="flex-1 space-y-1 overflow-y-auto px-3 pb-4"
        aria-label="Menu utama"
      >
        <p className="mb-3 px-3 text-xs font-medium uppercase tracking-wider text-white/50">
          Menu Utama
        </p>

        {/* Modul yang tidak diizinkan untuk peran ini tidak dirender sama sekali. */}
        {NAV_ITEMS.filter((item) => can(item.module)).map((item) =>
          item.children ? (
            <NavGroup key={item.module} item={item} pathname={pathname} />
          ) : (
            <NavLink
              key={item.module}
              to={item.to ?? '/'}
              className={({ isActive }: { isActive: boolean }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-white/15 font-medium text-white'
                    : 'text-white/80 hover:bg-white/10 hover:text-white',
                )
              }
            >
              <item.icon className="size-[18px] shrink-0" />
              {item.label}
            </NavLink>
          ),
        )}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <button
          type="button"
          onClick={() => void logout()}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-white/80 transition-colors hover:bg-white/10 hover:text-white"
        >
          <LogOut className="size-[18px]" />
          Keluar
        </button>
      </div>
    </aside>
  );
}
