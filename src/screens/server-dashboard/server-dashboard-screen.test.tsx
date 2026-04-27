import { afterEach, describe, expect, it } from 'bun:test';
import React from 'react';
import { render } from 'ink-testing-library';
import { DashboardScreen } from '../main-menu/main-menu-screen.js';
import { DashboardPanel, getPanelUi } from './dashboard-panels.js';
import { serverMenuItems } from './server-dashboard-screen.js';
import { handleDashboardPanelInput } from './dashboard-panels.js';
import { useAppStore } from '../../stores/app-store.js';
import { usePendingChangesStore } from '../../stores/pending-changes-store.js';
import { seedServers, useServersStore } from '../../stores/servers-store.js';

const server = seedServers[0]!;

afterEach(() => {
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
  it('renders specific content for each menu panel', () => {
    const baseUi = { rightCursor: 0, rightActionCursor: 0, subView: 'main', drafts: {}, validationErrors: {}, statusMessage: null, confirmAction: null };
    const checks: Array<[string, string[], ReturnType<typeof getPanelUi>]> = [
      ['server-management', ['Mock adapter ready', 'Apply All Changes'], baseUi],
      ['provider-region', ['Provider: GCP MVP', 'Estimated cost:', 'Recommendation: Balanced · n2d-standard-4'], baseUi],
      ['build', ['Current branch:', 'Image tag:'], baseUi],
      ['players', ['Connected players · Mock', 'Ana · admin'], baseUi],
      ['stats', ['Container metrics · Mock', 'Logs snapshot:'], baseUi],
      ['basic-settings', ['Basic Settings · Drafts local until Queue Changes', 'Queue Changes'], baseUi],
      ['advanced-settings', ['Config files · Mock SFTP boundary', 'Mock edit preview for'], { ...baseUi, subView: 'edit' }],
      ['admins', ['Admins · Drafts local until Queue Changes', 'adminUsername:'], baseUi],
      ['scheduler', ['Scheduled tasks · Mock local stub', '[Delete]'], { ...baseUi, rightActionCursor: 3 }],
      ['backups', ['Backup history · Mock local path', '[Delete]'], { ...baseUi, rightActionCursor: 2 }],
      ['back-to-servers', ['Press Enter to return to Active Servers.'], baseUi],
    ];

    for (const [panelId, expected, panelUi] of checks) {
      const selectedMenu = serverMenuItems.find((item) => item.id === panelId)!;
      const frame = render(<DashboardPanel selectedMenu={selectedMenu} server={server} pendingChangesCount={1} ui={panelUi} />).lastFrame() ?? '';
      for (const text of expected) expect(frame).toContain(text);
    }
  });

  it('routes TAB to panel focus and arrow input to dashboard state', () => {
    enterDashboard();
    const app = render(<DashboardScreen />);

    expect(useAppStore.getState().navigation.focusedPanel).toBe('left');
    app.stdin.write('\t');
    expect(useAppStore.getState().navigation.focusedPanel).toBe('right');
    app.stdin.write('\t');
    expect(useAppStore.getState().navigation.focusedPanel).toBe('left');

    useAppStore.getState().setFocusedPanel('right');
    useAppStore.getState().patchDashboardPanelUi('provider-region', { rightCursor: 0 });
    handleDashboardPanelInput({ app: useAppStore.getState(), pendingStore: usePendingChangesStore.getState(), input: '', key: { rightArrow: true }, server, panel: 'provider-region' });
    expect(useAppStore.getState().getDashboardPanelUi('provider-region').drafts.region).toBe('us-east1');
  });

  it('queues pending changes for provider region build basic settings and admins', () => {
    enterDashboard();
    const app = render(<DashboardScreen />);

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

  it('keeps destructive actions stubbed with no remote side effects text', () => {
    enterDashboard();
    const app = render(<DashboardScreen />);

    useAppStore.getState().setFocusedPanel('right');
    useAppStore.getState().moveServerMenu(0, serverMenuItems.length);
    useAppStore.getState().patchDashboardPanelUi('server-management', { rightActionCursor: 3 });
    app.stdin.write('\r');
    app.rerender(<DashboardScreen />);
    app.stdin.write('\r');
    app.rerender(<DashboardScreen />);

    const frame = app.lastFrame() ?? '';
    expect(frame).toContain('Stub');
    expect(frame).toContain('no remote side');
  });
});
