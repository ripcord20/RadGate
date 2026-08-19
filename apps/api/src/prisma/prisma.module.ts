import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Global supaya modul fitur tidak perlu meng-import PrismaModule satu per satu.
 * Koneksi database memang tunggal untuk seluruh aplikasi.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
