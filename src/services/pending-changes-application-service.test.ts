import { describe, expect, it, mock } from 'bun:test';
import { PendingChangeMissingEncryptedPayloadError, PendingChangesApplicationService, planPendingChangeSteps } from './pending-changes-application-service.js';
import { encryptPendingSecret } from '../lib/pending-change-crypto.js';

describe('pending changes application service', () => {
  it('plans pipeline order', () => {
    expect(planPendingChangeSteps([
      { id: 'b', label: 'build', scope: 'server', category: 'build' },
      { id: 'i', label: 'infra', scope: 'server', category: 'infrastructure' },
    ]).map((step) => step.category)).toEqual(['infrastructure', 'build']);
  });

  it('applies locally and clears state', () => {
    const clearPendingChanges = mock(() => {});
    const store = { clearChanges: mock(() => {}), discardAll: mock(() => {}), unlockSecretSession: mock(() => {}), lockSecretSession: mock(() => {}) };
    const service = new PendingChangesApplicationService({ clearPendingChanges } as never, store);
    const encryptedValue = encryptPendingSecret('secret', 'pw');

    const result = service.applyAll({ changes: [{ id: '1', label: 's', scope: 'server', sensitive: true, encryptedValue, category: 'env' }], passphrase: 'pw' });

    expect(result.decryptedSecrets).toBe(1);
    expect(clearPendingChanges).toHaveBeenCalledTimes(1);
    expect(store.clearChanges).toHaveBeenCalledTimes(1);
    expect(store.unlockSecretSession).not.toHaveBeenCalled();
    expect(store.discardAll).not.toHaveBeenCalled();
    expect(store.lockSecretSession).toHaveBeenCalledTimes(1);
  });

  it('fails closed when sensitive payload is missing', () => {
    const clearPendingChanges = mock(() => {});
    const store = { clearChanges: mock(() => {}), discardAll: mock(() => {}), unlockSecretSession: mock(() => {}), lockSecretSession: mock(() => {}) };
    const service = new PendingChangesApplicationService({ clearPendingChanges } as never, store);

    expect(() => service.applyAll({ changes: [{ id: '1', label: 's', scope: 'server', sensitive: true, category: 'env' }], passphrase: 'pw' })).toThrow(PendingChangeMissingEncryptedPayloadError);
    expect(clearPendingChanges).not.toHaveBeenCalled();
    expect(store.clearChanges).not.toHaveBeenCalled();
  });

  it('discards locally without decrypting', () => {
    const clearPendingChanges = mock(() => {});
    const store = { clearChanges: mock(() => {}), discardAll: mock(() => {}), unlockSecretSession: mock(() => {}), lockSecretSession: mock(() => {}) };
    const service = new PendingChangesApplicationService({ clearPendingChanges } as never, store);

    service.discardAll();

    expect(clearPendingChanges).toHaveBeenCalledTimes(1);
    expect(store.discardAll).toHaveBeenCalledTimes(1);
    expect(store.lockSecretSession).toHaveBeenCalledTimes(1);
    expect(store.clearChanges).not.toHaveBeenCalled();
  });
});
