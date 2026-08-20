import { Module } from '@nestjs/common';
import { ResellersController } from './resellers.controller';
import { ResellersService } from './resellers.service';

@Module({
  controllers: [ResellersController],
  providers: [ResellersService],
})
export class ResellersModule {}
