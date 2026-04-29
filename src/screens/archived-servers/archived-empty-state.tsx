import React from 'react';
import { Box, Text } from 'ink';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../hooks/use-theme.js';

export const ArchivedEmptyState: React.FC = () => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <Box flexDirection="column" paddingTop={1}>
      <Text bold color={colors.text}>{t('archived.empty.title')}</Text>
      <Text dimColor>{t('archived.empty.description')}</Text>
    </Box>
  );
};