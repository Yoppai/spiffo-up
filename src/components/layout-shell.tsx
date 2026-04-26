import React from 'react';
import type { ReactNode } from 'react';
import { Box, Text } from 'ink';
import { calculateLayoutDimensions } from './layout-utils.js';
import { TuiFooter } from './footer.js';
import { TuiHeader } from './header.js';
import { TitledPanel } from './titled-panel.js';
import { SystemStatus } from './system-status.js';

interface LayoutShellProps {
  leftTitle: string;
  rightTitle: string;
  focusedPanel: 'left' | 'right';
  activeServers: number;
  totalServers: number;
  pendingChangesCount?: number;
  left: ReactNode;
  right: ReactNode;
  width?: number;
  height?: number;
}

export const LayoutShell: React.FC<LayoutShellProps> = ({
  leftTitle,
  rightTitle,
  focusedPanel,
  activeServers,
  totalServers,
  pendingChangesCount = 0,
  left,
  right,
  width = process.stdout.columns,
  height = process.stdout.rows,
}) => {
  const dimensions = calculateLayoutDimensions(width, height);

  if (dimensions.isTooSmall) {
    return (
      <Box flexDirection="column" borderStyle="round" paddingX={1}>
        <Text color="yellow">Terminal demasiado pequeña.</Text>
        <Text>Agrandá la ventana para usar el dashboard de SPIFFO-UP.</Text>
      </Box>
    );
  }

  const contentHeight = Math.max(8, dimensions.height - 13);

  return (
    <Box flexDirection="column" width={dimensions.width} minHeight={dimensions.height}>
      <TuiHeader />
      <SystemStatus version="1.0.0" activeServers={activeServers} totalServers={totalServers} />
      <Box flexGrow={1} minHeight={contentHeight}>
        <TitledPanel title={leftTitle} isFocused={focusedPanel === 'left'} width={dimensions.leftWidth} minHeight={contentHeight}>
          {left}
        </TitledPanel>
        <TitledPanel title={rightTitle} isFocused={focusedPanel === 'right'} width={dimensions.rightWidth} minHeight={contentHeight}>
          {right}
        </TitledPanel>
      </Box>
      <TuiFooter pendingChangesCount={pendingChangesCount} />
    </Box>
  );
};
