import type { NavigationState } from '../../types/index.js';
import type { useAppStore } from '../../stores/app-store.js';
import { applyLanguageSelection, applyThemeSelection } from '../global-settings/global-settings-panel.js';

const GLOBAL_SETTINGS_OPTIONS_COUNT = 3;

interface GlobalSettingsInputParams {
  app: ReturnType<typeof useAppStore.getState>;
  key: { upArrow?: boolean; downArrow?: boolean; return?: boolean; escape?: boolean; backspace?: boolean; delete?: boolean };
  navigation: NavigationState;
  input: string;
}

export function handleGlobalSettingsInput({ app, key, navigation, input }: GlobalSettingsInputParams): void {
  if (navigation.globalRightMode === 'list') {
    if (key.upArrow) app.moveGlobalRightCursor(-1, GLOBAL_SETTINGS_OPTIONS_COUNT);
    if (key.downArrow) app.moveGlobalRightCursor(1, GLOBAL_SETTINGS_OPTIONS_COUNT);
    if (key.return) {
      const optionIndex = navigation.globalRightCursor;
      if (optionIndex === 0) app.setGlobalRightMode('language');
      if (optionIndex === 1) app.setGlobalRightMode('theme');
      if (optionIndex === 2) app.setGlobalRightMode('backup-path');
    }
    return;
  }

  if (navigation.globalRightMode === 'language') {
    if (key.escape) {
      app.setGlobalRightMode('list');
      return;
    }
    if (key.upArrow) app.moveGlobalRightCursor(-1, 2);
    if (key.downArrow) app.moveGlobalRightCursor(1, 2);
    if (key.return) {
      applyLanguageSelection(navigation.globalRightCursor);
      app.setGlobalRightMode('list');
    }
    return;
  }

  if (navigation.globalRightMode === 'theme') {
    if (key.escape) {
      app.setGlobalRightMode('list');
      return;
    }
    if (key.upArrow) app.moveGlobalRightCursor(-1, 1);
    if (key.downArrow) app.moveGlobalRightCursor(1, 1);
    if (key.return) {
      applyThemeSelection(navigation.globalRightCursor);
      app.setGlobalRightMode('list');
    }
    return;
  }

  if (navigation.globalRightMode === 'backup-path') {
    if (key.escape) {
      app.setGlobalRightMode('list');
      return;
    }
    // Backup path editing is handled by the component itself via ink-text-input
    // We only handle mode exit here
    return;
  }
}
