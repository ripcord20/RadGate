import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import type { ApiError } from '@radgate/shared';

const BASE_URL = import.meta.env.VITE_API_URL ?? '/v1';

/**
 * Access token disimpan di memori saja, bukan di localStorage, supaya tidak bisa dibaca
 * lewat XSS. Refresh token ada di cookie HttpOnly yang tidak pernah tersentuh JavaScript.
 * Konsekuensinya token hilang saat halaman di-reload, dan itu wajar: `bootstrap()` pada
 * saat mount akan menukar cookie refresh dengan access token baru.
 */
let accessToken: string | null = null;
let refreshPromise: Promise<string> | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

export const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

async function refreshAccessToken(): Promise<string> {
  // Beberapa request bisa gagal 401 bersamaan. Tanpa penguncian ini, masing-masing akan
  // memanggil refresh dan saling membatalkan token yang baru dibuat.
  refreshPromise ??= axios
    .post<{ accessToken: string }>(`${BASE_URL}/auth/refresh`, null, { withCredentials: true })
    .then((res) => {
      accessToken = res.data.accessToken;
      return res.data.accessToken;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    const config = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;
    const status = error.response?.status;

    const isRefreshCall = config?.url?.includes('/auth/refresh');
    if (status === 401 && config && !config._retried && !isRefreshCall) {
      config._retried = true;
      try {
        const token = await refreshAccessToken();
        config.headers.Authorization = `Bearer ${token}`;
        return api.request(config);
      } catch {
        accessToken = null;
        window.dispatchEvent(new CustomEvent('radgate:unauthenticated'));
      }
    }

    return Promise.reject(normalizeError(error));
  },
);

export interface NormalizedError extends ApiError {
  isNetworkError: boolean;
}

function normalizeError(error: AxiosError<ApiError>): NormalizedError {
  if (!error.response) {
    return {
      statusCode: 0,
      message: 'Tidak dapat menghubungi server. Periksa koneksi jaringan Anda.',
      isNetworkError: true,
    };
  }

  const body = error.response.data;
  const message = typeof body?.message === 'string' ? body.message : undefined;
  if (!message) {
    // Vite mengembalikan 500 HTML saat API di :3000 belum jalan (ECONNREFUSED).
    return {
      statusCode: error.response.status,
      message:
        'Tidak dapat menghubungi server API. Pastikan jendela PowerShell kedua menjalankan npm run dev:api.',
      isNetworkError: true,
    };
  }

  return {
    statusCode: error.response.status,
    message,
    errors: body.errors,
    isNetworkError: false,
  };
}

/**
 * Memetakan galat validasi backend ke `setError` react-hook-form, sehingga pesan muncul
 * di bawah field yang bersangkutan, bukan sebagai toast umum.
 */
export function applyServerErrors(
  error: NormalizedError,
  setError: (field: string, err: { type: string; message: string }) => void,
): boolean {
  if (!error.errors) return false;
  let mapped = false;
  for (const [field, messages] of Object.entries(error.errors)) {
    const message = messages[0];
    if (!message || field === '_') continue;
    setError(field, { type: 'server', message });
    mapped = true;
  }
  return mapped;
}

export async function downloadAuthenticated(
  path: string,
  filename: string,
  params?: Record<string, unknown>,
) {
  const res = await api.get<Blob>(path, { params, responseType: 'blob' });
  const blob = res.data;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
