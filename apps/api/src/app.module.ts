import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AuthGuard, PermissionsGuard } from './common/guards';
import { ScopeInterceptor } from './common/scope.interceptor';
import { ActivityLogInterceptor } from './common/activity-log.interceptor';
import { CommonModule } from './common/common.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { BootstrapModule } from './modules/bootstrap/bootstrap.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { WilayahModule } from './modules/wilayah/wilayah.module';
import { PackagesModule } from './modules/packages/packages.module';
import { CustomersModule } from './modules/customers/customers.module';
import { BillingModule } from './modules/billing/billing.module';
import { AccountsModule } from './modules/accounts/accounts.module';
import { SettingsModule } from './modules/settings/settings.module';
import { FinancesModule } from './modules/finances/finances.module';
import { TicketsModule } from './modules/tickets/tickets.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { ServersModule } from './modules/servers/servers.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ReportsModule } from './modules/reports/reports.module';
import { ResellersModule } from './modules/resellers/resellers.module';
import { HotspotModule } from './modules/hotspot/hotspot.module';
import { WhatsappModule } from './modules/whatsapp/whatsapp.module';
import { MappingModule } from './modules/mapping/mapping.module';
import { SubscriptionModule } from './modules/subscription/subscription.module';
import { LogsModule } from './modules/logs/logs.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { AoModule } from './modules/ao/ao.module';
import { NetworkOpsModule } from './modules/network-ops/network-ops.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, cache: true }),
    PrismaModule,
    CommonModule,
    PermissionsModule,
    TasksModule,
    AuthModule,
    BootstrapModule,
    WilayahModule,
    PackagesModule,
    CustomersModule,
    BillingModule,
    AccountsModule,
    SettingsModule,
    FinancesModule,
    TicketsModule,
    InventoryModule,
    ServersModule,
    DashboardModule,
    ReportsModule,
    ResellersModule,
    HotspotModule,
    WhatsappModule,
    MappingModule,
    SubscriptionModule,
    LogsModule,
    NotificationsModule,
    PaymentsModule,
    AoModule,
    NetworkOpsModule,
  ],
  providers: [
    /*
     * Guard dipasang global, bukan per controller. Bawaannya menutup: endpoint baru
     * otomatis butuh autentikasi, dan yang publik harus menyatakannya lewat `@Public()`.
     * Kalau dibalik, satu endpoint yang lupa dipasangi guard langsung terbuka ke publik.
     *
     * Urutan penting. AuthGuard harus lebih dulu karena PermissionsGuard membaca scope
     * yang dipasang olehnya. ScopeInterceptor kemudian membawa scope itu ke
     * AsyncLocalStorage sepanjang handler.
     */
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
    { provide: APP_INTERCEPTOR, useClass: ScopeInterceptor },
    { provide: APP_INTERCEPTOR, useClass: ActivityLogInterceptor },
  ],
})
export class AppModule {}
