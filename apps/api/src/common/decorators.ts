import { SetMetadata, createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { ModuleKey, PermissionAction } from '@radgate/shared';
import type { RequestScope } from './request-context';

export const PUBLIC_KEY = 'radgate:public';
export const PERMISSION_KEY = 'radgate:permission';

/** Menandai endpoint yang boleh diakses tanpa autentikasi, misalnya login dan refresh. */
export const Public = () => SetMetadata(PUBLIC_KEY, true);

export interface RequiredPermission {
  module: ModuleKey;
  action: PermissionAction;
}

/**
 * Izin dideklarasikan di controller, bukan diperiksa manual di dalam service. Dengan
 * begitu endpoint yang lupa dideklarasikan akan ditolak oleh guard secara bawaan,
 * bukan lolos tanpa pemeriksaan.
 */
export const RequirePermission = (module: ModuleKey, action: PermissionAction = 'view') =>
  SetMetadata(PERMISSION_KEY, { module, action } satisfies RequiredPermission);

export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<{ scope?: RequestScope }>();
  return request.scope;
});
