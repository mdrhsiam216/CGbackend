import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const SALT = 'caregiver-chat-message-v1';

/**
 * Encrypts and decrypts chat message content using AES-256-GCM.
 * Use this so messages are stored and transmitted encrypted; the frontend
 * decrypts with the same key to display plaintext.
 *
 * Note: bcrypt is for one-way hashing (e.g. passwords) and cannot decrypt.
 * Symmetric encryption (AES) is required for encrypt-then-decrypt flows.
 */
@Injectable()
export class MessageEncryptionService {
  private readonly key: Buffer;

  constructor(private readonly configService: ConfigService) {
    const secret = this.configService.get<string>('CHAT_MESSAGE_ENCRYPTION_KEY');
    if (!secret || secret.length < 16) {
      throw new Error(
        'CHAT_MESSAGE_ENCRYPTION_KEY must be set and at least 16 characters (e.g. in .env)',
      );
    }
    this.key = crypto.scryptSync(secret, SALT, KEY_LENGTH);
  }

  /**
   * Encrypt plaintext for storage. Returns a single base64 string containing
   * iv + authTag + ciphertext so the frontend can decrypt with the same key.
   */
  encrypt(plaintext: string): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, this.key, iv, {
      authTagLength: AUTH_TAG_LENGTH,
    });
    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();
    return Buffer.concat([iv, authTag, encrypted]).toString('base64');
  }

  /**
   * Decrypt a value produced by encrypt(). Used on the backend only when
   * plaintext is needed (e.g. push notification body, or search filtering).
   */
  decrypt(encryptedBase64: string): string {
    const raw = Buffer.from(encryptedBase64, 'base64');
    if (raw.length < IV_LENGTH + AUTH_TAG_LENGTH) {
      throw new Error('Invalid encrypted message format');
    }
    const iv = raw.subarray(0, IV_LENGTH);
    const authTag = raw.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const ciphertext = raw.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
    const decipher = crypto.createDecipheriv(ALGORITHM, this.key, iv, {
      authTagLength: AUTH_TAG_LENGTH,
    });
    decipher.setAuthTag(authTag);
    return decipher.update(ciphertext) + decipher.final('utf8');
  }

  /**
   * Returns true if the string looks like our encrypted format (base64 that
   * decodes to at least iv+tag length). Use to avoid double-encrypting or
   * decrypting plaintext.
   */
  looksEncrypted(value: string): boolean {
    if (!value || typeof value !== 'string') return false;
    try {
      const raw = Buffer.from(value, 'base64');
      return raw.length >= IV_LENGTH + AUTH_TAG_LENGTH;
    } catch {
      return false;
    }
  }
}
