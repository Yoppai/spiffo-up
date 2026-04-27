import { afterEach, describe, expect, it } from 'bun:test';
import React from 'react';
import { render } from 'ink-testing-library';
import { CreateServerWizard, handleCreateServerWizardInput } from './create-server-wizard-screen.js';
import { DashboardScreen } from '../main-menu/main-menu-screen.js';
import { globalMenuItems } from '../main-menu/main-menu-view.js';
import { useAppStore } from '../../stores/app-store.js';
import { useServersStore } from '../../stores/servers-store.js';
import { bootstrapLocalInventory } from '../../services/index.js';
import { createDatabaseConnection } from '../../infrastructure/database.js';

afterEach(() => {
  useAppStore.getState().resetNavigation();
  useServersStore.getState().resetServers();
});

describe('create server wizard screen', () => {
  it('renders provider, region, instance, and review content', () => {
    const app = useAppStore.getState();

    let frame = render(<CreateServerWizard />).lastFrame() ?? '';
    expect(frame).toContain('GCP · MVP enabled');
    expect(frame).toContain('AWS · Coming Soon');

    app.nextWizardStep();
    app.setWizardProjectId('proj-1');
    frame = render(<CreateServerWizard />).lastFrame() ?? '';
    expect(frame).toContain('Local detection placeholder: proj-1');

    app.nextWizardStep();
    app.setWizardServerName('alpha');
    app.nextWizardStep();
    frame = render(<CreateServerWizard />).lastFrame() ?? '';
    expect(frame).toContain('GCP zones by continent');
    expect(frame).toContain('americas');
    expect(frame).toContain('ms fallback');
    expect(frame).toContain('Zone: us-central1-a');

    app.nextWizardStep();
    frame = render(<CreateServerWizard />).lastFrame() ?? '';
    expect(frame).toContain('Curated Project Zomboid tiers · estimated local pricing');
    expect(frame).toContain('Balanced: n2d-standard-4');
    expect(frame).toContain('· Recommended');

    app.nextWizardStep();
    frame = render(<CreateServerWizard />).lastFrame() ?? '';
    expect(frame).toContain('Review local server draft');
    expect(frame).toContain('Creates local draft only; no Pulumi, SSH, SFTP or RCON will');
    expect(frame).toContain('run.');
  });

  it('shows server name error after invalid confirm', () => {
    const app = useAppStore.getState();

    app.nextWizardStep();
    app.nextWizardStep();
    app.setWizardServerName('!!!');

    expect(app.nextWizardStep()).toBe(false);
    const frame = render(<CreateServerWizard />).lastFrame() ?? '';
    expect(frame).toContain('Server name must include letters or numbers.');
  });

  it('handles wizard input and lets enter open wizard from main menu', () => {
    const app = useAppStore.getState();

    app.openCreateServerWizard();
    app.nextWizardStep();
    app.nextWizardStep();
    handleCreateServerWizardInput({ app, input: 'A', key: {} });
    expect(useAppStore.getState().createServerWizard.draft.serverName).toBe('A');

    app.cancelCreateServerWizard();
    useAppStore.getState().moveGlobalMenu(-1, globalMenuItems.length);
    const main = render(<DashboardScreen />);
    main.stdin.write('\r');
    expect(useAppStore.getState().navigation.current).toBe('wizard');
  });

  it('routes q into wizard text input instead of global quit', () => {
    const main = render(<DashboardScreen />);
    useAppStore.getState().openCreateServerWizard();
    useAppStore.getState().nextWizardStep();
    useAppStore.getState().nextWizardStep();
    main.rerender(<DashboardScreen />);

    main.stdin.write('q');

    expect(useAppStore.getState().navigation.current).toBe('wizard');
    expect(useAppStore.getState().createServerWizard.draft.serverName).toBe('q');
  });

  it('creates a local draft and opens its server dashboard from review', () => {
    bootstrapLocalInventory(createDatabaseConnection(':memory:'));
    const app = useAppStore.getState();
    app.openCreateServerWizard();
    app.nextWizardStep();
    app.nextWizardStep();
    app.setWizardServerName('Review Draft');
    app.nextWizardStep();
    app.nextWizardStep();
    app.nextWizardStep();

    handleCreateServerWizardInput({ app, input: '', key: { return: true } });

    expect(useServersStore.getState().selectedServerId).toBe('review-draft');
    expect(useServersStore.getState().servers.find((server) => server.id === 'review-draft')?.status).toBe('draft');
    expect(useAppStore.getState().navigation.mode).toBe('server');
  });
});
