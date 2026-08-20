/**
 * Integrasi WhatsApp selalu di balik interface. Implementasi sungguhan (Baileys) hidup
 * di layanan `whats.`, bukan di API billing. Yang ada di sini adalah stub supaya modul
 * bisnis bisa dikembangkan tanpa gateway.
 */
export interface WhatsappGateway {
  pair(name: string, phoneNumber: string): Promise<{ qr: string }>;
  send(phoneNumber: string, content: string): Promise<{ ok: boolean; error?: string }>;
}

export class StubWhatsappGateway implements WhatsappGateway {
  async pair(name: string, phoneNumber: string) {
    return { qr: `RADGATE:${name}:${phoneNumber}` };
  }

  async send() {
    return { ok: true };
  }
}
