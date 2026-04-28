import React from 'react';
import type { ReactNode } from 'react';
import { Box } from 'ink';
import { TitledBox } from '@mishieck/ink-titled-box';
import { useTheme } from '../hooks/use-theme.js';

interface TitledPanelProps {
  title: string;
  isFocused?: boolean;
  width?: number;
  minHeight?: number;
  children: ReactNode;
}

export const TitledPanel: React.FC<TitledPanelProps> = ({ title, isFocused = false, width, minHeight, children }) => {
  const theme = useTheme();
  return (
    <Box width={width} minHeight={minHeight} flexDirection="column">
      <TitledBox borderStyle="round" borderColor={isFocused ? theme.colors.focus : theme.colors.text} titles={[title]}>
        <Box flexDirection="column" paddingX={1} minHeight={minHeight ? Math.max(1, minHeight - 2) : undefined}>
          {children}
        </Box>
      </TitledBox>
    </Box>
  );
};
