import React from 'react';
import { Box } from 'ink';
import InkBigText from 'ink-big-text';
import { useTranslation } from 'react-i18next';

interface TuiHeaderProps {
  title?: string;
}

export const TuiHeader: React.FC<TuiHeaderProps> = ({ title }) => {
  const { t } = useTranslation();
  const displayTitle = title ?? t('header.title');
  return (
    <Box justifyContent="center" flexShrink={0}>
      <Box flexDirection="column" alignItems="center">
        <InkBigText text={displayTitle} font="tiny" />
      </Box>
    </Box>
  );
};
