import { hash } from '@node-rs/argon2';
import { PrismaClient } from '@prisma/client';
import { MODULE_KEYS } from '@radgate/shared';

/**
 * Data awal supaya instalasi kosong bisa di-login. Bukan untuk produksi: ganti
 * password owner segera setelah masuk pertama kali.
 */
const prisma = new PrismaClient();

const OWNER_EMAIL = process.env.SEED_OWNER_EMAIL ?? 'owner@radgate.local';
const OWNER_PASSWORD = process.env.SEED_OWNER_PASSWORD ?? 'RadGate.dev1';

async function main() {
  const existing = await prisma.tenant.findFirst({ where: { name: 'Demo ISP' } });
  if (existing) {
    console.log('Seed dilewati: tenant Demo ISP sudah ada');
    return;
  }

  const tenant = await prisma.tenant.create({
    data: { name: 'Demo ISP', companyName: 'Demo ISP', status: 'aktif' },
  });
  await prisma.$executeRaw`SELECT set_config('app.tenant_id', ${tenant.id}, false)`;

  const plan = await prisma.subscriptionPlan.create({
    data: {
      name: 'Demo',
      priceMonthly: 0,
      priceYearly: 0,
      limits: { customers: 1000, nas: 24, mikrotik: 24, hotspot_vouchers: 50000, whatsapp_messages: 10000 },
      isActive: true,
    },
  });

  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);

  await prisma.subscription.create({
    data: {
      tenantId: tenant.id,
      planId: plan.id,
      status: 'aktif',
      startedAt: now,
      expiresAt,
      billingCycle: 'yearly',
    },
  });

  const wilayah = await prisma.wilayah.create({
    data: { tenantId: tenant.id, name: 'Pusat', code: 'PST', isActive: true },
  });

  await prisma.setting.create({
    data: {
      tenantId: tenant.id,
      companyName: 'Demo ISP',
      timezone: 'Asia/Jakarta',
    },
  });

  await prisma.internetPackage.create({
    data: {
      tenantId: tenant.id,
      name: '10 Mbps',
      speedUp: 10,
      speedDown: 10,
      price: 150000,
      isActive: true,
    },
  });

  await prisma.user.create({
    data: {
      tenantId: tenant.id,
      name: 'Owner Demo',
      email: OWNER_EMAIL,
      passwordHash: await hash(OWNER_PASSWORD),
      role: 'owner',
      status: 'aktif',
    },
  });

  const roles = ['admin', 'teknisi', 'reseller', 'biller'] as const;
  for (const role of roles) {
    for (const module of MODULE_KEYS) {
      const full = role === 'admin';
      const teknisiView = ['dashboard', 'customers', 'tickets', 'mapping', 'inventory', 'servers'].includes(module);
      await prisma.permission.create({
        data: {
          tenantId: tenant.id,
          role,
          module,
          canView: full || (role === 'teknisi' && teknisiView) || (role === 'biller' && (module === 'billing' || module === 'finances' || module === 'customers')) || (role === 'reseller' && (module === 'customers' || module === 'hotspot' || module === 'billing')),
          canCreate: full || (role === 'teknisi' && module === 'tickets'),
          canUpdate: full || (role === 'teknisi' && module === 'tickets'),
          canDelete: full,
        },
      });
    }
  }

  console.log(`Seed selesai. Login: ${OWNER_EMAIL} / ${OWNER_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
