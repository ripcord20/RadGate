import { Global, Module } from '@nestjs/common';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

/**
 * Global karena hampir setiap modul fitur perlu mendaftarkan job: sinkronisasi Mikrotik,
 * broadcast WhatsApp, generate tagihan, dan import Excel.
 */
@Global()
@Module({
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
