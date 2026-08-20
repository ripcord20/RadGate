import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { runWithScope, type RequestScope } from './request-context';

type ScopedRequest = { scope?: RequestScope };

/**
 * AuthGuard memasang `request.scope`, tapi `AsyncLocalStorage` hanya hidup selama
 * callback `runWithScope`. Guard yang mengembalikan `true` selesai sebelum handler
 * dijalankan, jadi repository yang memanggil `requireScope()` akan melihat penyimpanan
 * kosong — dan query lalu ditolak, atau lebih buruk: dijalankan tanpa tenant.
 *
 * Interceptor ini membungkus Observable handler di dalam scope yang sama, sehingga
 * Prisma `withTenant` dan `tenantWhere` tetap melihat `tenantId` sepanjang request.
 */
@Injectable()
export class ScopeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<ScopedRequest>();
    const scope = request.scope;
    if (!scope) return next.handle();

    return new Observable((subscriber) => {
      const subscription = runWithScope(scope, () =>
        next.handle().subscribe({
          next: (value) => subscriber.next(value),
          error: (err) => subscriber.error(err),
          complete: () => subscriber.complete(),
        }),
      );
      return () => subscription.unsubscribe();
    });
  }
}
