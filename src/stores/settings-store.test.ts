import { afterEach, describe, expect, it } from 'bun:test';
import { useSettingsStore } from '../stores/settings-store.js';

describe('settings-store', () => {
  afterEach(() => {
    useSettingsStore.getState().setSettings({ locale: 'es', theme: 'default-dark', backupPath: '' });
  });

  it('persists locale changes via updateSettings', () => {
    const store = useSettingsStore.getState();
    store.updateSettings({ locale: 'en' });
    expect(useSettingsStore.getState().settings.locale).toBe('en');
  });

  it('persists theme changes via updateSettings', () => {
    const store = useSettingsStore.getState();
    store.updateSettings({ theme: 'default-dark' });
    expect(useSettingsStore.getState().settings.theme).toBe('default-dark');
  });

  it('persists backupPath changes via updateSettings', () => {
    const store = useSettingsStore.getState();
    store.updateSettings({ backupPath: '/tmp/backups' });
    expect(useSettingsStore.getState().settings.backupPath).toBe('/tmp/backups');
  });

  it('merges partial updates without losing other fields', () => {
    useSettingsStore.getState().setSettings({ locale: 'es', theme: 'default-dark', backupPath: '/var' });
    useSettingsStore.getState().updateSettings({ locale: 'en' });
    const settings = useSettingsStore.getState().settings;
    expect(settings.locale).toBe('en');
    expect(settings.theme).toBe('default-dark');
    expect(settings.backupPath).toBe('/var');
  });
});
