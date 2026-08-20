import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import type { Role } from '@radgate/shared';
import { PERMISSION_KEY, PUBLIC_KEY, type RequiredPermission } from './decorators';
import type { RequestScope } from './request-context';
import { PermissionsService } from '../modules/permissions/permissions.service';

interface AccessTokenPayload {
  sub: string;
  tenantId: string;
  role: Role;
  wilayahId: string | null;
}

type ScopedRequest = Request & { scope?: RequestScope };

/**
 * Memverifikasi access token dan memasang scope permintaan. Seluruh handler di bawahnya
 * berjalan di dalam `runWithScope`, sehingga lapisan repository selalu punya `tenantId`
 * tanpa perlu menerimanya sebagai argumen.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<ScopedRequest>();
    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token akses tidak ditemukan');
    }

    let payload: AccessTokenPayload;
    try {
      payload = await this.jwt.verifyAsync<AccessTokenPayload>(header.slice(7));
    } catch {
      throw new UnauthorizedException('Token akses tidak valid atau kedaluwarsa');
    }

    const scope: RequestScope = {
      userId: payload.sub,
      tenantId: payload.tenantId,
      role: payload.role,
      wilayahId: payload.wilayahId,
    };
    request.scope = scope;

    // Scope dipasang di request. AsyncLocalStorage diaktifkan oleh ScopeInterceptor,
    // bukan di sini: guard selesai sebelum handler berjalan.
    return true;
  }
}

/**
 * Menegakkan izin yang dideklarasikan lewat `@RequirePermission`. Pemeriksaan yang sama
 * juga dilakukan di frontend, tapi yang di sini yang menentukan: kontrol di frontend
 * hanya menyembunyikan tombol dan bisa dilewati dengan memanggil API langsung.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissions: PermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const required = this.reflector.getAllAndOverride<RequiredPermission | undefined>(
      PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );
    // Endpoint tanpa deklarasi izin hanya butuh sesi yang sah, misalnya profil sendiri.
    if (!required) return true;

    const request = context.switchToHttp().getRequest<ScopedRequest>();
    const scope = request.scope;
    if (!scope) throw new UnauthorizedException();

    const allowed = await this.permissions.can(
      scope.tenantId,
      scope.role,
      required.module,
      required.action,
    );

    if (!allowed) {
      throw new ForbiddenException(
        `Peran ${scope.role} tidak punya izin ${required.action} pada modul ${required.module}`,
      );
    }

    return true;
  }
}
