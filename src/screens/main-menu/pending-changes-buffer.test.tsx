import { afterEach, describe, expect, it } from 'bun:test';
import React from 'react';
import { render } from 'ink-testing-library';
import { App } from '../../cli/app.js';
import { TuiFooter } from '../../components/footer.js';
import { ApplyPendingChangesModal } from '../../components/pending-changes-modal.js';
import { useAppStore } from '../../stores/app-store.js';
import { usePendingChangesStore } from '../../stores/pending-changes-store.js';
import { seedServers, useServersStore } from '../../stores/servers-store.js';
import type { PendingChange } from '../../types/index.js';

const pendingChange: PendingChange = {
  id: 'chg-1',
  label: 'MaxPlayers',
  scope: 'server',
  panel: 'server-management',
  category: 'env',
  oldValue: '8',
  newValue: '16',
};

afterEach(() => {
  useAppStore.getState().resetNavigation();
  usePendingChangesStore.getState().reset();
  useServersStore.getState().resetServers();
});

describe('pending changes buffer ui', () => {
  it('renders footer and modal state', () => {
    usePendingChangesStore.getState().setChanges([
      { id: 'chg-1', label: 'secret', scope: 'server', panel: 'advanced-settings', sensitive: true, encryptedValue: { version: 1, algorithm: 'aes-256-gcm', kdf: 'scrypt', salt: 'cw==', nonce: 'cw==', authTag: 'cw==', ciphertext: 'cw==' } as never },
    ]);
    useAppStore.getState().openPendingChangesModal();

    const footer = render(<TuiFooter pendingChangesCount={1} />);
    expect(footer.lastFrame() ?? '').toContain('[Ctrl+A] Apply (1)');

    const modal = render(<ApplyPendingChangesModal />);
    expect(modal.lastFrame() ?? '').toContain('Apply Pending Changes');

    useAppStore.getState().setPendingChangesModalMode('passphrase');
    useAppStore.getState().setPendingChangesPassphraseInput('a');
    modal.rerender(<ApplyPendingChangesModal />);
    expect(modal.lastFrame() ?? '').toContain('Sensitive changes require session passphrase.');
    expect(modal.lastFrame() ?? '').toContain('Passphrase: *');

    useAppStore.getState().closePendingChangesModal();
    expect(useAppStore.getState().pendingChangesModal.isOpen).toBe(false);
  });

  it('renders dashboard indicators from global buffer', () => {
    useServersStore.getState().selectServer(seedServers[0]?.id ?? null);
    useAppStore.getState().enterServerDashboard();
    usePendingChangesStore.getState().setChanges([pendingChange]);

    const { lastFrame } = render(<App />);
    const frame = lastFrame() ?? '';

    expect(frame).toContain('1 pending changes · Press Ctrl+A to apply');
    expect(frame).toContain('Server Management •');
    expect(frame).toContain('Apply All Changes (1)');
    expect(frame).toContain('[Ctrl+A] Apply (1)');
  });

  it('opens modal with Ctrl+A and intercepts ESC when buffer exists', () => {
    useServersStore.getState().selectServer(seedServers[0]?.id ?? null);
    useAppStore.getState().enterServerDashboard();
    usePendingChangesStore.getState().setChanges([pendingChange]);

    const ctrlA = render(<App />);
    ctrlA.stdin.write('\u0001');
    expect(useAppStore.getState().pendingChangesModal.isOpen).toBe(true);
    ctrlA.rerender(<App />);
    expect(ctrlA.lastFrame() ?? '').toContain('Apply Pending Changes');
    ctrlA.unmount();

    useAppStore.getState().closePendingChangesModal();
    useAppStore.getState().moveServerMenu(10, 11);
    const escape = render(<App />);
    escape.stdin.write('\r');
    expect(useAppStore.getState().navigation.mode).toBe('server');
    expect(useAppStore.getState().pendingChangesModal.isOpen).toBe(true);
  });

  it('prompts for passphrase before applying sensitive changes', () => {
    useServersStore.getState().selectServer(seedServers[0]?.id ?? null);
    useAppStore.getState().enterServerDashboard();
    usePendingChangesStore.getState().setChanges([{ ...pendingChange, sensitive: true, encryptedValue: { version: 1, algorithm: 'aes-256-gcm', kdf: 'scrypt', salt: 'cw==', nonce: 'cw==', authTag: 'cw==', ciphertext: 'cw==' } as never }]);
    useAppStore.getState().openPendingChangesModal();

    const { stdin } = render(<App />);
    stdin.write('\r');

    expect(useAppStore.getState().pendingChangesModal.mode).toBe('passphrase');
  });
});
