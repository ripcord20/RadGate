import { Module } from '@nestjs/common';
import { NetworkOpsController } from './network-ops.controller';
import { SpeedOnDemandService } from './network-ops.service';

@Module({
  controllers: [NetworkOpsController],
  providers: [SpeedOnDemandService],
})
export class NetworkOpsModule {}
