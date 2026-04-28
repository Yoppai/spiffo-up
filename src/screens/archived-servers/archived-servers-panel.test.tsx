import { beforeAll, describe, expect, it } from 'bun:test';
import React from 'react';
import { render } from 'ink-testing-library';
import '../../i18n/config.js';
import i18next from 'i18next';
import { ArchivedServersPanel } from './archived-servers-panel.js';
import { useAppStore } from '../../stores/app-store.js';
import { useServersStore } from '../../stores/servers-store.js';

beforeAll(async () => {
  await i18next.changeLanguage('en');
});

describe('ArchivedServersPanel', () => {
  it('renders list view when globalRightMode is archived-list', () => {
    useAppStore.getState().resetNavigation();
    useAppStore.getState().setGlobalRightMode('archived-list');
    const { lastFrame } = render(<ArchivedServersPanel />);
    expect(lastFrame() ?? '').toContain('Name');
    expect(lastFrame() ?? '').toContain('Provider');
  });

  it('renders list view when globalRightMode is list (backwards compatible)', () => {
    useAppStore.getState().resetNavigation();
    useAppStore.getState().setGlobalRightMode('list');
    const { lastFrame } = render(<ArchivedServersPanel />);
    // Should still show archived servers
    const frame = lastFrame() ?? '';
    expect(frame).toContain('old-server');
  });

  it('renders detail view when globalRightMode is archived-detail', () => {
    useAppStore.getState().resetNavigation();
    useAppStore.getState().setGlobalRightMode('archived-detail');
    // Need a server selected - the seed has 'archived-1'
    const servers = useServersStore.getState().servers;
    const archivedServer = servers.find((s) => s.status === 'archived');
    if (!archivedServer) throw new Error('No archived server found');
    useAppStore.getState().moveGlobalRightCursor(servers.indexOf(archivedServer), servers.length);
    const { lastFrame } = render(<ArchivedServersPanel />);
    expect(lastFrame() ?? '').toContain('Restore Server');
  });

  it('filters servers with status archived', () => {
    useAppStore.getState().resetNavigation();
    useAppStore.getState().setGlobalRightMode('archived-list');
    const { lastFrame } = render(<ArchivedServersPanel />);
    expect(lastFrame() ?? '').toContain('old-server');
    expect(lastFrame() ?? '').not.toContain('main'); // running server should not appear
  });

  it('passes cursor to list view', () => {
    useAppStore.getState().resetNavigation();
    useAppStore.getState().setGlobalRightMode('archived-list');
    useAppStore.getState().moveGlobalRightCursor(1, 10);
    const { lastFrame } = render(<ArchivedServersPanel />);
    expect(lastFrame() ?? '').toContain('> ');
  });
});