import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';

/**
 * Filter wilayah/status/pencarian yang berulang di hampir semua modul. Tombol reset
 * mengembalikan semua kontrol ke nilai awal pemanggil, bukan ke nilai hardcoded di sini.
 */
export function FilterBar({ children, onReset }: { children: ReactNode; onReset: () => void }) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      {children}
      <Button type="button" variant="outline" size="sm" onClick={onReset}>
        Reset Filter
      </Button>
    </div>
  );
}

export const filterControlClass =
  'h-9 rounded-md border border-input bg-background px-2 text-sm';
