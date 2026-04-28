import React from 'react';
import { Box, Text } from 'ink';
import { useTranslation } from 'react-i18next';

export const ArchivedServersPanel: React.FC = () => {
  const { t } = useTranslation();
  return (
    <Box flexDirection="column">
      <Text color="yellow">{t('common.comingSoon')}</Text>
      <Text>{t('common.comingSoonDescription')}</Text>
    </Box>
  );
};
