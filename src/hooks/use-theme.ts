import { useMemo } from 'react';
import { useSettingsStore } from '../stores/settings-store.js';
import { defaultDarkTheme, type ThemePalette } from '../themes/default-dark.js';

const themes: Record<string, ThemePalette> = {
  'default-dark': defaultDarkTheme,
  dark: defaultDarkTheme,
};

export interface Theme {
  colors: ThemePalette;
}

export function useTheme(): Theme {
  const themeId = useSettingsStore((state) => state.settings.theme);
  const colors = useMemo(() => themes[themeId] ?? defaultDarkTheme, [themeId]);
  return { colors };
}
