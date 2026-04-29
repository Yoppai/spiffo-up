import React from 'react';
import { Box, Text } from 'ink';
import { truncateText } from '../../components/index.js';
import { formatServerAction, formatServerPlayers, formatServerStatus } from '../../lib/index.js';
import { useTheme } from '../../hooks/use-theme.js';
import type { ServerRecord } from '../../types/index.js';

interface ServerListProps {
  servers: ServerRecord[];
  cursor: number;
}

export const ServerList: React.FC<ServerListProps> = ({ servers, cursor }) => {
  const { colors } = useTheme();
  return (
    <Box flexDirection="column">
      <Text color={colors.text} bold>NAME      │ INSTANCE TYPE  │ STATUS       │ PLAYERS │ ACCIONES</Text>
      <Text color={colors.text} dimColor>──────────┼────────────────┼──────────────┼─────────┼────────</Text>
      {servers.map((server, index) => {
        const selected = cursor === index;
        return (
          <Text key={server.id} color={selected ? colors.focus : colors.text} inverse={selected}>
            {selected ? '>' : ' '} {truncateText(server.name.padEnd(8), 8)} │ {truncateText(server.instanceType.padEnd(14), 14)} │{' '}
            {formatServerStatus(server).padEnd(12)} │ {formatServerPlayers(server).padEnd(7)} │ {formatServerAction(server)}
          </Text>
        );
      })}
    </Box>
  );
};
