import { Body, Controller, Get, HttpCode, Patch, Post, Req, Res, UsePipes } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { loginSchema, profilePatchSchema, type LoginInput, type ProfilePatchInput } from '@radgate/shared';
import { CurrentUser, Public } from '../../common/decorators';
import type { RequestScope } from '../../common/request-context';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { AuthService } from './auth.service';

const REFRESH_COOKIE = 'radgate_refresh';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(200)
  @UsePipes(new ZodValidationPipe(loginSchema))
  async login(@Body() body: LoginInput, @Res({ passthrough: true }) res: Response) {
    const { user, accessToken, refreshToken } = await this.auth.login(body);
    this.setRefreshCookie(res, refreshToken);
    return { accessToken, user };
  }

  @Public()
  @Post('refresh')
  @HttpCode(200)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    const { user, accessToken, refreshToken } = await this.auth.refresh(token);
    // Refresh token diputar setiap penukaran, sehingga token lama yang tercuri
    // hanya berguna sampai penukaran berikutnya.
    this.setRefreshCookie(res, refreshToken);
    return { accessToken, user };
  }

  @Public()
  @Post('logout')
  @HttpCode(204)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(REFRESH_COOKIE, this.cookieOptions());
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(200)
  forgotPassword() {
    return { ok: true };
  }

  @Get('me')
  me(@CurrentUser() scope: RequestScope | undefined) {
    return this.auth.profile(scope);
  }

  @Patch('me')
  @UsePipes(new ZodValidationPipe(profilePatchSchema))
  updateMe(@CurrentUser() scope: RequestScope | undefined, @Body() body: ProfilePatchInput) {
    return this.auth.updateProfile(scope, body);
  }

  /**
   * Refresh token disimpan di cookie `HttpOnly`, bukan di localStorage, supaya tidak bisa
   * dibaca lewat XSS. `SameSite=Strict` menutup jalur CSRF pada endpoint refresh.
   */
  private setRefreshCookie(res: Response, token: string) {
    res.cookie(REFRESH_COOKIE, token, {
      ...this.cookieOptions(),
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
  }

  private cookieOptions() {
    return {
      httpOnly: true,
      secure: this.config.get('NODE_ENV') === 'production',
      sameSite: 'strict' as const,
      path: '/',
    };
  }
}
