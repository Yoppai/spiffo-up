import { beforeAll, describe, expect, it } from 'bun:test';
import React from 'react';
import { render } from 'ink-testing-library';
import { BackupPathInput } from './backup-path-input.js';
import { useSettingsStore } from '../../stores/settings-store.js';

beforeAll(async () => {
  const { default: i18next } = await import('i18next');
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
