import React from 'react';
import { Box, Text } from 'ink';

interface TuiFooterProps {
  pendingChangesCount?: number;
}

export const TuiFooter: React.FC<TuiFooterProps> = ({ pendingChangesCount = 0 }) => {
  return (
    <Box borderStyle="round" paddingX={1} flexShrink={0}>
      <Text>
        [ESC] Back  [↑↓] Navegar  [TAB] Cambiar Panel  [ENTER] Seleccionar  [F1] Help{' '}
        {pendingChangesCount > 0 ? `[Ctrl+A] Apply (${pendingChangesCount})  ` : ''}[Q] Salir
      </Text>
    </Box>
  );
};
