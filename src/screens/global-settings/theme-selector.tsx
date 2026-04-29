import React from 'react';
import { Box, Text } from 'ink';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '../../stores/settings-store.js';
import { themeRegistry } from '../../themes/theme-loader.js';

export const ThemeSelector: React.FC<{ cursor: number }> = ({ cursor }) => {
  const { t } = useTranslation();
  const registry = themeRegistry;
  const themeIds = Object.keys(registry);

  return (
    <Box flexDirection="column">
      <Text bold>{t('settings.theme')}</Text>
      {themeIds.map((themeId, index) => {
        const palette = registry[themeId];
        const isSelected = index === cursor;
        return (
          <Text key={themeId} color={isSelected ? 'cyan' : undefined}>
            {isSelected ? '> ' : '  '}{palette?.name ?? 'Unknown'}
          </Text>
        );
      })}
    </Box>
  );
};

export function applyThemeSelection(cursor: number): void {
  const registry = themeRegistry;
  const themeIds = Object.keys(registry);
  const themeId = themeIds[cursor] ?? 'default-dark';
  useSettingsStore.getState().updateSettings({ theme: themeId });
}