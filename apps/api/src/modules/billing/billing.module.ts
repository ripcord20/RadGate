import { Module } from '@nestjs/common';
import { TasksModule } from '../tasks/tasks.module';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';

@Module({
  imports: [TasksModule],
  controllers: [BillingController],
  providers: [BillingService],
})
export class BillingModule {}
