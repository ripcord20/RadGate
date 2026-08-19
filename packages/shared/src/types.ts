import type { ModuleKey, PermissionMap } from './modules.js';
import type { QuotaMetric, Role, TaskStatus } from './enums.js';

/** Semua endpoint daftar memakai bentuk ini, sehingga komponen tabel bisa generik. */
export interface Paginated<T> {
  data: T[];
  meta: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

export interface ListQuery {
  page?: number;
  perPage?: number;
  search?: string;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  /** `null` berarti seluruh wilayah yang boleh diakses pengguna. */
  wilayahId?: string | null;
}

export interface ApiError {
  statusCode: number;
  message: string;
  /** Diisi pada kegagalan validasi, dipetakan ke field form oleh react-hook-form. */
  errors?: Record<string, string[]>;
}

export interface Wilayah {
  id: string;
  name: string;
  code: string;
  logoUrl: string | null;
  isActive: boolean;
}

export interface AuthUser {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  phone: string | null;
  role: Role;
  /** `null` berarti akses ke seluruh wilayah tenant. */
  wilayahId: string | null;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

/**
 * Muatan yang dibutuhkan app shell. Digabung jadi satu endpoint supaya tidak perlu enam
 * request terpisah di setiap perpindahan halaman, seperti yang terjadi pada sistem yang
 * dianalisis.
 */
export interface BootstrapResponse {
  user: AuthUser;
  permissions: PermissionMap;
  wilayah: Wilayah[];
  quotas: QuotaUsage[];
  settings: TenantSettings;
  runningTasks: Task[];
}

export interface QuotaUsage {
  metric: QuotaMetric;
  used: number;
  limit: number;
}

export interface TenantSettings {
  companyName: string;
  logoUrl: string | null;
  address: string | null;
  phone: string | null;
  taxEnabled: boolean;
  taxPercent: number;
  currency: string;
  timezone: string;
}

export interface Task {
  id: string;
  type: string;
  status: TaskStatus;
  progress: number;
  total: number;
  error: string | null;
  createdAt: string;
  finishedAt: string | null;
}

export interface ModuleSummary {
  module: ModuleKey;
  metrics: Record<string, number>;
}
