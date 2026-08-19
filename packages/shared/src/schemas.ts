import { z } from 'zod';
import {
  BILLING_TYPES,
  CUSTOMER_STATUSES,
  FINANCE_TYPES,
  INVENTORY_MOVEMENTS,
  INVOICE_STATUSES,
  IP_MODES,
  PAYMENT_METHODS,
  RESELLER_TYPES,
  ROLES,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
} from './enums.js';

/**
 * Skema ini dipakai bersama frontend dan backend. Frontend memakainya sebagai resolver
 * react-hook-form, backend memakainya sebagai validation pipe. Satu definisi, sehingga
 * aturan validasi tidak bisa berbeda antara keduanya.
 */

const uuid = z.string().uuid();
const rupiah = z.number().int().min(0);
const optionalText = z.string().trim().max(500).nullish();

/** Nomor telepon disimpan dalam format 62xxx tanpa tanda plus atau spasi. */
export const phoneSchema = z
  .string()
  .trim()
  .regex(/^62\d{8,13}$/, 'Nomor harus diawali 62 tanpa tanda plus, contoh: 6281234567890');

/**
 * Sengaja tanpa `.default()`. Default membuat tipe masukan berbeda dari tipe keluaran,
 * dan react-hook-form menolak resolver yang kedua tipenya tidak sama. Nilai awal field
 * diatur lewat `defaultValues` di form, bukan di skema.
 */
