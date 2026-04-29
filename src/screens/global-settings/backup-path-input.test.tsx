import { beforeAll, describe, expect, it } from 'bun:test';
import React from 'react';
import { render } from 'ink-testing-library';
import '../../i18n/config.js';
import i18next from 'i18next';
import { BackupPathInput } from './backup-path-input.js';
import { useSettingsStore } from '../../stores/settings-store.js';

beforeAll(async () => {
  await i18next.changeLanguage('es');
});

describe('BackupPathInput', () => {
  it('renders with empty path', () => {
    useSettingsStore.getState().setSettings({ locale: 'es', theme: 'dark', backupPath: '' });
    const { lastFrame } = render(<BackupPathInput />);
    const frame = lastFrame() ?? '';
    expect(frame).toContain('Ruta de Backups');
  });

  it('renders with existing path', () => {
    useSettingsStore.getState().setSettings({ locale: 'es', theme: 'dark', backupPath: '/tmp' });
    const { lastFrame } = render(<BackupPathInput />);
    const frame = lastFrame() ?? '';
    expect(frame).toContain('/tmp');
  });
});
