import { describe, expect, it } from 'bun:test';
import React from 'react';
import { Text } from 'ink';
import { render } from 'ink-testing-library';
import { useTheme } from './use-theme.js';
import { useSettingsStore } from '../stores/settings-store.js';

const ThemeView: React.FC = () => {
  const theme = useTheme();
  return <Text>{theme.colors.primary}</Text>;
};

describe('useTheme', () => {
  it('returns default-dark palette for theme dark', () => {
    useSettingsStore.getState().setSettings({ locale: 'es', theme: 'dark', backupPath: '' });
    const { lastFrame } = render(<ThemeView />);
    expect(lastFrame()).toContain('cyan');
  });

  it('returns default-dark palette for unknown theme', () => {
    useSettingsStore.getState().setSettings({ locale: 'es', theme: 'unknown-theme' as 'dark', backupPath: '' });
    const { lastFrame } = render(<ThemeView />);
    expect(lastFrame()).toContain('cyan');
  });
});
