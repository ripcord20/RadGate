import { AsyncLocalStorage } from 'node:async_hooks';
import type { Role } from '@radgate/shared';

export interface RequestScope {
  userId: string;
  tenantId: string;
  role: Role;
  /**
   * `null` berarti pengguna boleh mengakses seluruh wilayah tenant. Nilai selain `null`
   * adalah batas keras: query apa pun wajib disaring ke wilayah ini.
   */
  wilayahId: string | null;
}

/**
 * Scope permintaan disimpan di AsyncLocalStorage, bukan diteruskan sebagai argumen ke
 * setiap fungsi service.
 *
 * Alasannya bukan kenyamanan. Kalau `tenantId` harus dititipkan sebagai parameter,
 * suatu saat akan ada satu query yang lupa menerimanya, dan kelalaian itu berarti data
 * satu operator terbaca oleh operator lain. Dengan pola ini lapisan repository selalu
 * bisa membaca scope tanpa bergantung pada disiplin pemanggilnya.
 */
const storage = new AsyncLocalStorage<RequestScope>();

export function runWithScope<T>(scope: RequestScope, fn: () => T): T {
  return storage.run(scope, fn);
}

export function getScope(): RequestScope | undefined {
  return storage.getStore();
}

/**
 * Dipakai lapisan repository. Melempar galat, tidak mengembalikan `undefined`, karena
 * query yang berjalan tanpa scope adalah bug yang harus berhenti keras di pengembangan,
 * bukan diam-diam mengembalikan data seluruh tenant di produksi.
 */
export function requireScope(): RequestScope {
  const scope = storage.getStore();
  if (!scope) {
    throw new Error(
      'Scope permintaan tidak tersedia. Query dijalankan di luar konteks permintaan yang terautentikasi.',
    );
  }
  return scope;
}

/**
 * Menghasilkan potongan `where` untuk Prisma. Wilayah hanya disaring bila pengguna
 * memang dibatasi; pengguna lintas-wilayah memakai filter wilayah pilihannya sendiri
 * yang datang dari query string.
 */
export function tenantWhere(selectedWilayahId?: string | null) {
  const scope = requireScope();
  const wilayahId = scope.wilayahId ?? selectedWilayahId ?? undefined;
  return wilayahId ? { tenantId: scope.tenantId, wilayahId } : { tenantId: scope.tenantId };
}
