import { Controller, Get, UnauthorizedException } from '@nestjs/common';
import type {
  BootstrapResponse,
  AuthUser,
  QuotaMetric,
  QuotaUsage,
  Role,
  TaskStatus,
} from '@radgate/shared';
import { QUOTA_METRICS } from '@radgate/shared';
import { CurrentUser } from '../../common/decorators';
import type { RequestScope } from '../../common/request-context';
import { PrismaService } from '../../prisma/prisma.service';
import { PermissionsService } from '../permissions/permissions.service';

/**
 * Satu endpoint yang mengembalikan seluruh muatan yang dibutuhkan app shell.
 *
 * Pada sistem yang dianalisis, setiap perpindahan halaman memicu enam permintaan yang
 * selalu sama: izin, daftar wilayah, pengaturan, kuota langganan, daftar job, dan data
 * pendamping dashboard. Menggabungkannya di sini menghapus enam perjalanan jaringan per
 * navigasi, dan frontend meng-cache hasilnya lewat TanStack Query.
 */
@Controller('bootstrap')
export class BootstrapController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissions: PermissionsService,
  ) {}

  @Get()
  async bootstrap(@CurrentUser() scope: RequestScope | undefined): Promise<BootstrapResponse> {
    if (!scope) throw new UnauthorizedException();

    const [user, permissions, wilayah, settings, subscription, tasks] = await Promise.all([
      this.prisma.user.findUniqueOrThrow({ where: { id: scope.userId } }),
      this.permissions.getMap(scope.tenantId, scope.role),
      this.prisma.wilayah.findMany({
        where: { tenantId: scope.tenantId, isActive: true },
        orderBy: { name: 'asc' },
      }),
      this.prisma.setting.findUnique({ where: { tenantId: scope.tenantId } }),
      this.prisma.subscription.findFirst({
        where: { tenantId: scope.tenantId },
        include: { plan: true },
      }),
      this.prisma.task.findMany({
        where: { tenantId: scope.tenantId, status: { in: ['pending', 'running'] } },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ]);

    const authUser: AuthUser = {
      id: user.id,
      tenantId: user.tenantId,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role as Role,
      wilayahId: user.wilayahId,
    };

    return {
      user: authUser,
      permissions,
      wilayah: wilayah.map((w) => ({
        id: w.id,
        name: w.name,
        code: w.code,
        logoUrl: w.logoUrl,
        isActive: w.isActive,
      })),
      quotas: await this.buildQuotas(scope.tenantId, subscription?.plan?.limits),
      settings: {
        companyName: settings?.companyName ?? 'RadGate',
        logoUrl: settings?.logoUrl ?? null,
        address: settings?.address ?? null,
        phone: settings?.phone ?? null,
        taxEnabled: settings?.taxEnabled ?? false,
        taxPercent: settings?.taxPercent ?? 0,
        currency: 'IDR',
        timezone: settings?.timezone ?? 'Asia/Jakarta',
      },
      runningTasks: tasks.map((t) => ({
        id: t.id,
        type: t.type,
        status: t.status as TaskStatus,
        progress: t.progress,
        total: t.total,
        error: t.error,
        createdAt: t.createdAt.toISOString(),
        finishedAt: t.finishedAt?.toISOString() ?? null,
      })),
    };
  }

  /**
   * Kuota dibaca dari tabel pemakaian yang diperbarui job berkala, bukan dihitung ulang
   * dengan `COUNT(*)` di setiap permintaan. Menghitung ulang berarti memindai tabel
   * pelanggan pada setiap perpindahan halaman.
   */
  private async buildQuotas(
    tenantId: string,
    limits: unknown,
  ): Promise<QuotaUsage[]> {
    const usageRows = await this.prisma.subscriptionUsage.findMany({ where: { tenantId } });
    const usageByMetric = new Map(usageRows.map((row) => [row.metric, row.used]));
    const limitMap = (limits ?? {}) as Partial<Record<QuotaMetric, number>>;

    return QUOTA_METRICS.map((metric) => ({
      metric,
      used: usageByMetric.get(metric) ?? 0,
      limit: limitMap[metric] ?? 0,
    }));
  }
}
