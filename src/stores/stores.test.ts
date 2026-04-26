import { describe, expect, it } from 'bun:test';
import { useAppStore } from './app-store.js';
import { usePendingChangesStore } from './pending-changes-store.js';
import { useServersStore } from './servers-store.js';
import { useSettingsStore } from './settings-store.js';

describe('stores', () => {
  it('exposes initial state', () => {
    expect(useServersStore.getState().servers).toEqual([]);
    expect(usePendingChangesStore.getState().changes).toEqual([]);
    expect(useSettingsStore.getState().settings.locale).toBe('es');
    expect(useAppStore.getState().navigation.current).toBe('dashboard');
  });
});
