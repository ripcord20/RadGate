import { Module } from '@nestjs/common';
import { BootstrapController } from './bootstrap.controller';

@Module({
  controllers: [BootstrapController],
})
export class BootstrapModule {}
