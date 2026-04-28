import React from 'react';
import { Text } from 'ink';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../hooks/use-theme.js';
import { TitledPanel } from './titled-panel.js';

interface SystemStatusProps {
  version: string;
  activeServers: number;
  totalServers: number;
  uptime?: string;
}

export const SystemStatus: React.FC<SystemStatusProps> = ({ version, activeServers, totalServers, uptime = '0m' }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  return (
    <TitledPanel title={t('systemStatus.title')}>
      <Text color={theme.colors.text}>
        {t('systemStatus.version', { version })} | {t('systemStatus.activeServers')}: <Text color={theme.colors.accent}>{activeServers}</Text> | {t('systemStatus.totalServers')}:{' '}
        <Text color={theme.colors.primary}>{totalServers}</Text> | {t('systemStatus.uptime')}: {uptime}
      </Text>
    </TitledPanel>
  );
};
