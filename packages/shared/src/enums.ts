/**
 * Nilai enum dipakai apa adanya sebagai nilai kolom di PostgreSQL, jadi jangan diubah
 * setelah ada data produksi tanpa migrasi yang menyertainya.
 */

export const ROLES = ['owner', 'admin', 'teknisi', 'reseller', 'biller'] as const;
export type Role = (typeof ROLES)[number];

export const CUSTOMER_STATUSES = ['aktif', 'expired', 'berhenti', 'isolir'] as const;
export type CustomerStatus = (typeof CUSTOMER_STATUSES)[number];

export const BILLING_TYPES = ['prepaid', 'postpaid'] as const;
export type BillingType = (typeof BILLING_TYPES)[number];

export const IP_MODES = ['dhcp', 'static'] as const;
export type IpMode = (typeof IP_MODES)[number];

export const INVOICE_STATUSES = ['unpaid', 'paid', 'overdue', 'debt', 'cancelled'] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const PAYMENT_METHODS = ['cash', 'transfer', 'gateway', 'reseller'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const TICKET_STATUSES = ['baru', 'proses', 'selesai'] as const;
export type TicketStatus = (typeof TICKET_STATUSES)[number];

export const TICKET_PRIORITIES = ['rendah', 'sedang', 'tinggi', 'urgent'] as const;
export type TicketPriority = (typeof TICKET_PRIORITIES)[number];

export const FINANCE_TYPES = ['income', 'expense'] as const;
export type FinanceType = (typeof FINANCE_TYPES)[number];

export const INVENTORY_MOVEMENTS = ['in', 'out'] as const;
export type InventoryMovement = (typeof INVENTORY_MOVEMENTS)[number];

export const RESELLER_TYPES = ['reseller', 'biller'] as const;
export type ResellerType = (typeof RESELLER_TYPES)[number];

export const TASK_STATUSES = ['pending', 'running', 'success', 'failed'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const DEVICE_STATUSES = ['online', 'offline'] as const;
export type DeviceStatus = (typeof DEVICE_STATUSES)[number];

export const WA_PROVIDERS = ['internal', 'external'] as const;
export type WaProvider = (typeof WA_PROVIDERS)[number];

/** Jenis kuota yang ditegakkan paket langganan tenant. */
export const QUOTA_METRICS = [
  'customers',
  'nas',
  'mikrotik',
  'hotspot_vouchers',
  'whatsapp_messages',
] as const;
export type QuotaMetric = (typeof QUOTA_METRICS)[number];
