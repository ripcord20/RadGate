import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { ROUTES } from '@radgate/shared';
import { AppShell } from '@/components/layout/app-shell';
import { RedirectIfAuthenticated, RequireAuth, RequireModule } from './guards';

/*
 * Setiap halaman di-`lazy()` tanpa kecuali. Pada sistem yang dianalisis, seluruh route
 * di-import statis sehingga bundelnya mencapai 5,7 MB dan halaman login ikut mengunduh
 * seluruh aplikasi. Vite memecah masing-masing import ini menjadi chunk terpisah.
 */

// Auth
const LoginPage = lazy(() => import('@/pages/auth/login'));
const RegisterPage = lazy(() => import('@/pages/auth/register'));
const ForgotPasswordPage = lazy(() => import('@/pages/auth/forgot-password'));
const ResetPasswordPage = lazy(() => import('@/pages/auth/reset-password'));

// Dashboard & profil
const DashboardPage = lazy(() => import('@/pages/dashboard/index'));
const ProfilePage = lazy(() => import('@/pages/profile/index'));
const ProfileEditPage = lazy(() => import('@/pages/profile/edit'));
const NotFoundPage = lazy(() => import('@/pages/not-found'));

// Pelanggan
const CustomersPage = lazy(() => import('@/pages/customers/index'));
const CustomerAddPage = lazy(() => import('@/pages/customers/add'));
const CustomerEditPage = lazy(() => import('@/pages/customers/edit'));
const CustomerDetailPage = lazy(() => import('@/pages/customers/detail'));
const AnomaliLoginPage = lazy(() => import('@/pages/customers/anomali-login'));
const CustomerDevicesPage = lazy(() => import('@/pages/customers/devices'));
const InternetPackagesPage = lazy(() => import('@/pages/customers/packages'));
const SpeedOnDemandPage = lazy(() => import('@/pages/customers/speed-on-demand'));
const CustomerLayananPage = lazy(() => import('@/pages/customers/layanan'));

// Hotspot
const HotspotVouchersPage = lazy(() => import('@/pages/hotspot/index'));
const HotspotProfilePage = lazy(() => import('@/pages/hotspot/profile'));
const HotspotRekapPage = lazy(() => import('@/pages/hotspot/rekap'));
const HotspotEmbedPage = lazy(() => import('@/pages/hotspot/embed'));

// Tagihan
const BillingPage = lazy(() => import('@/pages/billing/index'));
const BillingGeneratePage = lazy(() => import('@/pages/billing/generate'));
const InvoiceDetailPage = lazy(() => import('@/pages/billing/detail'));
const AccountOfficerPage = lazy(() => import('@/pages/billing/ao'));
const AccountOfficerActivePage = lazy(() => import('@/pages/billing/ao-active'));
const AccountOfficerDetailPage = lazy(() => import('@/pages/billing/ao-detail'));

// Payment gateway
const PaymentGatewayPage = lazy(() => import('@/pages/payment-gateway/index'));

// Tiket
const TicketsPage = lazy(() => import('@/pages/tickets/index'));
const TicketCreatePage = lazy(() => import('@/pages/tickets/create'));
const TicketDetailPage = lazy(() => import('@/pages/tickets/detail'));

// Reseller
const ResellersPage = lazy(() => import('@/pages/resellers/index'));
const ResellerCustomersPage = lazy(() => import('@/pages/resellers/customers'));
const ResellerLogPage = lazy(() => import('@/pages/resellers/log'));
const ResellerPayPage = lazy(() => import('@/pages/resellers/pay'));

// Keuangan, pemetaan, inventory
const FinancesPage = lazy(() => import('@/pages/finances/index'));
const MappingPage = lazy(() => import('@/pages/mapping/index'));
const InventoryPage = lazy(() => import('@/pages/inventory/index'));

// Servers
const NasPage = lazy(() => import('@/pages/servers/nas'));
const PortForwardingPage = lazy(() => import('@/pages/servers/port-forwarding'));
const MikrotikPage = lazy(() => import('@/pages/servers/mikrotik'));
const MikrotikFormPage = lazy(() => import('@/pages/servers/mikrotik-form'));

