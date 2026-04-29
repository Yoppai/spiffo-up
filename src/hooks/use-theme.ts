import { useMemo } from 'react';
import { useSettingsStore } from '../stores/settings-store.js';
import { themeRegistry, type ThemePalette } from '../themes/theme-loader.js';
import { defaultDarkTheme } from '../themes/default-dark.js';

const LEGACY_ALIASES: Record<string, string> = {
  dark: 'default-dark',
};

export interface Theme {
  colors: ThemePalette['colors'];
}

export function useTheme(): Theme {
  const themeId = useSettingsStore((state) => state.settings.theme);
  const resolvedId = LEGACY_ALIASES[themeId] ?? themeId;
  const palette = useMemo(
    () => themeRegistry[resolvedId] ?? defaultDarkTheme,
    [resolvedId]
  );
  return { colors: palette.colors };
}