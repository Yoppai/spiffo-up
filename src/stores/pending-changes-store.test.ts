import { afterEach, describe, expect, it } from 'bun:test';
import { useAppStore } from './app-store.js';
import { usePendingChangesStore } from './pending-changes-store.js';
import type { PendingChange } from '../types/index.js';

const encryptedValue = { version: 1, algorithm: 'aes-256-gcm', kdf: 'scrypt', salt: 'cw==', nonce: 'cw==', authTag: 'cw==', ciphertext: 'cw==' } as const;
const change: PendingChange = { id: 'c1', label: 'secret', scope: 'server', panel: 'advanced-settings', sensitive: true, oldValue: 'plain-old', newValue: 'plain-new', encryptedValue };

describe('pending changes store', () => {
  afterEach(() => usePendingChangesStore.getState().reset());

  it('tracks panel indicators and modal state', () => {
    const store = usePendingChangesStore.getState();
    store.addChange(change);

    expect(store.hasPanelChanges('advanced-settings')).toBe(true);
    expect(store.getPanelChangeCounts()).toEqual({ 'advanced-settings': 1 });
    expect(store.getGroupedChanges()[0]?.changes[0]?.id).toBe('c1');
    expect(store.getGroupedChanges()[0]?.changes[0]?.newValue).toBe('[changed]');
    expect(store.hasSensitiveChanges()).toBe(true);
  });

  it('rejects sensitive changes before encrypted payload reaches store', () => {
    expect(() => usePendingChangesStore.getState().addChange({ id: 'unsafe', label: 'secret', scope: 'server', sensitive: true })).toThrow('Sensitive pending changes require encrypted payload');
  });

  it('resets on apply discard and unlock flow', () => {
    const store = usePendingChangesStore.getState();
    store.addChange(change);
    store.unlockSecretSession();
    useAppStore.getState().openPendingChangesModal();

    store.discardAll();
    expect(store.changes).toEqual([]);
    expect(store.secretSessionUnlocked).toBe(false);

    store.addChange(change);
    store.lockSecretSession();
    store.reset();
    expect(store.changes).toEqual([]);
    expect(store.secretSessionUnlocked).toBe(false);
  });
});
