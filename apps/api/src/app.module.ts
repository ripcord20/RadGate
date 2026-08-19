import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard, PermissionsGuard } from './common/guards';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { BootstrapModule } from './modules/bootstrap/bootstrap.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { TasksModule } from './modules/tasks/tasks.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, cache: true }),
    PrismaModule,
    PermissionsModule,
    TasksModule,
    AuthModule,
    BootstrapModule,
  ],
  providers: [
    /*
     * Guard dipasang global, bukan per controller. Bawaannya menutup: endpoint baru
     * otomatis butuh autentikasi, dan yang publik harus menyatakannya lewat `@Public()`.
     * Kalau dibalik, satu endpoint yang lupa dipasangi guard langsung terbuka ke publik.
     *
     * Urutan penting. AuthGuard harus lebih dulu karena PermissionsGuard membaca scope
     * yang dipasang olehnya.
     */
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
})
export class AppModule {}
