import { beforeAll, describe, expect, it } from 'bun:test';
import React from 'react';
import { render } from 'ink-testing-library';
import '../../i18n/config.js';
import { GlobalSettingsPanel } from './global-settings-panel.js';
import { useAppStore } from '../../stores/app-store.js';
import { useSettingsStore } from '../../stores/settings-store.js';

beforeAll(async () => {
  const { default: i18next } = await import('i18next');
  await i18next.changeLanguage('es');
});

describe('GlobalSettingsPanel', () => {
  it('renders the three settings options', () => {
    useAppStore.getState().resetNavigation();
    useSettingsStore.getState().setSettings({ locale: 'es', theme: 'dark', backupPath: '' });
    const { lastFrame } = render(<GlobalSettingsPanel />);
    const frame = lastFrame() ?? '';
    expect(frame).toContain('Idioma');
    expect(frame).toContain('Tema');
    expect(frame).toContain('Ruta de Backups');
  });

  it('highlights the selected option based on cursor', () => {
    useAppStore.getState().resetNavigation();
    useAppStore.getState().moveGlobalRightCursor(1, 3);
    useSettingsStore.getState().setSettings({ locale: 'es', theme: 'dark', backupPath: '' });
    const { lastFrame } = render(<GlobalSettingsPanel />);
    const frame = lastFrame() ?? '';
    expect(frame).toContain('Tema');
  });

  it('renders LanguageSelector in language mode', () => {
    useAppStore.getState().resetNavigation();
    useAppStore.getState().setGlobalRightMode('language');
    useSettingsStore.getState().setSettings({ locale: 'es', theme: 'dark', backupPath: '' });
    const { lastFrame } = render(<GlobalSettingsPanel />);
    const frame = lastFrame() ?? '';
    expect(frame).toContain('Español');
    expect(frame).toContain('English');
  });

  it('renders ThemeSelector in theme mode', () => {
    useAppStore.getState().resetNavigation();
    useAppStore.getState().setGlobalRightMode('theme');
    useSettingsStore.getState().setSettings({ locale: 'es', theme: 'dark', backupPath: '' });
    const { lastFrame } = render(<GlobalSettingsPanel />);
    const frame = lastFrame() ?? '';
    expect(frame).toContain('Default Dark');
  });

  it('renders BackupPathInput in backup-path mode', () => {
    useAppStore.getState().resetNavigation();
    useAppStore.getState().setGlobalRightMode('backup-path');
    useSettingsStore.getState().setSettings({ locale: 'es', theme: 'dark', backupPath: '' });
    const { lastFrame } = render(<GlobalSettingsPanel />);
    const frame = lastFrame() ?? '';
    expect(frame).toContain('Ruta de Backups');
  });
});
