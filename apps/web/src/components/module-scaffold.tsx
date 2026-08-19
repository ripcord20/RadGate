import type { QuotaMetric } from '@radgate/shared';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableEmpty, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { PageHeader } from './page-header';

export interface ModuleScaffoldProps {
  title: string;
  description?: string;
  quota?: QuotaMetric;
  /** Kolom tabel yang direncanakan, diambil dari `docs/02-modul.md`. */
  columns?: string[];
  /** Tombol aksi yang direncanakan. */
  actions?: string[];
  /** Filter yang direncanakan. */
  filters?: string[];
  /** Endpoint API yang akan dipakai halaman ini, dari `docs/03-api.md`. */
  endpoints?: string[];
  /** Tahap roadmap tempat halaman ini dikerjakan. */
  stage?: string;
}

/**
 * Kerangka halaman yang belum diimplementasikan. Sengaja menampilkan kolom, aksi, filter,
 * dan endpoint yang direncanakan, bukan tulisan "coming soon", supaya kerangka route
 * sekaligus berfungsi sebagai daftar pekerjaan yang bisa ditelusuri di aplikasi.
 */
export function ModuleScaffold({
  title,
  description,
  quota,
  columns,
  actions,
  filters,
  endpoints,
  stage,
}: ModuleScaffoldProps) {
  return (
    <div>
      <PageHeader
        title={title}
        description={description}
        quota={quota}
        actions={actions?.map((label) => (
          <Button key={label} variant="outline" size="sm" disabled>
            {label}
          </Button>
        ))}
      />

      {filters && filters.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {filters.map((f) => (
            <span
              key={f}
              className="rounded-md border border-dashed border-border px-2.5 py-1 text-xs text-muted-foreground"
            >
              {f}
            </span>
          ))}
        </div>
      )}

      <Card>
        {columns && columns.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((c) => (
                  <TableHead key={c}>{c}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableEmpty colSpan={columns.length} message="Belum diimplementasikan" />
            </TableBody>
          </Table>
        ) : (
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Belum diimplementasikan
          </CardContent>
        )}
      </Card>

      {(endpoints?.length || stage) && (
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {stage && <span>Dikerjakan pada {stage}</span>}
          {endpoints?.length ? <span className="font-mono">{endpoints.join('  ')}</span> : null}
        </div>
      )}
    </div>
  );
}
