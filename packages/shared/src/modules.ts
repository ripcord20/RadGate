/**
 * Registry modul. Satu sumber kebenaran untuk kunci izin, dipakai oleh guard di backend
 * dan oleh context izin di frontend. Menambah modul berarti menambah entri di sini,
 * bukan menuliskan string izin di tempat yang tersebar.
 */

export const MODULE_KEYS = [
  'dashboard',
  'customers',
  'hotspot',
  'billing',
  'payment_gateway',
  'tickets',
  'resellers',
  'finances',
  'mapping',
  'inventory',
  'servers',
  'notifications',
  'whatsapp',
  'reports',
  'settings',
  'subscription',
] as const;

export type ModuleKey = (typeof MODULE_KEYS)[number];

export const MODULE_LABELS: Record<ModuleKey, string> = {
  dashboard: 'Dashboard',
  customers: 'Pelanggan',
  hotspot: 'Hotspot',
  billing: 'Tagihan',
  payment_gateway: 'Payment Gateway',
  tickets: 'Tiket',
  resellers: 'Reseller & Biller',
  finances: 'Keuangan',
  mapping: 'Pemetaan',
  inventory: 'Inventory',
  servers: 'Servers',
  notifications: 'Pusat Notifikasi',
  whatsapp: 'Whatsapp',
  reports: 'Laporan',
  settings: 'Pengaturan',
  subscription: 'Langganan Saya',
};

export const PERMISSION_ACTIONS = ['view', 'create', 'update', 'delete'] as const;
export type PermissionAction = (typeof PERMISSION_ACTIONS)[number];

export type ModulePermissions = Record<PermissionAction, boolean>;
export type PermissionMap = Record<ModuleKey, ModulePermissions>;

/**
 * Seluruh path route aplikasi, dikelompokkan per modul. Dipakai untuk membangun router
 * dan untuk memetakan route aktif ke kunci izin modulnya.
 */
export const ROUTES = {
  public: {
    login: '/login',
    register: '/register',
    forgotPassword: '/forgot-password',
    resetPassword: '/reset-password',
  },
  profile: {
    detail: '/profile',
    edit: '/profile/edit',
  },
  dashboard: {
    index: '/dashboard',
  },
  customers: {
    index: '/customers',
    add: '/customers/add',
    edit: '/customers/edit/:id',
    detail: '/customers/detail/:id',
    anomaliLogin: '/customers/anomali-login',
    devices: '/customers/devices',
    packages: '/customers/packages',
    speedOnDemand: '/customers/speed-on-demand',
    layanan: '/customers/layanan',
  },
  hotspot: {
    index: '/hotspot',
    profile: '/hotspot/profile',
    rekap: '/hotspot/rekap',
    embed: '/hotspot/embed/:id',
  },
  billing: {
    index: '/billing',
    generate: '/billing/generate',
    detail: '/billing/detail/:id',
    ao: '/ao',
    aoActive: '/ao/active',
    aoDetail: '/ao/detail/:id',
  },
  paymentGateway: {
    index: '/payment-gateway',
  },
  tickets: {
    index: '/tiket',
    create: '/tiket/buat',
    detail: '/tiket/detail/:id',
  },
  resellers: {
    index: '/reseller',
    customers: '/reseller/pelanggan',
    log: '/reseller/log',
    pay: '/reseller/pay',
  },
  finances: {
    index: '/finances',
  },
  mapping: {
    index: '/pemetaan',
  },
  inventory: {
    index: '/inventory',
  },
  servers: {
    nas: '/nas',
    portForwarding: '/nas/port-forwarding',
    mikrotik: '/mikrotik',
    mikrotikAdd: '/mikrotik/add',
    mikrotikEdit: '/mikrotik/edit/:id',
  },
  notifications: {
    index: '/notifications-center',
  },
  whatsapp: {
    externalApi: '/whatsapp',
    broadcast: '/whatsapp/broadcast',
    broadcastNew: '/whatsapp/broadcast/new',
    template: '/whatsapp/template',
    internal: '/whatsapp/internal',
    inbox: '/whatsapp/inbox/:number',
  },
  reports: {
    index: '/reports',
  },
  settings: {
    index: '/settings',
    import: '/settings/import',
    importExcel: '/settings/import/excel',
    export: '/settings/export',
    wilayah: '/wilayah',
    accounts: '/accounts',
    customerApp: '/apppelanggan',
    log: '/log',
  },
  subscription: {
    index: '/subscription',
    status: '/subscription/status',
    plans: '/subscription/plans',
    billingHistory: '/subscription/billing-history',
    bill: '/subscription/bill/:id',
    payment: '/subscription/payment/:id',
    confirm: '/subscription/confirm',
  },
} as const;
