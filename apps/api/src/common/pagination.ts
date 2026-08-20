import type { Paginated } from '@radgate/shared';

export interface ListQuery {
  page: number;
  perPage: number;
  search?: string;
  sortBy?: string;
  sortDir: 'asc' | 'desc';
  wilayahId?: string | null;
  status?: string;
}

/**
 * Menerima camelCase dan snake_case. Kontrak di docs/03-api.md memakai snake_case,
 * tipe TypeScript memakai camelCase; keduanya harus sampai ke query yang sama.
 */
export function parseListQuery(query: Record<string, unknown>): ListQuery {
  const page = Math.max(1, toInt(query.page, 1));
  const perPage = Math.min(100, Math.max(1, toInt(query.perPage ?? query.per_page, 25)));
  const search = typeof query.search === 'string' ? query.search.trim() : '';
  const sortBy = typeof query.sort === 'string' ? query.sort : typeof query.sortBy === 'string' ? query.sortBy : undefined;
  const order = query.order ?? query.sortDir;
  const sortDir = order === 'asc' || order === 'desc' ? order : 'desc';
  const rawWilayah = query.wilayahId ?? query.wilayah_id;
  const wilayahId = typeof rawWilayah === 'string' && rawWilayah.length > 0 ? rawWilayah : null;
  const status = typeof query.status === 'string' && query.status.length > 0 ? query.status : undefined;

  return {
    page,
    perPage,
    search: search || undefined,
    sortBy,
    sortDir,
    wilayahId,
    status,
  };
}

export function paginated<T>(data: T[], total: number, query: ListQuery): Paginated<T> {
  return {
    data,
    meta: {
      page: query.page,
      perPage: query.perPage,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.perPage)),
    },
  };
}

function toInt(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}
