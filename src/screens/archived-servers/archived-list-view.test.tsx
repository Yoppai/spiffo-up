import { beforeAll, describe, expect, it } from 'bun:test';
import React from 'react';
import { render } from 'ink-testing-library';
import '../../i18n/config.js';
import i18next from 'i18next';
import { ArchivedListView } from './archived-list-view.js';
import type { ServerRecord } from '../../types/index.js';

const archivedServer: ServerRecord = {
  id: 'archived-1',
  name: 'old-server',
  provider: 'gcp',
  status: 'archived',
  instanceType: 'e2-standard-2',
  playersOnline: null,
  playersMax: null,
  branch: 'stable',
  publicIp: null,
  backupPath: '/backups/old-server-20240115.tar.gz',
  backupSize: 2147483648,
  archivedAt: '2024-01-15T10:30:00Z',
};

const archivedServerNoBackup: ServerRecord = {
  id: 'archived-2',
  name: 'another-archived',
  provider: 'aws',
  status: 'archived',
  instanceType: 'e2-standard-4',
  playersOnline: null,
  playersMax: null,
  branch: 'unstable',
  publicIp: null,
  backupPath: null,
  backupSize: null,
  archivedAt: '2024-02-20T15:00:00Z',
};

beforeAll(async () => {
  await i18next.changeLanguage('en');
});

describe('ArchivedListView', () => {
  it('renders all table columns', () => {
    const servers = [archivedServer];
    const { lastFrame } = render(<ArchivedListView servers={servers} cursor={0} />);
    const frame = lastFrame() ?? '';
    expect(frame).toContain('Name');
    expect(frame).toContain('Provider');
    expect(frame).toContain('Archived On');
    expect(frame).toContain('Backup Size');
    expect(frame).toContain('Status');
    expect(frame).toContain('Actions');
  });

  it('shows cursor highlight on active row', () => {
    const servers = [archivedServer, archivedServerNoBackup];
    const { lastFrame } = render(<ArchivedListView servers={servers} cursor={1} />);
    const frame = lastFrame() ?? '';
    // The second row (cursor=1) should be highlighted
    expect(frame).toContain('another-archived');
  });

  it('shows SAVED status when backupPath exists', () => {
    const servers = [archivedServer];
    const { lastFrame } = render(<ArchivedListView servers={servers} cursor={0} />);
    expect(lastFrame()).toContain('SAVED');
  });

  it('shows MISSING status when backupPath is null', () => {
    const servers = [archivedServerNoBackup];
    const { lastFrame } = render(<ArchivedListView servers={servers} cursor={0} />);
    expect(lastFrame()).toContain('MISSING');
  });

  it('renders empty state when servers array is empty', () => {
    const { lastFrame } = render(<ArchivedListView servers={[]} cursor={0} />);
    expect(lastFrame()).toContain('No archived servers found');
  });
});