import { Global, Module } from '@nestjs/common';
import { PermissionsService } from './permissions.service';

/** Global karena dipakai PermissionsGuard yang terpasang untuk seluruh aplikasi. */
@Global()
@Module({
  providers: [PermissionsService],
  exports: [PermissionsService],
})
export class PermissionsModule {}
