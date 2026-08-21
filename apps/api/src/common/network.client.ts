import { Injectable } from '@nestjs/common';

export interface ProvisionPppoeInput {
  username: string;
  password: string;
  profile?: string;
  nasHost?: string;
}

export abstract class NetworkClient {
  abstract provisionPppoe(input: ProvisionPppoeInput): Promise<void>;
}

@Injectable()
export class MockNetworkClient extends NetworkClient {
  async provisionPppoe(_input: ProvisionPppoeInput): Promise<void> {
    return;
  }
}
