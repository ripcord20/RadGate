import * as React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { ROUTES } from '@radgate/shared';
import { initials } from '@/lib/utils';
import { pageTitleFromPath } from '@/lib/page-title';
import { useApp } from '@/providers/app-provider';
import { Button } from '@/components/ui/button';
import { Sidebar } from './sidebar';
import { WilayahSwitcher } from './wilayah-switcher';
import { TaskIndicator } from './task-indicator';
import { BottomNav } from './bottom-nav';

export function AppShell() {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const { pathname } = useLocation();
  const { bootstrap } = useApp();
  const title = pageTitleFromPath(pathname);
  const user = bootstrap?.user;

  return (
    <div className="flex min-h-screen bg-muted/60">
      <Sidebar open={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />

      {sidebarOpen && (
        <button
          type="button"
          aria-label="Tutup menu"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-2 bg-primary px-3 text-primary-foreground">
          <Button
            variant="ghost"
            size="icon"
            className="text-primary-foreground hover:bg-white/15 hover:text-primary-foreground lg:hidden"
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label="Buka menu"
          >
            <Menu />
          </Button>

          <h1 className="min-w-0 flex-1 truncate text-center text-base font-semibold tracking-tight lg:text-left">
            {title}
          </h1>

          <div className="hidden items-center gap-2 md:flex">
            <TaskIndicator />
            <WilayahSwitcher />
          </div>

          <Link
            to={ROUTES.profile.detail}
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-semibold"
            aria-label="Profil"
          >
            {user ? initials(user.name) : '--'}
          </Link>
        </header>

        <main className="min-w-0 flex-1 p-4 pb-24 lg:pb-4">
          <div className="mb-3 md:hidden">
            <WilayahSwitcher />
          </div>
          <Outlet />
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
