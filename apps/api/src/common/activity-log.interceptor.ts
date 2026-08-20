import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { tap } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';
import type { RequestScope } from './request-context';

type LoggedRequest = {
  method: string;
  path: string;
  ip?: string;
  headers: Record<string, string | string[] | undefined>;
  params?: Record<string, string>;
  scope?: RequestScope;
};

/**
 * Mencatat mutasi sebagai jejak audit. Hanya selisih aksi (metode + path), bukan
 * seluruh body, supaya tabel log tidak membengkak dengan password atau secret.
 */
@Injectable()
export class ActivityLogInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest<LoggedRequest>();
    if (!['POST', 'PATCH', 'PUT', 'DELETE'].includes(request.method)) {
      return next.handle();
    }

    return next.handle().pipe(
      tap(() => {
        const scope = request.scope;
        if (!scope) return;
        const module = request.path.replace(/^\/v1\//, '').split('/')[0] ?? 'unknown';
        void this.prisma.activityLog
          .create({
            data: {
              tenantId: scope.tenantId,
              userId: scope.userId,
              action: request.method,
              module,
              referenceId: request.params?.id,
              ipAddress: request.ip,
              userAgent: typeof request.headers['user-agent'] === 'string' ? request.headers['user-agent'] : undefined,
            },
          })
          .catch(() => undefined);
      }),
    );
  }
}