// Notifikasi & WhatsApp
const NotificationsPage = lazy(() => import('@/pages/notifications/index'));
const WhatsappBroadcastPage = lazy(() => import('@/pages/whatsapp/broadcast'));
const WhatsappBroadcastNewPage = lazy(() => import('@/pages/whatsapp/broadcast-new'));
const WhatsappTemplatePage = lazy(() => import('@/pages/whatsapp/template'));
const WhatsappInternalPage = lazy(() => import('@/pages/whatsapp/internal'));
const WhatsappExternalApiPage = lazy(() => import('@/pages/whatsapp/external-api'));
const WhatsappInboxPage = lazy(() => import('@/pages/whatsapp/inbox'));

// Laporan
const ReportsPage = lazy(() => import('@/pages/reports/index'));

// Pengaturan
const SettingsPage = lazy(() => import('@/pages/settings/index'));
const SettingsImportPage = lazy(() => import('@/pages/settings/import'));
const SettingsExportPage = lazy(() => import('@/pages/settings/export'));
const WilayahPage = lazy(() => import('@/pages/settings/wilayah'));
const AccountsPage = lazy(() => import('@/pages/settings/accounts'));
const CustomerAppPage = lazy(() => import('@/pages/settings/customer-app'));
const ActivityLogPage = lazy(() => import('@/pages/settings/log'));

// Langganan
const SubscriptionPage = lazy(() => import('@/pages/subscription/index'));
const SubscriptionStatusPage = lazy(() => import('@/pages/subscription/status'));
const SubscriptionPlansPage = lazy(() => import('@/pages/subscription/plans'));
const SubscriptionHistoryPage = lazy(() => import('@/pages/subscription/billing-history'));
const SubscriptionBillPage = lazy(() => import('@/pages/subscription/bill'));
const SubscriptionPaymentPage = lazy(() => import('@/pages/subscription/payment'));
const SubscriptionConfirmPage = lazy(() => import('@/pages/subscription/confirm'));

function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Loader2 className="size-5 animate-spin text-primary" />
    </div>
  );
}

