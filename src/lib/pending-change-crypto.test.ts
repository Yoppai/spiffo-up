import { describe, expect, it } from 'bun:test';
import { decryptPendingSecret, encryptPendingSecret, hasPlaintextSecret, PendingChangeDecryptError } from './pending-change-crypto.js';

describe('pending change crypto', () => {
  it('encrypts and decrypts with passphrase', () => {
    const payload = encryptPendingSecret('top-secret', 'passphrase');

    expect(decryptPendingSecret(payload, 'passphrase')).toBe('top-secret');
    expect(hasPlaintextSecret(payload, 'top-secret')).toBe(false);
    expect(JSON.stringify(payload)).not.toContain('top-secret');
  });

  it('rejects invalid passphrase', () => {
    const payload = encryptPendingSecret('top-secret', 'passphrase');

    expect(() => decryptPendingSecret(payload, 'wrong')).toThrow(PendingChangeDecryptError);
  });
});
