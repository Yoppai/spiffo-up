import { beforeAll, describe, expect, it } from 'bun:test';
import { handleGlobalSettingsInput } from '../main-menu/global-settings-input.js';
import { useAppStore } from '../../stores/app-store.js';

beforeAll(async () => {
  const { default: i18next } = await import('i18next');
  await i18next.changeLanguage('es');
});

describe('handleGlobalSettingsInput', () => {
  it('exits language mode with ESC', () => {
    useAppStore.getState().resetNavigation();
    useAppStore.getState().setGlobalRightMode('language');
    const app = useAppStore.getState();
    const navigation = app.navigation;

    handleGlobalSettingsInput({ app, key: { escape: true }, navigation, input: '' });

    expect(useAppStore.getState().navigation.globalRightMode).toBe('list');
  });

  it('exits theme mode with ESC', () => {
    useAppStore.getState().resetNavigation();
    useAppStore.getState().setGlobalRightMode('theme');
    const app = useAppStore.getState();
    const navigation = app.navigation;

    handleGlobalSettingsInput({ app, key: { escape: true }, navigation, input: '' });

    expect(useAppStore.getState().navigation.globalRightMode).toBe('list');
  });

  it('exits backup-path mode with ESC', () => {
    useAppStore.getState().resetNavigation();
    useAppStore.getState().setGlobalRightMode('backup-path');
    const app = useAppStore.getState();
    const navigation = app.navigation;

    handleGlobalSettingsInput({ app, key: { escape: true }, navigation, input: '' });

    expect(useAppStore.getState().navigation.globalRightMode).toBe('list');
  });

  it('moves cursor in list mode', () => {
    useAppStore.getState().resetNavigation();
    const app = useAppStore.getState();
    const navigation = app.navigation;

    handleGlobalSettingsInput({ app, key: { downArrow: true }, navigation, input: '' });

    expect(useAppStore.getState().navigation.globalRightCursor).toBe(1);
  });

  it('enters language mode from list on ENTER at index 0', () => {
    useAppStore.getState().resetNavigation();
    const app = useAppStore.getState();
    const navigation = app.navigation;

    handleGlobalSettingsInput({ app, key: { return: true }, navigation, input: '' });

    expect(useAppStore.getState().navigation.globalRightMode).toBe('language');
  });
});
