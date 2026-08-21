import { Global, Module } from '@nestjs/common';
import { CryptoService } from './crypto';
import { QuotaService } from './quota.service';
import { MockNetworkClient, NetworkClient } from './network.client';

@Global()
@Module({
  providers: [CryptoService, QuotaService, { provide: NetworkClient, useClass: MockNetworkClient }],
  exports: [CryptoService, QuotaService, NetworkClient],
})
export class CommonModule {}
