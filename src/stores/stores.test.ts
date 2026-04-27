import { afterEach, describe, expect, it } from 'bun:test';
import { useAppStore } from './app-store.js';
import { usePendingChangesStore } from './pending-changes-store.js';
import { seedServers, useServersStore } from './servers-store.js';
import { useSettingsStore } from './settings-store.js';
import { validateWizardServerName } from '../services/create-server-wizard-service.js';

describe('stores', () => {
  afterEach(() => {
    useAppStore.getState().resetNavigation();
    useServersStore.getState().resetServers();
  });

  it('exposes initial state', () => {
    expect(useServersStore.getState().servers).toEqual(seedServers);
    expect(usePendingChangesStore.getState().changes).toEqual([]);
    expect(useSettingsStore.getState().settings.locale).toBe('es');
    expect(useAppStore.getState().navigation.current).toBe('dashboard');
  });

  it('tracks navigation flow and server selection', () => {
    const app = useAppStore.getState();
    const servers = useServersStore.getState();

    expect(app.navigation).toMatchObject({
      current: 'dashboard',
      mode: 'global',
      focusedPanel: 'left',
      globalMenuIndex: 1,
      serverMenuIndex: 0,
      activeServersCursor: 0,
    });

    app.toggleFocusedPanel();
    expect(useAppStore.getState().navigation.focusedPanel).toBe('right');

    app.moveGlobalMenu(1, 4);
    expect(useAppStore.getState().navigation.globalMenuIndex).toBe(2);
    expect(useAppStore.getState().navigation.activeServersCursor).toBe(0);

    app.moveActiveServersCursor(1, 3);
    expect(useAppStore.getState().navigation.activeServersCursor).toBe(1);

    servers.selectServerByIndex(1);
    app.enterServerDashboard();

    expect(useAppStore.getState().navigation).toMatchObject({
      current: 'servers',
      mode: 'server',
      focusedPanel: 'left',
      serverMenuIndex: 0,
    });
    expect(useServersStore.getState().selectedServerId).toBe('pvp');

    app.moveServerMenu(1, 11);
    expect(useAppStore.getState().navigation.serverMenuIndex).toBe(1);

    app.exitServerDashboard();
    expect(useAppStore.getState().navigation).toMatchObject({
      current: 'dashboard',
      mode: 'global',
      focusedPanel: 'left',
      globalMenuIndex: 1,
    });

    app.resetNavigation();
    expect(useAppStore.getState().navigation).toMatchObject({
      current: 'dashboard',
      mode: 'global',
      focusedPanel: 'left',
      globalMenuIndex: 1,
      serverMenuIndex: 0,
      activeServersCursor: 0,
    });
  });

  it('opens, advances, goes back, and cancels the create server wizard', () => {
    const app = useAppStore.getState();

    app.openCreateServerWizard();
    expect(useAppStore.getState().navigation.current).toBe('wizard');

    expect(app.nextWizardStep()).toBe(true);
    expect(useAppStore.getState().createServerWizard.stepIndex).toBe(1);

    app.previousWizardStep();
    expect(useAppStore.getState().createServerWizard.stepIndex).toBe(0);

    app.cancelCreateServerWizard();
    expect(useAppStore.getState().navigation.current).toBe('dashboard');
    expect(useAppStore.getState().createServerWizard.stepIndex).toBe(0);
  });

  it('validates wizard server names', () => {
    expect(validateWizardServerName('')).toBe('Server name is required.');
    expect(validateWizardServerName('   ')).toBe('Server name is required.');
    expect(validateWizardServerName('!!!')).toBe('Server name must include letters or numbers.');
    expect(validateWizardServerName('good-name_1')).toBeNull();
  });
});
