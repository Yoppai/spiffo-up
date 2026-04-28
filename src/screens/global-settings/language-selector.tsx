import React from 'react';
import { Box, Text } from 'ink';
import { useTranslation } from 'react-i18next';
import i18next from '../../i18n/config.js';
import { useSettingsStore } from '../../stores/settings-store.js';

const languages = [
  { id: 'es', label: 'Español (ES)' },
  { id: 'en', label: 'English (EN)' },
];

export const LanguageSelector: React.FC<{ cursor: number }> = ({ cursor }) => {
  const { t } = useTranslation();

  return (
    <Box flexDirection="column">
      <Text bold>{t('settings.language')}</Text>
      {languages.map((lang, index) => {
        const isSelected = index === cursor;
        return (
          <Text key={lang.id} color={isSelected ? 'cyan' : undefined}>
            {isSelected ? '> ' : '  '}{lang.label}
          </Text>
        );
      })}
    </Box>
  );
};

export function applyLanguageSelection(cursor: number): void {
  const langId = languages[cursor]?.id ?? 'es';
  i18next.changeLanguage(langId);
  useSettingsStore.getState().updateSettings({ locale: langId as 'es' | 'en' });
}
