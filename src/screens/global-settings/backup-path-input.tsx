import React, { useState } from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '../../stores/settings-store.js';
import fs from 'fs';

export const BackupPathInput: React.FC = () => {
  const { t } = useTranslation();
  const settings = useSettingsStore((state) => state.settings);
  const updateSettings = useSettingsStore((state) => state.updateSettings);
  const [path, setPath] = useState(settings.backupPath ?? '');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (value: string): void => {
    if (!value.trim()) {
      updateSettings({ backupPath: '' });
      setError(null);
      return;
    }

    try {
      fs.accessSync(value.trim(), fs.constants.W_OK);
      updateSettings({ backupPath: value.trim() });
      setError(null);
    } catch {
      setError(t('settings.backupPathError'));
    }
  };

  return (
    <Box flexDirection="column">
      <Text bold>{t('settings.backupPath')}</Text>
      <Box>
        <Text>{t('settings.path')}: </Text>
        <TextInput value={path} onChange={setPath} onSubmit={handleSubmit} />
      </Box>
      {error && <Text color="red">{error}</Text>}
    </Box>
  );
};
