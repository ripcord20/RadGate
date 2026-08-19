import { Injectable, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { requireScope } from '../common/request-context';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /**
   * Menjalankan pekerjaan di dalam transaksi yang sudah menetapkan `app.tenant_id`,
   * sehingga kebijakan Row Level Security PostgreSQL ikut berlaku.
   *
   * Ini lapisan pengaman kedua, bukan yang utama. Filter `tenantId` di lapisan repository
   * tetap wajib ada. Yang dijaga di sini adalah kasus ketika satu query lupa memfilter:
   * database yang menolak, bukan data yang bocor. Untuk sistem multi-tenant yang
   * menyimpan data keuangan, satu lapis saja tidak cukup.
   *
   * `set_config` dipanggil dengan parameter `is_local = true` agar nilainya hanya berlaku
   * selama transaksi dan tidak menempel pada koneksi yang nanti dipakai ulang oleh
   * permintaan tenant lain dari pool.
   */
  async withTenant<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    const scope = requireScope();
    return this.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.tenant_id', ${scope.tenantId}, true)`;
      return fn(tx);
    });
  }
}