export function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<RedirectIfAuthenticated />}>
          <Route path={ROUTES.public.login} element={<LoginPage />} />
          <Route path={ROUTES.public.register} element={<RegisterPage />} />
          <Route path={ROUTES.public.forgotPassword} element={<ForgotPasswordPage />} />
          <Route path={ROUTES.public.resetPassword} element={<ResetPasswordPage />} />
        </Route>

        <Route element={<RequireAuth />}>
          <Route element={<AppShell />}>
            <Route path="/" element={<Navigate to={ROUTES.dashboard.index} replace />} />

            <Route element={<RequireModule module="dashboard" />}>
              <Route path={ROUTES.dashboard.index} element={<DashboardPage />} />
            </Route>

            <Route path={ROUTES.profile.detail} element={<ProfilePage />} />
            <Route path={ROUTES.profile.edit} element={<ProfileEditPage />} />

            <Route element={<RequireModule module="customers" />}>
              <Route path={ROUTES.customers.index} element={<CustomersPage />} />
              <Route path={ROUTES.customers.add} element={<CustomerAddPage />} />
              <Route path={ROUTES.customers.edit} element={<CustomerEditPage />} />
              <Route path={ROUTES.customers.detail} element={<CustomerDetailPage />} />
              <Route path={ROUTES.customers.anomaliLogin} element={<AnomaliLoginPage />} />
              <Route path={ROUTES.customers.devices} element={<CustomerDevicesPage />} />
              <Route path={ROUTES.customers.packages} element={<InternetPackagesPage />} />
              <Route path={ROUTES.customers.speedOnDemand} element={<SpeedOnDemandPage />} />
              <Route path={ROUTES.customers.layanan} element={<CustomerLayananPage />} />
            </Route>

            <Route element={<RequireModule module="hotspot" />}>
              <Route path={ROUTES.hotspot.index} element={<HotspotVouchersPage />} />
              <Route path={ROUTES.hotspot.profile} element={<HotspotProfilePage />} />
              <Route path={ROUTES.hotspot.rekap} element={<HotspotRekapPage />} />
              <Route path={ROUTES.hotspot.embed} element={<HotspotEmbedPage />} />
            </Route>

            <Route element={<RequireModule module="billing" />}>
              <Route path={ROUTES.billing.index} element={<BillingPage />} />
              <Route path={ROUTES.billing.generate} element={<BillingGeneratePage />} />
              <Route path={ROUTES.billing.detail} element={<InvoiceDetailPage />} />
              <Route path={ROUTES.billing.ao} element={<AccountOfficerPage />} />
              <Route path={ROUTES.billing.aoActive} element={<AccountOfficerActivePage />} />
              <Route path={ROUTES.billing.aoDetail} element={<AccountOfficerDetailPage />} />
            </Route>

            <Route element={<RequireModule module="payment_gateway" />}>
              <Route path={ROUTES.paymentGateway.index} element={<PaymentGatewayPage />} />
            </Route>

            <Route element={<RequireModule module="tickets" />}>
              <Route path={ROUTES.tickets.index} element={<TicketsPage />} />
              <Route path={ROUTES.tickets.create} element={<TicketCreatePage />} />
              <Route path={ROUTES.tickets.detail} element={<TicketDetailPage />} />
            </Route>

            <Route element={<RequireModule module="resellers" />}>
              <Route path={ROUTES.resellers.index} element={<ResellersPage />} />
              <Route path={ROUTES.resellers.customers} element={<ResellerCustomersPage />} />
              <Route path={ROUTES.resellers.log} element={<ResellerLogPage />} />
              <Route path={ROUTES.resellers.pay} element={<ResellerPayPage />} />
            </Route>

            <Route element={<RequireModule module="finances" />}>
              <Route path={ROUTES.finances.index} element={<FinancesPage />} />
            </Route>

            <Route element={<RequireModule module="mapping" />}>
              <Route path={ROUTES.mapping.index} element={<MappingPage />} />
            </Route>

            <Route element={<RequireModule module="inventory" />}>
              <Route path={ROUTES.inventory.index} element={<InventoryPage />} />
            </Route>

            <Route element={<RequireModule module="servers" />}>
              <Route path={ROUTES.servers.nas} element={<NasPage />} />
              <Route path={ROUTES.servers.portForwarding} element={<PortForwardingPage />} />
              <Route path={ROUTES.servers.mikrotik} element={<MikrotikPage />} />
              <Route path={ROUTES.servers.mikrotikAdd} element={<MikrotikFormPage />} />
              <Route path={ROUTES.servers.mikrotikEdit} element={<MikrotikFormPage />} />
            </Route>

            <Route element={<RequireModule module="notifications" />}>
              <Route path={ROUTES.notifications.index} element={<NotificationsPage />} />
            </Route>

            <Route element={<RequireModule module="whatsapp" />}>
              <Route path={ROUTES.whatsapp.broadcast} element={<WhatsappBroadcastPage />} />
              <Route path={ROUTES.whatsapp.broadcastNew} element={<WhatsappBroadcastNewPage />} />
              <Route path={ROUTES.whatsapp.template} element={<WhatsappTemplatePage />} />
              <Route path={ROUTES.whatsapp.internal} element={<WhatsappInternalPage />} />
              <Route path={ROUTES.whatsapp.externalApi} element={<WhatsappExternalApiPage />} />
              <Route path={ROUTES.whatsapp.inbox} element={<WhatsappInboxPage />} />
            </Route>

            <Route element={<RequireModule module="reports" />}>
              <Route path={ROUTES.reports.index} element={<ReportsPage />} />
            </Route>

            <Route element={<RequireModule module="settings" />}>
              <Route path={ROUTES.settings.index} element={<SettingsPage />} />
              <Route path={ROUTES.settings.import} element={<SettingsImportPage />} />
              <Route path={ROUTES.settings.importExcel} element={<SettingsImportPage />} />
              <Route path={ROUTES.settings.export} element={<SettingsExportPage />} />
              <Route path={ROUTES.settings.wilayah} element={<WilayahPage />} />
              <Route path={ROUTES.settings.accounts} element={<AccountsPage />} />
              <Route path={ROUTES.settings.customerApp} element={<CustomerAppPage />} />
              <Route path={ROUTES.settings.log} element={<ActivityLogPage />} />
            </Route>

            <Route element={<RequireModule module="subscription" />}>
              <Route path={ROUTES.subscription.index} element={<SubscriptionPage />} />
              <Route path={ROUTES.subscription.status} element={<SubscriptionStatusPage />} />
              <Route path={ROUTES.subscription.plans} element={<SubscriptionPlansPage />} />
              <Route path={ROUTES.subscription.billingHistory} element={<SubscriptionHistoryPage />} />
              <Route path={ROUTES.subscription.bill} element={<SubscriptionBillPage />} />
              <Route path={ROUTES.subscription.payment} element={<SubscriptionPaymentPage />} />
              <Route path={ROUTES.subscription.confirm} element={<SubscriptionConfirmPage />} />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}
