import { Body, Controller, Get, Patch, UsePipes } from '@nestjs/common';
import { profilePatchSchema, type ProfilePatchInput } from '@radgate/shared';
import { CurrentUser } from '../../common/decorators';
import type { RequestScope } from '../../common/request-context';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { AuthService } from './auth.service';

@Controller('profile')
export class ProfileController {
  constructor(private readonly auth: AuthService) {}

  @Get()
  me(@CurrentUser() scope: RequestScope | undefined) {
    return this.auth.profile(scope);
  }

  @Patch()
  @UsePipes(new ZodValidationPipe(profilePatchSchema))
  update(@CurrentUser() scope: RequestScope | undefined, @Body() body: ProfilePatchInput) {
    return this.auth.updateProfile(scope, body);
  }
}
