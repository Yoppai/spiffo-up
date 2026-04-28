import React from 'react';
import { Box, Text } from 'ink';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '../../stores/settings-store.js';

const themes = [
  { id: 'default-dark', label: 'Default Dark' },
];

export const ThemeSelector: React.FC<{ cursor: number }> = ({ cursor }) => {
  const { t } = useTranslation();

  return (
    <Box flexDirection="column">
      <Text bold>{t('settings.theme')}</Text>
      {themes.map((theme, index) => {
        const isSelected = index === cursor;
        return (
          <Text key={theme.id} color={isSelected ? 'cyan' : undefined}>
            {isSelected ? '> ' : '  '}{theme.label}
          </Text>
        );
      })}
    </Box>
  );
};

export function applyThemeSelection(cursor: number): void {
  const themeId = themes[cursor]?.id ?? 'default-dark';
  useSettingsStore.getState().updateSettings({ theme: themeId });
}
