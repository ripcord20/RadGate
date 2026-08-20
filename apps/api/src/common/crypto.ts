import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Enkripsi AES-256-GCM untuk kredensial yang harus bisa dibaca kembali (password
 * PPPoE, secret NAS, password Mikrotik). Bukan hash: hash tidak bisa dipakai untuk
 * provisioning ke perangkat.
 *
 * Format simpanan: base64(iv 12 byte + tag 16 byte + ciphertext).
 */
@Injectable()
export class CryptoService {
  constructor(private readonly config: ConfigService) {}

  encrypt(plain: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key, iv);
    const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, tag, encrypted]).toString('base64');
  }

  decrypt(payload: string): string {
    const buf = Buffer.from(payload, 'base64');
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const data = buf.subarray(28);
    const decipher = createDecipheriv('aes-256-gcm', this.key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
  }

  private get key(): Buffer {
    const raw = this.config.getOrThrow<string>('DEVICE_ENCRYPTION_KEY');
    const key = Buffer.from(raw, 'base64');
    if (key.length !== 32) {
      throw new Error('DEVICE_ENCRYPTION_KEY harus 32 byte dalam bentuk base64');
    }
    return key;
  }
}
