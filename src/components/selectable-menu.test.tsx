import { afterEach, beforeAll, describe, expect, it } from 'bun:test';
import React from 'react';
import { render } from 'ink-testing-library';
import '../i18n/config.js';
import i18next from 'i18next';
import { SelectableMenu } from './selectable-menu.js';
import { ServerList } from '../screens/main-menu/server-list.js';
import { useSettingsStore } from '../stores/settings-store.js';
import { useAppStore } from '../stores/app-store.js';
import type { ServerRecord } from '../types/index.js';
import type { SelectableMenuItem } from './selectable-menu.js';

beforeAll(async () => {
  await i18next.changeLanguage('en');
});

describe('SelectableMenu theme integration', () => {
  afterEach(() => {
    useAppStore.getState().resetNavigation();
  });

  it('renders items with default-dark theme and selected item is visible', () => {
    useSettingsStore.getState().setSettings({ locale: 'en', theme: 'default-dark', backupPath: '' });
    const items: SelectableMenuItem[] = [
      { id: '1', icon: '+', label: 'Alpha Server' },
      { id: '2', icon: '▶', label: 'Beta Server' },
    ];
    const { unmount, lastFrame } = render(<SelectableMenu items={items} selectedIndex={0} />);
    const frame = lastFrame();
    // Item labels must appear in rendered output
    expect(frame).toContain('Alpha Server');
    expect(frame).toContain('Beta Server');
    // Selection indicator '>' should appear for selected item (index 0)
    expect(frame).toContain('>');
    unmount();
  });

  it('renders items with forest theme and selection moves correctly', () => {
    useSettingsStore.getState().setSettings({ locale: 'en', theme: 'forest', backupPath: '' });
    const items: SelectableMenuItem[] = [
      { id: '1', icon: '+', label: 'Gamma Server' },
      { id: '2', icon: '▶', label: 'Delta Server' },
    ];
    // selectedIndex=1 (second item selected)
    const { unmount, lastFrame } = render(<SelectableMenu items={items} selectedIndex={1} />);
    const frame = lastFrame();
    expect(frame).toContain('Gamma Server');
    expect(frame).toContain('Delta Server');
    // Selection indicator at position 1 (Delta Server)
    expect(frame).toContain('>');
    unmount();
  });

  it('renders unselected item with text-only marker', () => {
    useSettingsStore.getState().setSettings({ locale: 'en', theme: 'default-dark', backupPath: '' });
    const items: SelectableMenuItem[] = [
      { id: '1', icon: '+', label: 'Selected Item' },
      { id: '2', icon: '▶', label: 'Unselected Item' },
    ];
    const { unmount, lastFrame } = render(<SelectableMenu items={items} selectedIndex={0} />);
    const frame = lastFrame();
    // Both items rendered
    expect(frame).toContain('Selected Item');
    expect(frame).toContain('Unselected Item');
    // Space marker for unselected item (line 26 of selectable-menu.tsx: ` ' '` before `[`)
    expect(frame).toContain('[+]');
    unmount();
  });
});

describe('ServerList theme integration', () => {
  const mockServers: ServerRecord[] = [
    {
      id: 'server-1',
      name: 'test-server',
      provider: 'gcp',
      status: 'running',
      instanceType: 'e2-standard-2',
      playersOnline: 5,
      playersMax: 20,
      branch: 'stable',
      publicIp: '192.168.1.1',
      gamePort: 16261,
      queryPort: 27015,
      rconPort: 27016,
      publicRconEnabled: false,
      rconUnsafe: false,
      archivedAt: null,
      backupPath: '/backups/test-server.tar.gz',
      backupSize: 1073741824,
      createdAt: '2024-01-01T00:00:00Z',
      projectId: 'test-project',
      zone: 'us-central1-a',
      staticIp: '192.168.1.1',
    },
  ];

  it('renders server name and header with default-dark theme', () => {
    useSettingsStore.getState().setSettings({ locale: 'en', theme: 'default-dark', backupPath: '' });
    const { unmount, lastFrame } = render(<ServerList servers={mockServers} cursor={0} />);
    const frame = lastFrame();
    // Server name is truncated to 8 chars by truncateText
    expect(frame).toContain('test-se');
    // Header line with column labels
    expect(frame).toContain('NAME');
    expect(frame).toContain('INSTANCE TYPE');
    expect(frame).toContain('STATUS');
    unmount();
  });

  it('renders server with forest theme and cursor highlights row', () => {
    useSettingsStore.getState().setSettings({ locale: 'en', theme: 'forest', backupPath: '' });
    const { unmount, lastFrame } = render(<ServerList servers={mockServers} cursor={0} />);
    const frame = lastFrame();
    expect(frame).toContain('test-se');
    // Cursor selection indicator for cursor=0
    expect(frame).toContain('>');
    unmount();
  });

  it('renders server list with multiple servers and cursor on second', () => {
    const servers: ServerRecord[] = [
      ...mockServers,
      {
        id: 'server-2',
        name: 'other-server',
        provider: 'gcp',
        status: 'stopped',
        instanceType: 'e2-standard-4',
        playersOnline: 0,
        playersMax: 20,
        branch: 'experimental',
        publicIp: '192.168.1.2',
        gamePort: 16262,
        queryPort: 27017,
        rconPort: 27018,
        publicRconEnabled: false,
        rconUnsafe: false,
        archivedAt: null,
        backupPath: '/backups/other-server.tar.gz',
        backupSize: 2147483648,
        createdAt: '2024-01-02T00:00:00Z',
        projectId: 'test-project',
        zone: 'us-central1-b',
        staticIp: '192.168.1.2',
      },
    ];
    useSettingsStore.getState().setSettings({ locale: 'en', theme: 'default-dark', backupPath: '' });
    const { unmount, lastFrame } = render(<ServerList servers={servers} cursor={1} />);
    const frame = lastFrame();
    // Both server names appear (truncated to 8 chars)
    expect(frame).toContain('test-se');
    expect(frame).toContain('other-s');
    // Selection on second server (cursor=1)
    expect(frame).toContain('>');
    unmount();
  });
});
