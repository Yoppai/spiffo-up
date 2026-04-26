import React from 'react';
import { Box, Text } from 'ink';
import { truncateText } from '../../components/index.js';
import { formatServerAction, formatServerPlayers, formatServerStatus } from '../../lib/index.js';
import type { ServerRecord } from '../../types/index.js';

interface ServerListProps {
  servers: ServerRecord[];
  cursor: number;
}

export const ServerList: React.FC<ServerListProps> = ({ servers, cursor }) => {
  return (
    <Box flexDirection="column">
      <Text bold>NAME      │ INSTANCE TYPE  │ STATUS       │ PLAYERS │ ACCIONES</Text>
      <Text dimColor>──────────┼────────────────┼──────────────┼─────────┼────────</Text>
      {servers.map((server, index) => {
        const selected = cursor === index;
        return (
          <Text key={server.id} color={selected ? 'cyan' : undefined} inverse={selected}>
            {selected ? '>' : ' '} {truncateText(server.name.padEnd(8), 8)} │ {truncateText(server.instanceType.padEnd(14), 14)} │{' '}
            {formatServerStatus(server).padEnd(12)} │ {formatServerPlayers(server).padEnd(7)} │ {formatServerAction(server)}
          </Text>
        );
      })}
    </Box>
  );
};
