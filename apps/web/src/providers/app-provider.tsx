import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  BootstrapResponse,
  ModuleKey,
  PermissionAction,
  QuotaMetric,
  QuotaUsage,
  Wilayah,
} from '@radgate/shared';
import { api, setAccessToken } from '@/lib/api';
import { qk } from '@/lib/query';

const WILAYAH_STORAGE_KEY = 'radgate.wilayah';

interface AppContextValue {
  bootstrap: BootstrapResponse | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  /** `null` berarti "Semua Wilayah" sebatas yang boleh diakses pengguna. */
  activeWilayahId: string | null;
  setActiveWilayahId: (id: string | null) => void;
  wilayahOptions: Wilayah[];
  can: (module: ModuleKey, action?: PermissionAction) => boolean;
  quota: (metric: QuotaMetric) => QuotaUsage | undefined;
  hasQuotaLeft: (metric: QuotaMetric) => boolean;
  logout: () => Promise<void>;
  refresh: () => Promise<unknown>;
}

const AppContext = React.createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [activeWilayahId, setActiveWilayahIdState] = React.useState<string | null>(
    () => localStorage.getItem(WILAYAH_STORAGE_KEY) || null,
  );

  const bootstrapQuery = useQuery({
    queryKey: qk.bootstrap,
    queryFn: async () => {
      // Menukar cookie refresh dengan access token baru. Ini yang membuat sesi bertahan
      // setelah reload meskipun access token hanya disimpan di memori.
      const session = await api.post<{ accessToken: string }>('/auth/refresh');
      setAccessToken(session.data.accessToken);
      const { data } = await api.get<BootstrapResponse>('/bootstrap');
      return data;
    },
    retry: false,
    staleTime: 5 * 60_000,
  });

  const bootstrap = bootstrapQuery.data ?? null;

  // Interceptor axios menyiarkan event ini ketika refresh token sudah tidak berlaku.
  React.useEffect(() => {
    const onUnauthenticated = () => {
      setAccessToken(null);
      queryClient.setQueryData(qk.bootstrap, null);
      queryClient.clear();
    };
    window.addEventListener('radgate:unauthenticated', onUnauthenticated);
    return () => window.removeEventListener('radgate:unauthenticated', onUnauthenticated);
  }, [queryClient]);

  const setActiveWilayahId = React.useCallback(
    (id: string | null) => {
      setActiveWilayahIdState(id);
      if (id) localStorage.setItem(WILAYAH_STORAGE_KEY, id);
      else localStorage.removeItem(WILAYAH_STORAGE_KEY);
      // Setiap kunci query memuat wilayah aktif, jadi mengganti wilayah cukup dengan
      // membatalkan seluruh cache daftar tanpa memaksa reload halaman.
      queryClient.invalidateQueries();
    },
    [queryClient],
  );

  /**
   * Pengguna yang diikat ke satu wilayah tidak boleh memilih wilayah lain, dan tidak
   * boleh memilih "Semua Wilayah". Pembatasan ini juga ditegakkan di backend; di sini
   * hanya agar pilihan yang mustahil tidak ditampilkan.
   */
  const wilayahOptions = React.useMemo(() => {
    if (!bootstrap) return [];
    const scoped = bootstrap.user.wilayahId;
    if (!scoped) return bootstrap.wilayah;
    return bootstrap.wilayah.filter((w) => w.id === scoped);
  }, [bootstrap]);

  React.useEffect(() => {
    if (!bootstrap) return;
    const scoped = bootstrap.user.wilayahId;
    if (scoped && activeWilayahId !== scoped) {
      setActiveWilayahId(scoped);
      return;
    }
    // Wilayah yang tersimpan bisa sudah dihapus atau dinonaktifkan sejak sesi terakhir.
    if (activeWilayahId && !bootstrap.wilayah.some((w) => w.id === activeWilayahId)) {
      setActiveWilayahId(null);
    }
  }, [bootstrap, activeWilayahId, setActiveWilayahId]);

  const can = React.useCallback(
    (module: ModuleKey, action: PermissionAction = 'view') => {
      const perms = bootstrap?.permissions[module];
      return perms ? perms[action] : false;
    },
    [bootstrap],
  );

  const quota = React.useCallback(
    (metric: QuotaMetric) => bootstrap?.quotas.find((q) => q.metric === metric),
    [bootstrap],
  );

  const hasQuotaLeft = React.useCallback(
    (metric: QuotaMetric) => {
      const q = quota(metric);
      if (!q) return true;
      return q.used < q.limit;
    },
    [quota],
  );

  const logout = React.useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      setAccessToken(null);
      localStorage.removeItem(WILAYAH_STORAGE_KEY);
      queryClient.clear();
      queryClient.setQueryData(qk.bootstrap, null);
    }
  }, [queryClient]);

  const value = React.useMemo<AppContextValue>(
    () => ({
      bootstrap,
      isLoading: bootstrapQuery.isLoading,
      isAuthenticated: !!bootstrap,
      activeWilayahId,
      setActiveWilayahId,
      wilayahOptions,
      can,
      quota,
      hasQuotaLeft,
      logout,
      refresh: () => queryClient.invalidateQueries({ queryKey: qk.bootstrap }),
    }),
    [
      bootstrap,
      bootstrapQuery.isLoading,
      activeWilayahId,
      setActiveWilayahId,
      wilayahOptions,
      can,
      quota,
      hasQuotaLeft,
      logout,
      queryClient,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = React.useContext(AppContext);
  if (!ctx) throw new Error('useApp harus dipakai di dalam AppProvider');
  return ctx;
}

/** Pintasan yang dipakai hampir setiap query daftar. */
export function useActiveWilayah() {
  return useApp().activeWilayahId;
}
