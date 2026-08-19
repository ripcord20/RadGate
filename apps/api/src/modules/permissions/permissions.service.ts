import { Injectable } from '@nestjs/common';
import {
  MODULE_KEYS,
  PERMISSION_ACTIONS,
  type ModuleKey,
  type PermissionAction,
  type PermissionMap,
  type Role,
} from '@radgate/shared';
import { PrismaService } from '../../prisma/prisma.service';

const CACHE_TTL_MS = 60_000;

interface CacheEntry {
  map: PermissionMap;
  expiresAt: number;
}

@Injectable()
export class PermissionsService {
  /**
   * Peta izin dibaca pada setiap permintaan oleh guard, tapi hampir tidak pernah berubah.
   * Tanpa cache, setiap endpoint menambah satu query yang selalu menghasilkan baris yang
   * sama. TTL dibuat pendek supaya perubahan izin tetap berlaku tanpa restart.
   */
  private readonly cache = new Map<string, CacheEntry>();

  constructor(private readonly prisma: PrismaService) {}

  async can(
    tenantId: string,
    role: Role,
    module: ModuleKey,
    action: PermissionAction,
  ): Promise<boolean> {
    // Owner tidak dibatasi. Tanpa perkecualian ini, salah konfigurasi izin bisa membuat
    // pemilik akun terkunci dari aplikasinya sendiri.
    if (role === 'owner') return true;

    const map = await this.getMap(tenantId, role);
    return map[module][action];
  }

  async getMap(tenantId: string, role: Role): Promise<PermissionMap> {
    const key = `${tenantId}:${role}`;
    const cached = this.cache.get(key);
    if (cached && cached.expiresAt > Date.now()) return cached.map;

    const rows = await this.prisma.permission.findMany({ where: { tenantId, role } });

    const map = this.emptyMap(role === 'owner');
    for (const row of rows) {
      const moduleKey = row.module as ModuleKey;
      if (!MODULE_KEYS.includes(moduleKey)) continue;
      map[moduleKey] = {
        view: row.canView,
        create: row.canCreate,
        update: row.canUpdate,
        delete: row.canDelete,
      };
    }

    this.cache.set(key, { map, expiresAt: Date.now() + CACHE_TTL_MS });
    return map;
  }

  /** Dipanggil setelah izin diubah, agar perubahan langsung berlaku tanpa menunggu TTL. */
  invalidate(tenantId: string, role?: Role) {
    if (role) {
      this.cache.delete(`${tenantId}:${role}`);
      return;
    }
    for (const key of this.cache.keys()) {
      if (key.startsWith(`${tenantId}:`)) this.cache.delete(key);
    }
  }

  private emptyMap(allowAll: boolean): PermissionMap {
    const map = {} as PermissionMap;
    for (const module of MODULE_KEYS) {
      map[module] = Object.fromEntries(
        PERMISSION_ACTIONS.map((action) => [action, allowAll]),
      ) as PermissionMap[ModuleKey];
    }
    return map;
  }
}
