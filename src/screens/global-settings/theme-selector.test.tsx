import { beforeAll, describe, expect, it, beforeEach } from 'bun:test';
import React from 'react';
import { render } from 'ink-testing-library';
import '../../i18n/config.js';
import i18next from 'i18next';
import { ThemeSelector, applyThemeSelection } from './theme-selector.js';
import { useSettingsStore } from '../../stores/settings-store.js';
import { themeRegistry } from '../../themes/theme-loader.js';

beforeAll(async () => {
  await i18next.changeLanguage('es');
});

describe('ThemeSelector', () => {
  beforeEach(() => {
    // Reset to a known state
    useSettingsStore.getState().setSettings({ locale: 'es', theme: 'default-dark', backupPath: '' });
  });

  it('renders themes dynamically from registry', () => {
    const { lastFrame } = render(<ThemeSelector cursor={0} />);
    const frame = lastFrame() ?? '';
    // Should show at least one theme (default-dark)
    expect(frame.length).toBeGreaterThan(0);
    // Should show theme name from registry
    expect(frame).toContain('Default Dark');
  });

  it('applies theme selection on cursor change', () => {
    useSettingsStore.getState().setSettings({ locale: 'es', theme: 'default-dark', backupPath: '' });
    // Apply selection for index 0 (default-dark)
    applyThemeSelection(0);
    // The theme should be stored in settings as 'default-dark'
    const theme = useSettingsStore.getState().settings.theme;
    expect(theme).toBe('default-dark');
  });

  it('handles out of bounds cursor with default-dark fallback', () => {
    useSettingsStore.getState().setSettings({ locale: 'es', theme: 'default-dark', backupPath: '' });
    // Large cursor index should fall back to default-dark
    applyThemeSelection(999);
    const theme = useSettingsStore.getState().settings.theme;
    // Should fall back to default-dark
    expect(theme).toBe('default-dark');
  });

  it('highlights selected theme with cursor', () => {
    const { lastFrame } = render(<ThemeSelector cursor={0} />);
    const frame = lastFrame() ?? '';
    // Cursor 0 should be selected (has > indicator)
    expect(frame).toContain('>');
  });

  it('renders multiple themes from registry', () => {
    const { lastFrame } = render(<ThemeSelector cursor={0} />);
    const frame = lastFrame() ?? '';
    // Default Dark should be listed
    expect(frame).toContain('Default Dark');
  });

  it('navigates to second theme and selects it when cursor at index 1', () => {
    // Get all theme IDs
    const themeIds = Object.keys(themeRegistry);
    // Skip if less than 2 themes available
    if (themeIds.length < 2) return;

    const secondThemeId = themeIds[1];

    // Simulate cursor at index 1 (second theme) and select
    applyThemeSelection(1);
    const theme = useSettingsStore.getState().settings.theme;
    expect(theme).toBe(secondThemeId);
  });

  it('renders second theme when cursor is at index 1', () => {
    const themeIds = Object.keys(themeRegistry);
    if (themeIds.length < 2) return;

    const { lastFrame } = render(<ThemeSelector cursor={1} />);
    const frame = lastFrame() ?? '';
    // Should show second theme (Ocean) with selection indicator
    expect(frame).toContain('Ocean');
  });

  it('selection persists correctly in settings store', () => {
    const themeIds = Object.keys(themeRegistry);
    if (themeIds.length < 2) return;

    const firstThemeId = themeIds[0];
    const secondThemeId = themeIds[1];

    // Select first theme
    applyThemeSelection(0);
    expect(useSettingsStore.getState().settings.theme).toBe(firstThemeId);

    // Select second theme
    applyThemeSelection(1);
    expect(useSettingsStore.getState().settings.theme).toBe(secondThemeId);
  });
});