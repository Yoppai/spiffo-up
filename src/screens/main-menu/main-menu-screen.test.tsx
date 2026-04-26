import { afterEach, describe, expect, it } from 'bun:test';
import React from 'react';
import { render } from 'ink-testing-library';
import { App } from '../../cli/app.js';
import { useAppStore } from '../../stores/app-store.js';
import { useServersStore, seedServers } from '../../stores/servers-store.js';

describe('dashboard render', () => {
  afterEach(() => {
    useAppStore.getState().resetNavigation();
    useServersStore.getState().resetServers();
  });

  it('renders dashboard chrome and footer shortcuts', () => {
    const { lastFrame } = render(<App />);
    const frame = lastFrame() ?? '';

    expect(frame).toContain('Active Servers:');
    expect(frame).toContain('TAB');
    expect(frame).toContain('[Q] Salir');
    expect(frame).not.toContain('● Focus');
  });

  it('renders active servers preview with seeded servers', () => {
    useAppStore.getState().setNavigationTarget('dashboard');

    const { lastFrame } = render(<App />);
    const frame = lastFrame() ?? '';

    expect(frame).toContain('main');
    expect(frame).toContain('PvP');
    expect(frame).not.toContain('dev');
    expect(frame).toContain('12/20');
  });

  it('renders server dashboard basic view', () => {
    useServersStore.getState().selectServer(seedServers[0]?.id ?? null);
    useAppStore.getState().enterServerDashboard();

    const { lastFrame } = render(<App />);
    const frame = lastFrame() ?? '';

    expect(frame).toContain('Server Management');
    expect(frame).toContain('Status:');
    expect(frame).toContain('Deploy');
  });
});
