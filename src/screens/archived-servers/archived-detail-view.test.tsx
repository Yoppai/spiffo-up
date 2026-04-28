import { beforeAll, describe, expect, it } from 'bun:test';
import React from 'react';
import { render } from 'ink-testing-library';
import '../../i18n/config.js';
import i18next from 'i18next';
import { ArchivedDetailView } from './archived-detail-view.js';
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
  region: 'us-central1',
  zone: 'us-central1-a',
  projectId: 'old-project-123',
  staticIp: '34.120.45.100',
  gamePort: null,
  queryPort: null,
  rconPort: null,
  publicRconEnabled: false,
  allowedRconCidrs: ['10.0.0.0/8'],
  backupPath: '/backups/old-server-20240115.tar.gz',
  backupSize: 2147483648,
  archivedAt: '2024-01-15T10:30:00Z',
  createdAt: '2023-06-01T08:00:00Z',
  updatedAt: '2024-01-15T10:30:00Z',
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

describe('ArchivedDetailView', () => {
  it('renders all metadata fields', () => {
    const onRestore = () => {};
    const onDelete = () => {};
    const { lastFrame } = render(
      <ArchivedDetailView server={archivedServer} cursor={0} confirmAction={null} onRestore={onRestore} onDelete={onDelete} />
    );
    const frame = lastFrame() ?? '';
    expect(frame).toContain('Provider');
    expect(frame).toContain('Project ID');
    expect(frame).toContain('Instance Type');
    expect(frame).toContain('Zone');
    expect(frame).toContain('Static IP');
    expect(frame).toContain('Game Branch');
    expect(frame).toContain('Created');
    expect(frame).toContain('Archived');
  });

  it('shows backup info section', () => {
    const onRestore = () => {};
    const onDelete = () => {};
    const { lastFrame } = render(
      <ArchivedDetailView server={archivedServer} cursor={0} confirmAction={null} onRestore={onRestore} onDelete={onDelete} />
    );
    expect(lastFrame()).toContain('Backup');
    expect(lastFrame()).toContain('/backups/old-server-20240115.tar.gz');
    expect(lastFrame()).toContain('SAVED');
  });

  it('shows no backup info when backupPath is null', () => {
    const onRestore = () => {};
    const onDelete = () => {};
    const { lastFrame } = render(
      <ArchivedDetailView server={archivedServerNoBackup} cursor={0} confirmAction={null} onRestore={onRestore} onDelete={onDelete} />
    );
    expect(lastFrame()).toContain('No backup information available');
    expect(lastFrame()).not.toContain('MISSING');
  });

  it('renders Restore and Delete actions', () => {
    const onRestore = () => {};
    const onDelete = () => {};
    const { lastFrame } = render(
      <ArchivedDetailView server={archivedServer} cursor={0} confirmAction={null} onRestore={onRestore} onDelete={onDelete} />
    );
    expect(lastFrame()).toContain('Restore Server');
    expect(lastFrame()).toContain('Delete Record');
  });

  it('shows cursor highlight on active action', () => {
    const onRestore = () => {};
    const onDelete = () => {};
    const { lastFrame } = render(
      <ArchivedDetailView server={archivedServer} cursor={1} confirmAction={null} onRestore={onRestore} onDelete={onDelete} />
    );
    expect(lastFrame()).toContain('Delete Record');
  });

  it('shows inline confirmation banner when confirmAction is delete', () => {
    const onRestore = () => {};
    const onDelete = () => {};
    const { lastFrame } = render(
      <ArchivedDetailView server={archivedServer} cursor={1} confirmAction="delete" onRestore={onRestore} onDelete={onDelete} />
    );
    expect(lastFrame()).toContain('Delete Server Record');
    expect(lastFrame()).toContain('Cancel');
    expect(lastFrame()).toContain('Delete');
  });

  it('does not show confirmation banner when confirmAction is null', () => {
    const onRestore = () => {};
    const onDelete = () => {};
    const { lastFrame } = render(
      <ArchivedDetailView server={archivedServer} cursor={1} confirmAction={null} onRestore={onRestore} onDelete={onDelete} />
    );
    expect(lastFrame()).not.toContain('Delete Server Record');
    expect(lastFrame()).not.toContain('Cancel');
  });
});