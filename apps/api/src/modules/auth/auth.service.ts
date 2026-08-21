import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { hash, verify as verifyHash } from '@node-rs/argon2';
import type { AuthUser, LoginInput, ProfilePatchInput, Role } from '@radgate/shared';
import type { RequestScope } from '../../common/request-context';
import { PrismaService } from '../../prisma/prisma.service';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(input: LoginInput): Promise<{ user: AuthUser } & TokenPair> {
    const user = await this.prisma.user.findFirst({
      where: { email: input.email.toLowerCase(), status: 'aktif' },
    });

    /*
     * Pesan galat disengaja sama untuk email tidak terdaftar dan password salah.
     * Membedakannya memberi tahu penyerang email mana yang ada di sistem, dan itu
     * mempersempit sasaran credential stuffing yang sudah coba ditahan reCAPTCHA.
     *
     * Verifikasi hash tetap dijalankan walau pengguna tidak ditemukan, supaya waktu
     * respons tidak membocorkan keberadaan akun.
     */
    const hash = user?.passwordHash ?? DUMMY_HASH;
    const passwordValid = await verifyHash(hash, input.password).catch(() => false);

    if (!user || !passwordValid) {
      throw new UnauthorizedException('Email atau password salah');
    }

    await this.assertRecaptcha(input.recaptchaToken);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const authUser: AuthUser = {
      id: user.id,
      tenantId: user.tenantId,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role as Role,
      wilayahId: user.wilayahId,
    };

    return { user: authUser, ...(await this.issueTokens(authUser)) };
  }

  /**
   * Menukar refresh token dengan access token baru. Dipanggil frontend saat mount dan
   * ketika ada respons 401, karena access token hanya disimpan di memori dan hilang
   * setiap kali halaman dimuat ulang.
   */
  async refresh(refreshToken: string | undefined): Promise<TokenPair & { user: AuthUser }> {
    if (!refreshToken) throw new UnauthorizedException('Sesi tidak ditemukan');

    let payload: { sub: string };
    try {
      payload = await this.jwt.verifyAsync<{ sub: string }>(refreshToken, {
        secret: this.refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Sesi sudah tidak berlaku, silakan login kembali');
    }

    const user = await this.prisma.user.findFirst({
      where: { id: payload.sub, status: 'aktif' },
    });
    if (!user) throw new UnauthorizedException('Akun tidak aktif');

    const authUser: AuthUser = {
      id: user.id,
      tenantId: user.tenantId,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role as Role,
      wilayahId: user.wilayahId,
    };

    return { user: authUser, ...(await this.issueTokens(authUser)) };
  }

  async profile(scope: RequestScope | undefined): Promise<AuthUser> {
    if (!scope) throw new UnauthorizedException();
    const user = await this.prisma.user.findFirst({
      where: { id: scope.userId, status: 'aktif' },
    });
    if (!user) throw new UnauthorizedException('Akun tidak aktif');
    return {
      id: user.id,
      tenantId: user.tenantId,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role as Role,
      wilayahId: user.wilayahId,
    };
  }

  async updateProfile(scope: RequestScope | undefined, input: ProfilePatchInput): Promise<AuthUser> {
    if (!scope) throw new UnauthorizedException();
    const user = await this.prisma.user.update({
      where: { id: scope.userId },
      data: {
        ...(input.name != null ? { name: input.name } : {}),
        ...(input.phone !== undefined ? { phone: input.phone } : {}),
        ...(input.password ? { passwordHash: await hash(input.password) } : {}),
      },
    });
    return {
      id: user.id,
      tenantId: user.tenantId,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role as Role,
      wilayahId: user.wilayahId,
    };
  }

  private async issueTokens(user: AuthUser): Promise<TokenPair> {
    const payload = {
      sub: user.id,
      tenantId: user.tenantId,
      role: user.role,
      wilayahId: user.wilayahId,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, { expiresIn: '15m' }),
      // Refresh token hanya membawa `sub`. Peran dan wilayah sengaja tidak disertakan
      // agar perubahan hak akses langsung berlaku pada penukaran token berikutnya,
      // bukan menunggu token lama kedaluwarsa.
      this.jwt.signAsync({ sub: user.id }, { secret: this.refreshSecret, expiresIn: '30d' }),
    ]);

    return { accessToken, refreshToken };
  }

  private get refreshSecret(): string {
    const secret = this.config.get<string>('JWT_REFRESH_SECRET');
    if (!secret) throw new Error('JWT_REFRESH_SECRET belum diatur');
    return secret;
  }

  /**
   * reCAPTCHA v3 wajib di produksi. Di pengembangan, token `dev` diterima selama
   * `RECAPTCHA_SECRET` kosong, supaya login lokal tidak bergantung pada Google.
   */
  private async assertRecaptcha(token: string) {
    const secret = this.config.get<string>('RECAPTCHA_SECRET') ?? '';
    if (!secret) {
      if (this.config.get('NODE_ENV') === 'production') {
        throw new UnauthorizedException('reCAPTCHA belum dikonfigurasi');
      }
      return;
    }
    const body = new URLSearchParams({ secret, response: token });
    const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    const data = (await res.json()) as { success?: boolean; score?: number };
    if (!data.success || (data.score != null && data.score < 0.5)) {
      throw new UnauthorizedException('Verifikasi reCAPTCHA gagal');
    }
  }
}

/**
 * Hash Argon2id dari string acak. Hanya dipakai agar verifikasi tetap berjalan ketika
 * email tidak ditemukan, sehingga lama respons login seragam.
 */
const DUMMY_HASH =
  '$argon2id$v=19$m=19456,t=2,p=1$c2FsdHNhbHRzYWx0c2FsdA$YQ0dGxWQ8mZfBqPqQ0eEr7CQXpWLXK5rRq0mHhVQ1Zs';
