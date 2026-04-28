import React from 'react';
import { Box, Text } from 'ink';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../hooks/use-theme.js';

interface TuiFooterProps {
  pendingChangesCount?: number;
}

export const TuiFooter: React.FC<TuiFooterProps> = ({ pendingChangesCount = 0 }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  return (
    <Box borderStyle="round" paddingX={1} flexShrink={0}>
      <Text color={theme.colors.text}>
        {t('footer.esc')}  {t('footer.navigate')}  {t('footer.tab')}  {t('footer.enter')}  {t('footer.f1')}{' '}
        {pendingChangesCount > 0 ? (
          <Text color={theme.colors.focus}>{t('footer.ctrlA')} ({pendingChangesCount})  </Text>
        ) : null}
        {t('footer.quit')}
      </Text>
    </Box>
  );
};
