import { Module } from '@nestjs/common';
import { AoController } from './ao.controller';
import { AoService } from './ao.service';

@Module({
  controllers: [AoController],
  providers: [AoService],
})
export class AoModule {}
