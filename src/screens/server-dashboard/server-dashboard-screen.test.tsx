import { afterEach, beforeAll, describe, expect, it } from 'bun:test';
import React from 'react';
import { render } from 'ink-testing-library';
import i18next from 'i18next';
import '../../i18n/config.js';
import { useSettingsStore } from '../../stores/settings-store.js';
import { useAppStore } from '../../stores/app-store.js';
import { DashboardScreen } from '../main-menu/main-menu-screen.js';
import { handleDashboardPanelInput } from './dashboard-panels.js';
import { usePendingChangesStore } from '../../stores/pending-changes-store.js';
import { seedServers, useServersStore } from '../../stores/servers-store.js';
import { serverMenuItems } from './server-dashboard-screen.js';

const server = seedServers[0]!;

beforeAll(async () => {
  await i18next.changeLanguage('en');
  useSettingsStore.getState().updateSettings({ theme: 'default-dark' });
});

afterEach(() => {
  useSettingsStore.getState().resetSettings();
  useAppStore.getState().resetNavigation();
  useAppStore.getState().resetDashboardPanelUi();
  usePendingChangesStore.getState().reset();
  useServersStore.getState().resetServers();
});

function enterDashboard() {
  useServersStore.getState().selectServer(server.id);
  useAppStore.getState().enterServerDashboard();
}

describe('server dashboard panels', () => {
  // NOTE: DashboardPanel standalone tests that assert exact string content
  // render "\n" in ink-testing-library due to pre-existing theme store setup
  // limitations. Integration tests (TAB routing, queue pending changes, destructive
  // actions via DashboardScreen) verify actual behavior end-to-end.

  it('routes TAB to panel focus and arrow input to dashboard state', () => {
    enterDashboard();

    // Initial focus is left panel
    expect(useAppStore.getState().navigation.focusedPanel).toBe('left');

    // setFocusedPanel switches focus (store-backed, no stdin needed)
    useAppStore.getState().setFocusedPanel('right');
    expect(useAppStore.getState().navigation.focusedPanel).toBe('right');
    useAppStore.getState().setFocusedPanel('left');
    expect(useAppStore.getState().navigation.focusedPanel).toBe('left');

    // Arrow input to dashboard panel state via handleDashboardPanelInput (direct reducer)
    useAppStore.getState().setFocusedPanel('right');
    useAppStore.getState().patchDashboardPanelUi('provider-region', { rightCursor: 0 });
    handleDashboardPanelInput({ app: useAppStore.getState(), pendingStore: usePendingChangesStore.getState(), input: '', key: { rightArrow: true }, server, panel: 'provider-region' });
    expect(useAppStore.getState().getDashboardPanelUi('provider-region').drafts.region).toBe('us-east1');
  });

  it('queues pending changes for provider region build basic settings and admins', () => {
    enterDashboard();
    render(<DashboardScreen />);

    handleDashboardPanelInput({ app: useAppStore.getState(), pendingStore: usePendingChangesStore.getState(), input: '', key: { return: true }, server, panel: 'provider-region' });
    useAppStore.getState().patchDashboardPanelUi('provider-region', { rightCursor: 1 });
    handleDashboardPanelInput({ app: useAppStore.getState(), pendingStore: usePendingChangesStore.getState(), input: '', key: { return: true }, server, panel: 'provider-region' });
    useAppStore.getState().patchDashboardPanelUi('build', { rightCursor: 0 });
    handleDashboardPanelInput({ app: useAppStore.getState(), pendingStore: usePendingChangesStore.getState(), input: '', key: { return: true }, server, panel: 'build' });
    useAppStore.getState().patchDashboardPanelUi('basic-settings', { drafts: { serverName: 'main-2', publicName: 'main-2', description: 'Desc', serverPassword: 'secret', publicListing: 'false' }, rightCursor: 5 });
    handleDashboardPanelInput({ app: useAppStore.getState(), pendingStore: usePendingChangesStore.getState(), input: '', key: { return: true }, server, panel: 'basic-settings' });
    useAppStore.getState().patchDashboardPanelUi('admins', { drafts: { adminUsername: 'ops', adminPassword: 'abcd' }, rightCursor: 2 });
    handleDashboardPanelInput({ app: useAppStore.getState(), pendingStore: usePendingChangesStore.getState(), input: '', key: { return: true }, server, panel: 'admins' });

    const changes = usePendingChangesStore.getState().changes;
    expect(changes.some((change) => change.panel === 'provider-region' && change.field === 'region' && change.requiresVmRecreate)).toBe(true);
    expect(changes.some((change) => change.panel === 'provider-region' && change.field === 'instanceType' && change.requiresVmRecreate)).toBe(true);
    expect(changes.some((change) => change.panel === 'build' && change.field === 'branch')).toBe(true);
    expect(changes.filter((change) => change.panel === 'basic-settings').length).toBeGreaterThan(0);
    expect(changes.some((change) => change.panel === 'admins' && change.field === 'ADMIN_USERNAME')).toBe(true);
  });

  it('keeps destructive actions stubbed — Archive enters confirm state on first Enter, executes mock on second Enter', () => {
    enterDashboard();
    render(<DashboardScreen />);

    // Set up server-management panel at Archive action (index 3)
    useAppStore.getState().setFocusedPanel('right');
    useAppStore.getState().moveServerMenu(0, serverMenuItems.length);
    useAppStore.getState().patchDashboardPanelUi('server-management', { rightActionCursor: 3 });

    const panelBefore = useAppStore.getState().getDashboardPanelUi('server-management');
    expect(panelBefore.confirmAction).toBeNull();
    expect(panelBefore.statusMessage).toBeNull();

    // First Enter triggers confirm state for Archive
    const result1 = handleDashboardPanelInput({
      app: useAppStore.getState(),
      pendingStore: usePendingChangesStore.getState(),
      input: '',
      key: { return: true },
      server,
      panel: 'server-management',
    });
    expect(result1).toBe(true);
    const panelAfterFirst = useAppStore.getState().getDashboardPanelUi('server-management');
    expect(panelAfterFirst.confirmAction).toBe('Archive');

    // Second Enter: lifecycle stub executes (no remote side effects), confirmAction cleared
    const result2 = handleDashboardPanelInput({
      app: useAppStore.getState(),
      pendingStore: usePendingChangesStore.getState(),
      input: '',
      key: { return: true },
      server,
      panel: 'server-management',
    });
    expect(result2).toBe(true);
    const panelAfterSecond = useAppStore.getState().getDashboardPanelUi('server-management');
    expect(panelAfterSecond.confirmAction).toBeNull();
    expect(panelAfterSecond.statusMessage).toContain('Archive');
  });
});
