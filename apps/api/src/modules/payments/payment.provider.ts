/**
 * Payment gateway di balik interface. Duitku (atau penggantinya) hanya hidup di
 * implementasi ini, bukan di modul tagihan.
 */
export interface PaymentProvider {
  readonly name: string;
  checkout(input: {
    reference: string;
    amount: number;
    method: string;
  }): Promise<{ checkoutUrl: string; providerRef: string }>;
  verifyWebhook(headers: Record<string, string | string[] | undefined>, body: unknown): boolean;
}

export class StubPaymentProvider implements PaymentProvider {
  readonly name = 'stub';

  async checkout(input: { reference: string; amount: number; method: string }) {
    return {
      checkoutUrl: `/payment-gateway?ref=${encodeURIComponent(input.reference)}&method=${encodeURIComponent(input.method)}`,
      providerRef: `stub-${input.reference}`,
    };
  }

  verifyWebhook(_headers: Record<string, string | string[] | undefined>, _body: unknown) {
    return true;
  }
}
