import React from 'react';
import { Box, Text } from 'ink';
import { useTranslation } from 'react-i18next';
import { useInkStore } from '../../hooks/use-ink-store.js';
import { useAppStore } from '../../stores/app-store.js';
import { useSettingsStore } from '../../stores/settings-store.js';
import { useTheme } from '../../hooks/use-theme.js';
import { LanguageSelector, applyLanguageSelection } from './language-selector.js';
import { ThemeSelector, applyThemeSelection } from './theme-selector.js';
import { BackupPathInput } from './backup-path-input.js';
import { themeRegistry } from '../../themes/theme-loader.js';

const SETTINGS_OPTIONS = ['settings.language', 'settings.theme', 'settings.backupPath'] as const;

export const GlobalSettingsPanel: React.FC = () => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const navigation = useInkStore(useAppStore, (state) => state.navigation);
  const settings = useSettingsStore((state) => state.settings);

  if (navigation.globalRightMode === 'language') {
    return <LanguageSelector cursor={navigation.globalRightCursor} />;
  }

  if (navigation.globalRightMode === 'theme') {
    return <ThemeSelector cursor={navigation.globalRightCursor} />;
  }

  if (navigation.globalRightMode === 'backup-path') {
    return <BackupPathInput />;
  }

  const currentValues = [
    i18n.language === 'es' ? 'Español' : 'English',
    themeRegistry[settings.theme]?.name ?? 'Default Dark',
    settings.backupPath || '-',
  ];

  return (
    <Box flexDirection="column">
      {SETTINGS_OPTIONS.map((key, index) => {
        const isSelected = index === navigation.globalRightCursor;
        return (
           <Text key={key} backgroundColor={isSelected ? theme.colors.primary : undefined} color={isSelected ? 'black' : undefined}>
            {isSelected ? '> ' : '  '}{t(key)}: {currentValues[index]}
          </Text>
        );
      })}
    </Box>
  );
};

export { applyLanguageSelection, applyThemeSelection };
