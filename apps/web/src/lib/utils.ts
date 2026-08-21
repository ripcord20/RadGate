import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/*
 * Formatter menerima null dan undefined dengan sengaja. Nilainya datang dari respons API
 * yang sedang dimuat atau dari kolom nullable, dan memaksa setiap pemanggil menulis
 * pemeriksaan sendiri hanya menyebarkan `?? 0` yang menyamarkan data kosong sebagai nol.
 */

/** Nominal disimpan sebagai bilangan bulat rupiah penuh, jadi tidak ada pembagian seratus. */
export function formatRupiah(value: number | null | undefined): string {
  if (value == null) return '-';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number | null | undefined): string {
  if (value == null) return '-';
  return new Intl.NumberFormat('id-ID').format(value);
}

export function formatSpeed(mbps: number | null | undefined): string {
  if (mbps == null) return '-';
  return mbps >= 1000 ? `${(mbps / 1000).toFixed(mbps % 1000 === 0 ? 0 : 1)} Gbps` : `${mbps} Mbps`;
}

/** Byte dari accounting RADIUS bisa mencapai terabyte, jadi satuannya naik sampai TB. */
export function formatBytes(bytes: number | null | undefined): string {
  if (bytes == null) return '-';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(unit === 0 ? 0 : 2)} ${units[unit]}`;
}

export function formatUptime(seconds: number | null | undefined): string {
  if (seconds == null) return '-';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}h ${hours}j`;
  if (hours > 0) return `${hours}j ${minutes}m`;
  return `${minutes}m`;
}

/**
 * Menyeragamkan input petugas ke 62xxx. 08…, +62, spasi, dan tanda hubung
 * sering diketik di form; skema backend hanya menerima 62 diikuti digit.
 */
export function toPhone62(raw: string | null | undefined): string {
  const digits = (raw ?? '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('62')) return digits;
  if (digits.startsWith('0')) return `62${digits.slice(1)}`;
  return digits;
}

/** Nomor disimpan sebagai 62xxx; ditampilkan berkelompok agar mudah dibaca petugas. */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return '-';
  const digits = phone.replace(/\D/g, '');
  if (!digits.startsWith('62')) return phone;
  return `+62 ${digits.slice(2).replace(/(\d{3})(?=\d)/g, '$1-')}`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? '')
    .join('')
    .toUpperCase();
}
