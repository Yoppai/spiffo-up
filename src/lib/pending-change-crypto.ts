import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';
import type { EncryptedPendingValue } from '../types/index.js';

const KEY_BYTES = 32;
const NONCE_BYTES = 12;
const SALT_BYTES = 16;

export class PendingChangeDecryptError extends Error {
  constructor() {
    super('Invalid passphrase for encrypted pending change');
    this.name = 'PendingChangeDecryptError';
  }
}

export function encryptPendingSecret(plaintext: string, passphrase: string): EncryptedPendingValue {
  const salt = randomBytes(SALT_BYTES);
  const nonce = randomBytes(NONCE_BYTES);
  const key = derivePendingChangeKey(passphrase, salt);
  const cipher = createCipheriv('aes-256-gcm', key, nonce);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    version: 1,
    algorithm: 'aes-256-gcm',
    kdf: 'scrypt',
    salt: salt.toString('base64'),
    nonce: nonce.toString('base64'),
    authTag: authTag.toString('base64'),
    ciphertext: ciphertext.toString('base64'),
  };
}

export function decryptPendingSecret(payload: EncryptedPendingValue, passphrase: string): string {
  try {
    const salt = Buffer.from(payload.salt, 'base64');
    const nonce = Buffer.from(payload.nonce, 'base64');
    const authTag = Buffer.from(payload.authTag, 'base64');
    const ciphertext = Buffer.from(payload.ciphertext, 'base64');
    const key = derivePendingChangeKey(passphrase, salt);
    const decipher = createDecipheriv('aes-256-gcm', key, nonce);
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
  } catch {
    throw new PendingChangeDecryptError();
  }
}

export function hasPlaintextSecret(payload: EncryptedPendingValue, plaintext: string): boolean {
  const serialized = JSON.stringify(payload);
  return serialized.includes(plaintext);
}

function derivePendingChangeKey(passphrase: string, salt: Buffer): Buffer {
  return scryptSync(passphrase, salt, KEY_BYTES);
}