export const loginSchema = z.object({
  email: z.string().trim().email('Format email tidak valid'),
  password: z.string().min(8, 'Password minimal 8 karakter'),
  rememberEmail: z.boolean(),
  recaptchaToken: z.string().min(1),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const wilayahSchema = z.object({
  name: z.string().trim().min(1, 'Nama wilayah wajib diisi').max(100),
  /** Dipakai sebagai awalan kode pelanggan, jadi tidak boleh diubah setelah terpakai. */
  code: z
    .string()
    .trim()
    .min(2)
    .max(10)
    .regex(/^[A-Z0-9-]+$/, 'Kode hanya boleh huruf kapital, angka, dan tanda hubung'),
  isActive: z.boolean().default(true),
});
export type WilayahInput = z.infer<typeof wilayahSchema>;

export const internetPackageSchema = z.object({
  name: z.string().trim().min(1, 'Nama paket wajib diisi').max(100),
  speedUp: z.number().int().positive('Kecepatan upload harus lebih dari 0'),
  speedDown: z.number().int().positive('Kecepatan download harus lebih dari 0'),
  price: rupiah,
  mikrotikProfile: z.string().trim().max(100).nullish(),
  isActive: z.boolean().default(true),
});
export type InternetPackageInput = z.infer<typeof internetPackageSchema>;

/** Satu baris barang yang keluar dari gudang saat pemasangan pelanggan. */
export const customerInventoryItemSchema = z.object({
  itemId: uuid,
  quantity: z.number().int().positive(),
});

export const customerSchema = z
  .object({
    // Seksi: Layanan Internet
    pppoeUsername: z
      .string()
      .trim()
      .min(3, 'Username minimal 3 karakter')
      .max(64)
      .regex(/^[a-zA-Z0-9._@-]+$/, 'Username hanya boleh huruf, angka, dan . _ @ -'),
    pppoePassword: z.string().min(6, 'Password PPPoE minimal 6 karakter').max(64),
    packageId: uuid,
    ipMode: z.enum(IP_MODES).default('dhcp'),
    ipAddress: z.ipv4('Alamat IP tidak valid').nullish(),
    nasId: uuid.nullish(),

    // Seksi: Akun Aplikasi
    email: z.string().trim().email('Format email tidak valid'),
    appPassword: z.string().min(8, 'Password aplikasi minimal 8 karakter').max(72),

    // Seksi: Informasi Personal
    name: z.string().trim().min(1, 'Nama lengkap wajib diisi').max(150),
    phone: phoneSchema,
    nik: z
      .string()
      .trim()
      .regex(/^\d{16}$/, 'NIK harus 16 digit angka'),
    address: z.string().trim().min(1, 'Alamat wajib diisi').max(500),
    wilayahId: uuid,
    resellerId: uuid.nullish(),
    billingType: z.enum(BILLING_TYPES).default('postpaid'),
    installationDate: z.coerce.date(),
    /** Tanggal dalam bulan, bukan tanggal penuh, karena tagihan berulang setiap bulan. */
    dueDay: z.number().int().min(1).max(31),
    installationFee: rupiah.default(0),
    discount: rupiah.default(0),
    odpId: uuid.nullish(),
    notes: optionalText,
    latitude: z.number().min(-90).max(90).nullish(),
    longitude: z.number().min(-180).max(180).nullish(),
    status: z.enum(CUSTOMER_STATUSES).default('aktif'),

    // Seksi: Inventory Barang Keluar
    inventoryItems: z.array(customerInventoryItemSchema).default([]),
  })
  .refine((v) => v.ipMode !== 'static' || !!v.ipAddress, {
    message: 'Alamat IP wajib diisi ketika mode IP static',
    path: ['ipAddress'],
  })
  .refine((v) => (v.latitude == null) === (v.longitude == null), {
    message: 'Latitude dan longitude harus diisi bersamaan',
    path: ['longitude'],
  });
export type CustomerInput = z.infer<typeof customerSchema>;

export const generateInvoiceSchema = z.object({
  periodMonth: z.number().int().min(1).max(12),
  periodYear: z.number().int().min(2020).max(2100),
  wilayahId: uuid.nullish(),
  /** Kosong berarti seluruh pelanggan aktif pada wilayah terpilih. */
  customerIds: z.array(uuid).default([]),
  includeTax: z.boolean().default(true),
});
export type GenerateInvoiceInput = z.infer<typeof generateInvoiceSchema>;

export const invoicePaymentSchema = z.object({
  amount: rupiah.min(1, 'Jumlah pembayaran harus lebih dari 0'),
  method: z.enum(PAYMENT_METHODS),
  paidAt: z.coerce.date().default(() => new Date()),
  reference: z.string().trim().max(100).nullish(),
  notes: optionalText,
});
export type InvoicePaymentInput = z.infer<typeof invoicePaymentSchema>;

export const invoiceFilterSchema = z.object({
  status: z.enum(INVOICE_STATUSES).nullish(),
  periodMonth: z.number().int().min(1).max(12).nullish(),
  periodYear: z.number().int().min(2020).max(2100).nullish(),
  wilayahId: uuid.nullish(),
  resellerId: uuid.nullish(),
});
export type InvoiceFilter = z.infer<typeof invoiceFilterSchema>;

export const ticketSchema = z.object({
  customerId: uuid.nullish(),
  title: z.string().trim().min(1, 'Judul tiket wajib diisi').max(200),
  description: z.string().trim().min(1, 'Deskripsi wajib diisi').max(5000),
  category: z.string().trim().max(50).nullish(),
  priority: z.enum(TICKET_PRIORITIES).default('sedang'),
  status: z.enum(TICKET_STATUSES).default('baru'),
  assignedTo: uuid.nullish(),
  wilayahId: uuid,
});
export type TicketInput = z.infer<typeof ticketSchema>;

export const financeTransactionSchema = z.object({
  categoryId: uuid,
  type: z.enum(FINANCE_TYPES),
  amount: rupiah.min(1, 'Nominal harus lebih dari 0'),
  description: z.string().trim().min(1, 'Deskripsi wajib diisi').max(500),
  transactionDate: z.coerce.date(),
  wilayahId: uuid.nullish(),
});
export type FinanceTransactionInput = z.infer<typeof financeTransactionSchema>;

export const inventoryItemSchema = z.object({
  code: z.string().trim().min(1, 'Kode barang wajib diisi').max(50),
  name: z.string().trim().min(1, 'Nama barang wajib diisi').max(150),
  categoryId: uuid,
  unit: z.string().trim().min(1).max(20),
  unitPrice: rupiah.default(0),
  description: optionalText,
  wilayahId: uuid.nullish(),
});
export type InventoryItemInput = z.infer<typeof inventoryItemSchema>;

export const inventoryMovementSchema = z.object({
  itemId: uuid,
  type: z.enum(INVENTORY_MOVEMENTS),
  quantity: z.number().int().positive('Jumlah harus lebih dari 0'),
  notes: optionalText,
});
export type InventoryMovementInput = z.infer<typeof inventoryMovementSchema>;

export const nasSchema = z.object({
  name: z.string().trim().min(1, 'Nama NAS wajib diisi').max(100),
  ipAddress: z.ipv4('Alamat IP tidak valid'),
  secret: z.string().min(6, 'RADIUS secret minimal 6 karakter').max(128),
  type: z.string().trim().max(50).default('mikrotik'),
  wilayahId: uuid,
  isDefault: z.boolean().default(false),
});
export type NasInput = z.infer<typeof nasSchema>;

export const mikrotikSchema = z.object({
  name: z.string().trim().min(1, 'Nama perangkat wajib diisi').max(100),
  host: z.string().trim().min(1, 'Host wajib diisi').max(255),
  port: z.number().int().min(1).max(65535).default(8728),
  username: z.string().trim().min(1).max(64),
  password: z.string().min(1).max(128),
  wilayahId: uuid,
});
export type MikrotikInput = z.infer<typeof mikrotikSchema>;

export const resellerSchema = z.object({
  name: z.string().trim().min(1, 'Nama wajib diisi').max(150),
  phone: phoneSchema,
  type: z.enum(RESELLER_TYPES),
  commissionType: z.enum(['percent', 'fixed']),
  commissionValue: z.number().min(0),
  wilayahId: uuid,
});
export type ResellerInput = z.infer<typeof resellerSchema>;

export const accountSchema = z.object({
  name: z.string().trim().min(1, 'Nama wajib diisi').max(150),
  email: z.string().trim().email('Format email tidak valid'),
  password: z.string().min(8, 'Password minimal 8 karakter').max(72).optional(),
  phone: phoneSchema.nullish(),
  role: z.enum(ROLES),
  /** `null` memberi akses ke seluruh wilayah tenant. */
  wilayahId: uuid.nullish(),
});
export type AccountInput = z.infer<typeof accountSchema>;

export const hotspotVoucherBatchSchema = z.object({
  profileId: uuid,
  quantity: z.number().int().min(1).max(10000),
  wilayahId: uuid,
  resellerId: uuid.nullish(),
  codeLength: z.number().int().min(4).max(16).default(8),
  prefix: z.string().trim().max(10).nullish(),
});
export type HotspotVoucherBatchInput = z.infer<typeof hotspotVoucherBatchSchema>;

export const whatsappBroadcastSchema = z.object({
  templateId: uuid,
  deviceId: uuid,
  targetFilter: z.object({
    wilayahId: uuid.nullish(),
    status: z.enum(CUSTOMER_STATUSES).nullish(),
    invoiceStatus: z.enum(INVOICE_STATUSES).nullish(),
  }),
  scheduledAt: z.coerce.date().nullish(),
});
export type WhatsappBroadcastInput = z.infer<typeof whatsappBroadcastSchema>;
