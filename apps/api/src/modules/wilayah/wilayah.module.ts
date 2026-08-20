import { Module } from '@nestjs/common';
import { WilayahController } from './wilayah.controller';
import { WilayahService } from './wilayah.service';

@Module({
  controllers: [WilayahController],
  providers: [WilayahService],
  exports: [WilayahService],
})
export class WilayahModule {}
