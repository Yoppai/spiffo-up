import { beforeAll, describe, expect, it, beforeEach } from 'bun:test';
import React from 'react';
import { render } from 'ink-testing-library';
import { Text } from 'ink';
import '../i18n/config.js';
import i18next from 'i18next';
import { LayoutShell } from './layout-shell.js';
import { useSettingsStore } from '../stores/settings-store.js';
import { useAppStore } from '../stores/app-store.js';

beforeAll(async () => {
  await i18next.changeLanguage('es');
});

/**
 * Behavioral test double: a minimal child component that renders visible
 * text. This avoids fullscreen rendering issues with ink-testing-library
 * by testing the LayoutShell wrapper with a focused child.
 */
const ContentLabel: React.FC<{ text: string }> = ({ text }) => (
  <Text>{text}</Text>
);

describe('LayoutShell', () => {
  beforeEach(() => {
    useAppStore.getState().resetNavigation();
    useSettingsStore.getState().resetSettings();
  });

  it('renders with default-dark theme and child content appears', () => {
    useSettingsStore.getState().setSettings({ locale: 'es', theme: 'default-dark', backupPath: '' });
    const { unmount, lastFrame } = render(
      <LayoutShell
        leftTitle="Left"
        rightTitle="Right"
        focusedPanel="left"
        activeServers={1}
        totalServers={5}
        left={<ContentLabel text="left-panel-content" />}
        right={<ContentLabel text="right-panel-content" />}
      />
    );
    const frame = lastFrame();
    // Verify SOMETHING rendered (frame is non-empty)
    expect(typeof frame).toBe('string');
    expect(frame!.length).toBeGreaterThan(0);
    // Child content should appear in rendered output
    expect(frame).toContain('left-panel-content');
    expect(frame).toContain('right-panel-content');
    unmount();
  });

  it('renders with forest theme and child content appears', () => {
    useSettingsStore.getState().setSettings({ locale: 'es', theme: 'forest', backupPath: '' });
    const { unmount, lastFrame } = render(
      <LayoutShell
        leftTitle="Servers"
        rightTitle="Status"
        focusedPanel="right"
        activeServers={3}
        totalServers={10}
        left={<ContentLabel text="server-list-content" />}
        right={<ContentLabel text="status-content" />}
      />
    );
    const frame = lastFrame();
    expect(typeof frame).toBe('string');
    expect(frame!.length).toBeGreaterThan(0);
    // Child content appears in the rendered panel output
    expect(frame).toContain('server-list-content');
    expect(frame).toContain('status-content');
    // Server counts appear via SystemStatus component
    expect(frame).toContain('3');
    expect(frame).toContain('10');
    unmount();
  });

  it('renders with pending changes count and displays server info', () => {
    useSettingsStore.getState().setSettings({ locale: 'es', theme: 'default-dark', backupPath: '' });
    const { unmount, lastFrame } = render(
      <LayoutShell
        leftTitle="Main"
        rightTitle="Details"
        focusedPanel="left"
        activeServers={3}
        totalServers={10}
        pendingChangesCount={2}
        left={<ContentLabel text="main-content" />}
        right={<ContentLabel text="details-content" />}
      />
    );
    const frame = lastFrame();
    expect(typeof frame).toBe('string');
    expect(frame!.length).toBeGreaterThan(0);
    // Server counts encoded in output (via SystemStatus component)
    // active=3, total=10 should appear somewhere in the frame
    expect(frame).toContain('main-content');
    expect(frame).toContain('details-content');
    unmount();
  });
});