import React from 'react';
import { Text } from 'ink';
import { TitledPanel } from './titled-panel.js';

interface SystemStatusProps {
  version: string;
  activeServers: number;
  totalServers: number;
  uptime?: string;
}

export const SystemStatus: React.FC<SystemStatusProps> = ({ version, activeServers, totalServers, uptime = '0m' }) => {
  return (
    <TitledPanel title="System Status">
      <Text>
        v{version} | Active Servers: <Text color="green">{activeServers}</Text> | Total Servers:{' '}
        <Text color="cyan">{totalServers}</Text> | Uptime: {uptime}
      </Text>
    </TitledPanel>
  );
};
