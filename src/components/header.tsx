import React from 'react';
import { Box, Text } from 'ink';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../hooks/use-theme.js';

interface TuiHeaderProps {
  title?: string;
}

export const TuiHeader: React.FC<TuiHeaderProps> = ({ title }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const displayTitle = title ?? t('header.title');
  return (
    <Box justifyContent="center" flexShrink={0}>
      <Box flexDirection="column" alignItems="center">
        <Text bold color={theme.colors.primary}>{displayTitle}</Text>
      </Box>
    </Box>
  );
};
