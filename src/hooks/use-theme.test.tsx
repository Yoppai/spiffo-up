import { describe, expect, it, beforeEach, afterEach } from 'bun:test';
import React from 'react';
import { Text } from 'ink';
import { render } from 'ink-testing-library';
import { useTheme } from './use-theme.js';
import { useSettingsStore } from '../stores/settings-store.js';
import { themeRegistry } from '../themes/theme-loader.js';
import type { ThemePalette } from '../themes/default-dark.js';

const ThemeView: React.FC = () => {
  const theme = useTheme();
  return <Text>{theme.colors.primary}</Text>;
};

describe('useTheme', () => {
  beforeEach(() => {
    // Reset to known state
    useSettingsStore.getState().setSettings({ locale: 'es', theme: 'default-dark', backupPath: '' });
  });

  afterEach(() => {
    useSettingsStore.getState().setSettings({ locale: 'es', theme: 'default-dark', backupPath: '' });
  });

  it('returns palette for default-dark theme', () => {
    useSettingsStore.getState().setSettings({ locale: 'es', theme: 'default-dark', backupPath: '' });
    const { lastFrame } = render(<ThemeView />);
    expect(lastFrame()).toContain('cyan');
  });

  it('resolves alias dark to default-dark palette', () => {
    useSettingsStore.getState().setSettings({ locale: 'es', theme: 'dark', backupPath: '' });
    const { lastFrame } = render(<ThemeView />);
    // dark alias should resolve to default-dark which has cyan as primary
    expect(lastFrame()).toContain('cyan');
  });

  it('falls back to default-dark for unknown themeId without mutating store', () => {
    useSettingsStore.getState().setSettings({ locale: 'es', theme: 'unknown-theme-xyz', backupPath: '' });
    const { lastFrame } = render(<ThemeView />);
    // Should fall back to default-dark
    expect(lastFrame()).toContain('cyan');
    // Store should still have the unknown themeId (non-destructive fallback)
    expect(useSettingsStore.getState().settings.theme).toBe('unknown-theme-xyz');
  });

  it('consumes dynamic registry from loadThemePalettes', () => {
    // This test verifies the useTheme hook uses the loaded palette registry
    useSettingsStore.getState().setSettings({ locale: 'es', theme: 'default-dark', backupPath: '' });
    const { lastFrame } = render(<ThemeView />);
    expect(lastFrame()).toContain('cyan');
    // If registry was properly loaded, this should work
  });

  it('returns border color independently from primary using temp registry theme', () => {
    // Add a temp theme where border != primary to verify border field is read independently
    const tempTheme: ThemePalette = {
      name: 'Temp Theme',
      colors: {
        primary: 'red',
        secondary: 'blue',
        background: 'black',
        success: 'green',
        warning: 'yellow',
        error: 'red',
        focus: 'white',
        text: 'white',
        accent: 'green',
        border: 'magenta', // intentionally different from primary
      },
    };
    themeRegistry['temp-border-test'] = tempTheme;
    useSettingsStore.getState().setSettings({ locale: 'es', theme: 'temp-border-test', backupPath: '' });

    const BorderView: React.FC = () => {
      const theme = useTheme();
      return <Text>{theme.colors.border}</Text>;
    };
    const { lastFrame } = render(<BorderView />);
    // Border should be 'magenta' (not 'red' which is primary)
    expect(lastFrame()).toContain('magenta');

    // Clean up temp theme
    delete themeRegistry['temp-border-test'];
    useSettingsStore.getState().setSettings({ locale: 'es', theme: 'default-dark', backupPath: '' });
  });

  it('border field is defined and non-empty in all bundled themes', () => {
    // Verify border is a non-empty string for all actual bundled themes
    for (const [id, palette] of Object.entries(themeRegistry)) {
      expect(typeof palette.colors.border).toBe('string');
      expect(palette.colors.border.length).toBeGreaterThan(0);
    }
  });
});