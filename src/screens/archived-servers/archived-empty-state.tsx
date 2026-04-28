import React from 'react';
import { Box, Text } from 'ink';
import { useTranslation } from 'react-i18next';

export const ArchivedEmptyState: React.FC = () => {
  const { t } = useTranslation();
  return (
    <Box flexDirection="column" paddingTop={1}>
      <Text bold>{t('archived.empty.title')}</Text>
      <Text dimColor>{t('archived.empty.description')}</Text>
    </Box>
  );
};