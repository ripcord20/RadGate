import { QueryClient } from '@tanstack/react-query';
import type { NormalizedError } from './api';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        const err = error as unknown as NormalizedError;
        // Galat 4xx tidak akan berubah kalau diulang; hanya galat jaringan dan 5xx yang layak diulang.
        if (err.statusCode >= 400 && err.statusCode < 500) return false;
        return failureCount < 2;
      },
    },
    mutations: {
      retry: false,
    },
  },
});

/**
 * Kunci query dipusatkan supaya invalidasi setelah mutasi tidak bergantung pada string
 * yang ditulis ulang di banyak tempat. Wilayah aktif ikut menjadi bagian kunci karena
 * mengganti wilayah berarti data yang berbeda, bukan data yang sama dengan filter lain.
 */
export const qk = {
  bootstrap: ['bootstrap'] as const,
  tasks: ['tasks'] as const,
  dashboard: (wilayahId: string | null) => ['dashboard', wilayahId] as const,
  customers: (wilayahId: string | null, params?: unknown) =>
    ['customers', wilayahId, params] as const,
  customer: (id: string) => ['customers', 'detail', id] as const,
  packages: (wilayahId: string | null) => ['internet-packages', wilayahId] as const,
  devices: (wilayahId: string | null, params?: unknown) => ['devices', wilayahId, params] as const,
  invoices: (wilayahId: string | null, params?: unknown) => ['invoices', wilayahId, params] as const,
  invoice: (id: string) => ['invoices', 'detail', id] as const,
  payments: (wilayahId: string | null, params?: unknown) => ['payments', wilayahId, params] as const,
  tickets: (wilayahId: string | null, params?: unknown) => ['tickets', wilayahId, params] as const,
  finances: (wilayahId: string | null, params?: unknown) => ['finances', wilayahId, params] as const,
  inventory: (wilayahId: string | null, params?: unknown) =>
    ['inventory', wilayahId, params] as const,
  resellers: (wilayahId: string | null) => ['resellers', wilayahId] as const,
  nas: (wilayahId: string | null) => ['nas', wilayahId] as const,
  mikrotik: (wilayahId: string | null) => ['mikrotik', wilayahId] as const,
  hotspot: (wilayahId: string | null, params?: unknown) => ['hotspot', wilayahId, params] as const,
  mapping: (wilayahId: string | null) => ['mapping', wilayahId] as const,
  reports: (wilayahId: string | null, params?: unknown) => ['reports', wilayahId, params] as const,
  wilayah: ['wilayah'] as const,
  accounts: ['accounts'] as const,
  settings: ['settings'] as const,
  logs: (params?: unknown) => ['logs', params] as const,
  notifications: ['notifications'] as const,
  whatsapp: (scope: string) => ['whatsapp', scope] as const,
  subscription: ['subscription'] as const,
};
