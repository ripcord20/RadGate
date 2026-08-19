import {
  Bell,
  CreditCard,
  Crown,
  FileText,
  Handshake,
  LayoutDashboard,
  Map,
  MessageCircle,
  Package,
  Receipt,
  Server,
  Settings,
  Ticket,
  Users,
  Wallet,
  Wifi,
  type LucideIcon,
} from 'lucide-react';
import { ROUTES, type ModuleKey } from '@radgate/shared';

export interface NavChild {
  label: string;
  to: string;
}

export interface NavItem {
  /** Kunci izin. Item disembunyikan kalau pengguna tidak punya izin `view` pada modul ini. */
  module: ModuleKey;
  label: string;
  icon: LucideIcon;
  /** Diisi untuk item tanpa submenu. */
  to?: string;
  children?: NavChild[];
}

/**
 * Struktur menu. Satu-satunya tempat urutan dan pengelompokan modul ditentukan.
 * Route detail seperti `/customers/detail/:id` tidak dimunculkan di sini karena hanya
 * dicapai dari dalam halaman daftar.
 */
export const NAV_ITEMS: NavItem[] = [
  {
    module: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    to: ROUTES.dashboard.index,
  },
  {
    module: 'customers',
    label: 'Pelanggan',
    icon: Users,
    children: [
      { label: 'Tambah Pelanggan', to: ROUTES.customers.add },
      { label: 'Semua Pelanggan', to: ROUTES.customers.index },
      { label: 'Anomali Login', to: ROUTES.customers.anomaliLogin },
      { label: 'Devices', to: ROUTES.customers.devices },
      { label: 'Paket Internet', to: ROUTES.customers.packages },
      { label: 'Speed on Demand', to: ROUTES.customers.speedOnDemand },
    ],
  },
  {
    module: 'hotspot',
    label: 'Hotspot',
    icon: Wifi,
    children: [
      { label: 'Voucher', to: ROUTES.hotspot.index },
      { label: 'Profile', to: ROUTES.hotspot.profile },
      { label: 'Rekap', to: ROUTES.hotspot.rekap },
    ],
  },
  {
    module: 'billing',
    label: 'Tagihan',
    icon: Receipt,
    children: [
      { label: 'Tagihan', to: ROUTES.billing.index },
      { label: 'AO', to: ROUTES.billing.ao },
    ],
  },
  {
    module: 'payment_gateway',
    label: 'Payment Gateway',
    icon: CreditCard,
    to: ROUTES.paymentGateway.index,
  },
  {
    module: 'tickets',
    label: 'Tiket',
    icon: Ticket,
    to: ROUTES.tickets.index,
  },
  {
    module: 'resellers',
    label: 'Reseller & Biller',
    icon: Handshake,
    to: ROUTES.resellers.index,
  },
  {
    module: 'finances',
    label: 'Keuangan',
    icon: Wallet,
    to: ROUTES.finances.index,
  },
  {
    module: 'mapping',
    label: 'Pemetaan',
    icon: Map,
    to: ROUTES.mapping.index,
  },
  {
    module: 'inventory',
    label: 'Inventory',
    icon: Package,
    to: ROUTES.inventory.index,
  },
  {
    module: 'servers',
    label: 'Servers',
    icon: Server,
    children: [
      { label: 'NAS', to: ROUTES.servers.nas },
      { label: 'Port Forwarding', to: ROUTES.servers.portForwarding },
      { label: 'Mikrotik', to: ROUTES.servers.mikrotik },
    ],
  },
  {
    module: 'notifications',
    label: 'Pusat Notifikasi',
    icon: Bell,
    to: ROUTES.notifications.index,
  },
  {
    module: 'whatsapp',
    label: 'Whatsapp',
    icon: MessageCircle,
    children: [
      { label: 'Broadcast', to: ROUTES.whatsapp.broadcast },
      { label: 'Template', to: ROUTES.whatsapp.template },
      { label: 'Perangkat Internal', to: ROUTES.whatsapp.internal },
      { label: 'External API', to: ROUTES.whatsapp.externalApi },
    ],
  },
  {
    module: 'reports',
    label: 'Laporan',
    icon: FileText,
    to: ROUTES.reports.index,
  },
  {
    module: 'settings',
    label: 'Pengaturan',
    icon: Settings,
    children: [
      { label: 'Pengaturan', to: ROUTES.settings.index },
      { label: 'Wilayah', to: ROUTES.settings.wilayah },
      { label: 'Manajemen Akun', to: ROUTES.settings.accounts },
      { label: 'APK Pelanggan', to: ROUTES.settings.customerApp },
      { label: 'Log', to: ROUTES.settings.log },
    ],
  },
  {
    module: 'subscription',
    label: 'Langganan Saya',
    icon: Crown,
    children: [
      { label: 'Ikhtisar', to: ROUTES.subscription.index },
      { label: 'Status Langganan', to: ROUTES.subscription.status },
      { label: 'Paket Langganan', to: ROUTES.subscription.plans },
      { label: 'Riwayat Tagihan', to: ROUTES.subscription.billingHistory },
    ],
  },
];
