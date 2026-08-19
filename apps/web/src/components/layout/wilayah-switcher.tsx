import { MapPin } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApp } from '@/providers/app-provider';

const ALL_VALUE = '__all__';

/**
 * Pemilih wilayah global. Nilainya masuk ke setiap kunci query, jadi menggantinya
 * memuat ulang seluruh data yang sedang tampil.
 *
 * Pengguna yang diikat ke satu wilayah tidak melihat kontrol ini sebagai pilihan,
 * melainkan sebagai label mati.
 */
export function WilayahSwitcher() {
  const { activeWilayahId, setActiveWilayahId, wilayahOptions, bootstrap } = useApp();
  const isScoped = !!bootstrap?.user.wilayahId;

  if (isScoped) {
    const own = wilayahOptions[0];
    return (
      <span className="flex h-9 items-center gap-2 rounded-md border border-border bg-muted px-3 text-sm text-muted-foreground">
        <MapPin className="size-4" />
        {own?.name ?? '-'}
      </span>
    );
  }

  return (
    <Select
      value={activeWilayahId ?? ALL_VALUE}
      onValueChange={(value: string) => setActiveWilayahId(value === ALL_VALUE ? null : value)}
    >
      <SelectTrigger className="h-9 w-48">
        <span className="flex items-center gap-2 truncate">
          <MapPin className="size-4 shrink-0 opacity-60" />
          <SelectValue placeholder="Semua Wilayah" />
        </span>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL_VALUE}>Semua Wilayah</SelectItem>
        {wilayahOptions.map((w) => (
          <SelectItem key={w.id} value={w.id}>
            {w.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
