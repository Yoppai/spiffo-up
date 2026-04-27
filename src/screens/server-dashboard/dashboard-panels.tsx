import React from 'react';
import { Box, Text } from 'ink';
import type { DashboardPanelUiState, ServerMenuId, ServerMenuItem, ServerRecord } from '../../types/index.js';
import { buildImageTag, createPendingChange, dashboardMockAdapter, estimateMonthlyCost, formatInstanceTier, formatServerPlayers, formatServerStatus, validateSimpleCron } from '../../lib/index.js';
import type { useAppStore } from '../../stores/app-store.js';
import type { usePendingChangesStore } from '../../stores/pending-changes-store.js';

const defaultUi: DashboardPanelUiState = { rightCursor: 0, rightActionCursor: 0, subView: 'main', drafts: {}, validationErrors: {}, statusMessage: null, confirmAction: null };
const regions = ['us-central1', 'us-east1', 'southamerica-east1'];
const instances = ['e2-standard-2', 'n2-standard-4'];
const branches: ServerRecord['branch'][] = ['stable', 'unstable', 'outdatedunstable'];
const basicFields = ['serverName', 'publicName', 'description', 'serverPassword', 'publicListing'] as const;
const adminFields = ['adminUsername', 'adminPassword'] as const;

export function getPanelUi(panels: Partial<Record<ServerMenuId, DashboardPanelUiState>>, id: ServerMenuId): DashboardPanelUiState {
  return panels[id] ?? defaultUi;
}

export const DashboardPanel: React.FC<{ selectedMenu: ServerMenuItem; server: ServerRecord; pendingChangesCount: number; ui: DashboardPanelUiState }> = ({ selectedMenu, server, pendingChangesCount, ui }) => {
  const banner = pendingChangesCount > 0 ? <PendingChangesBanner count={pendingChangesCount} /> : null;
  if (selectedMenu.id === 'back-to-servers') return <Text color="cyan">Press Enter to return to Active Servers.</Text>;

  return (
    <Box flexDirection="column">
      {banner}
      {renderPanel(selectedMenu.id, server, ui, pendingChangesCount)}
      {ui.statusMessage ? <Text color="green">Status: {ui.statusMessage}</Text> : null}
      {Object.values(ui.validationErrors).filter(Boolean).map((error) => <Text key={error} color="red">Error: {error}</Text>)}
    </Box>
  );
};

export function handleDashboardPanelInput({ app, pendingStore, input, key, server, panel }: { app: ReturnType<typeof useAppStore.getState>; pendingStore: ReturnType<typeof usePendingChangesStore.getState>; input: string; key: DashboardKey; server: ServerRecord; panel: ServerMenuId }): boolean {
  if (panel === 'back-to-servers') return false;
  const ui = app.getDashboardPanelUi(panel);

  if (panel === 'basic-settings') return handleFormInput({ app, pendingStore, input, key, server, panel, fields: [...basicFields] });
  if (panel === 'admins') return handleFormInput({ app, pendingStore, input, key, server, panel, fields: [...adminFields] });

  if (key.upArrow) return moveCursor(app, panel, -1, verticalCount(panel));
  if (key.downArrow) return moveCursor(app, panel, 1, verticalCount(panel));
  if (key.leftArrow) return moveAction(app, panel, -1, actionCount(panel));
  if (key.rightArrow) return moveAction(app, panel, 1, actionCount(panel));
  if (key.return) return activatePanel({ app, pendingStore, server, panel, ui });
  if (panel === 'scheduler' && ui.subView === 'edit') return handleSchedulerEditInput({ app, panel, input, key, ui });
  return false;
}

type DashboardKey = { upArrow?: boolean; downArrow?: boolean; leftArrow?: boolean; rightArrow?: boolean; return?: boolean; backspace?: boolean; delete?: boolean };

function renderPanel(panel: ServerMenuId, server: ServerRecord, ui: DashboardPanelUiState, pendingChangesCount: number): React.ReactNode {
  switch (panel) {
    case 'server-management':
      return <ServerManagementPanel server={server} ui={ui} pendingChangesCount={pendingChangesCount} />;
    case 'provider-region':
      return <ProviderRegionPanel server={server} ui={ui} />;
    case 'build':
      return <BuildPanel server={server} ui={ui} />;
    case 'players':
      return <PlayersPanel server={server} ui={ui} />;
    case 'stats':
      return <StatsPanel server={server} ui={ui} />;
    case 'basic-settings':
      return <BasicSettingsPanel server={server} ui={ui} />;
    case 'advanced-settings':
      return <AdvancedSettingsPanel server={server} ui={ui} />;
    case 'admins':
      return <AdminsPanel ui={ui} />;
    case 'scheduler':
      return <SchedulerPanel server={server} ui={ui} />;
    case 'backups':
      return <BackupsPanel server={server} ui={ui} />;
    default:
      return null;
  }
}

function ServerManagementPanel({ server, ui, pendingChangesCount }: { server: ServerRecord; ui: DashboardPanelUiState; pendingChangesCount: number }) {
  const actions = ['Deploy', server.status === 'running' ? 'Stop' : 'Start', 'Update', 'Archive'];
  return <>
    <Text>Status:   {formatServerStatus(server)} · Mock adapter ready</Text>
    <Text>IP:       {server.publicIp ?? '-'}</Text>
    <Text>Branch:   {server.branch}</Text>
    <Text>Players:  {formatServerPlayers(server)}</Text>
    {pendingChangesCount > 0 ? <Text color="cyan">Apply All Changes ({pendingChangesCount})</Text> : null}
    <ActionRow actions={actions} selected={ui.rightActionCursor} />
    {ui.confirmAction === 'Archive' ? <Text color="red">Confirm Archive? Press Enter again (Stub, no remote side effects).</Text> : null}
  </>;
}

function ProviderRegionPanel({ server, ui }: { server: ServerRecord; ui: DashboardPanelUiState }) {
  const region = ui.drafts.region ?? server.region ?? regions[0]!;
  const instanceType = ui.drafts.instanceType ?? server.instanceType;
  return <>
    <Text>Provider: GCP MVP · AWS Coming Soon · Azure Coming Soon</Text>
    <CursorLine active={ui.rightCursor === 0}>Region: {region} (←→ choose, Enter queue)</CursorLine>
    <CursorLine active={ui.rightCursor === 1}>Instance: {formatInstanceTier(instanceType)} (←→ choose, Enter queue)</CursorLine>
    <Text>Estimated cost: {estimateMonthlyCost(instanceType, region)}</Text>
    <Text color="gray">Recommendation: Mock Balanced tier for 20 players.</Text>
  </>;
}

function BuildPanel({ server, ui }: { server: ServerRecord; ui: DashboardPanelUiState }) {
  const branch = (ui.drafts.branch as ServerRecord['branch'] | undefined) ?? server.branch;
  return <>
    <Text>Current branch: {server.branch}</Text>
    <CursorLine active>Selected branch: {branch} (←→ stable/unstable/outdatedunstable)</CursorLine>
    <Text>Image tag: {buildImageTag(branch)}</Text>
    <Text color="cyan">Press Enter to Queue Changes</Text>
  </>;
}

function PlayersPanel({ server, ui }: { server: ServerRecord; ui: DashboardPanelUiState }) {
  const players = dashboardMockAdapter.listPlayers(server);
  const actions = ['Message', 'Kick', 'Ban'];
  return <>
    <Text>Connected players · Mock</Text>
    {players.map((player, index) => <CursorLine key={player.id} active={ui.rightCursor === index}>{player.username} · {player.status} · {player.pingMs}ms</CursorLine>)}
    <ActionRow actions={actions} selected={ui.rightActionCursor} />
    {ui.confirmAction ? <Text color="red">Confirm {ui.confirmAction}? Press Enter again (Stub).</Text> : null}
  </>;
}

function StatsPanel({ server, ui }: { server: ServerRecord; ui: DashboardPanelUiState }) {
  const snapshot = dashboardMockAdapter.getStatsSnapshot(server, Number(ui.drafts.refreshCount ?? 0));
  return <>
    <Text>Container metrics · Mock</Text>
    <Text>CPU: {snapshot.cpu}</Text><Text>Memory: {snapshot.memory}</Text><Text>Network: {snapshot.network}</Text><Text>Disk I/O: {snapshot.diskIo}</Text>
    <Text>Logs snapshot:</Text>{snapshot.logs.map((line) => <Text key={line}>  {line}</Text>)}
    <ActionRow actions={['Refresh Stats', 'Logs View']} selected={ui.rightActionCursor} />
    {ui.subView === 'details' ? <Text color="cyan">Logs sub-view Stub: static mock snapshot only.</Text> : null}
  </>;
}

function BasicSettingsPanel({ server, ui }: { server: ServerRecord; ui: DashboardPanelUiState }) {
  const values = basicDefaults(server, ui);
  return <FormPanel title="Basic Settings" fields={[['serverName', values.serverName], ['publicName', values.publicName], ['description', values.description], ['serverPassword', mask(values.serverPassword)], ['publicListing', values.publicListing]]} ui={ui} />;
}

function AdvancedSettingsPanel({ server, ui }: { server: ServerRecord; ui: DashboardPanelUiState }) {
  const files = dashboardMockAdapter.listAdvancedFiles(server);
  const selected = files[ui.rightCursor] ?? files[0]!;
  return <>
    <Text>Config files · Mock SFTP boundary</Text>
    {files.map((file, index) => <CursorLine key={file.id} active={ui.rightCursor === index}>{file.filename} · {file.description}</CursorLine>)}
    <ActionRow actions={['Edit', 'Replace', 'Download']} selected={ui.rightActionCursor} />
    {ui.subView === 'edit' ? <><Text color="cyan">Mock edit preview for {selected.filename}</Text>{selected.mockPreview.map((line) => <Text key={line}>  {line}</Text>)}<Text>Queue File Change Stub</Text></> : null}
  </>;
}

function AdminsPanel({ ui }: { ui: DashboardPanelUiState }) {
  const username = ui.drafts.adminUsername ?? 'admin';
  const password = ui.drafts.adminPassword ?? '';
  return <FormPanel title="Admins" fields={[['adminUsername', username], ['adminPassword', mask(password)]]} ui={ui} />;
}

function SchedulerPanel({ server, ui }: { server: ServerRecord; ui: DashboardPanelUiState }) {
  const tasks = dashboardMockAdapter.listScheduledTasks(server);
  const selected = tasks[ui.rightCursor] ?? tasks[0]!;
  return <>
    <Text>Scheduled tasks · Mock local stub</Text>
    {tasks.map((task, index) => <CursorLine key={task.id} active={ui.rightCursor === index}>{task.name} · {task.type} · {task.cron} · {task.enabled ? 'enabled' : 'disabled'}</CursorLine>)}
    <ActionRow actions={['Create', 'Edit', 'Toggle', 'Delete']} selected={ui.rightActionCursor} />
    {ui.subView === 'edit' ? <Text color="cyan">Edit cron: {ui.drafts.cron ?? selected.cron} (type, Enter save stub)</Text> : null}
    {ui.confirmAction === 'Delete' ? <Text color="red">Confirm Delete scheduled task? Press Enter again.</Text> : null}
  </>;
}

function BackupsPanel({ server, ui }: { server: ServerRecord; ui: DashboardPanelUiState }) {
  const backups = dashboardMockAdapter.listBackups(server);
  return <>
    <Text>Backup history · Mock local path /var/backups/{server.name}</Text>
    {backups.map((backup, index) => <CursorLine key={backup.id} active={ui.rightCursor === index}>{backup.createdAt} · {backup.size} · {backup.type} · {backup.status}</CursorLine>)}
    <ActionRow actions={['Create Backup', 'Restore', 'Delete']} selected={ui.rightActionCursor} />
    {ui.confirmAction ? <Text color="red">Confirm {ui.confirmAction}? Press Enter again (Stub).</Text> : null}
  </>;
}

function FormPanel({ title, fields, ui }: { title: string; fields: [string, string][]; ui: DashboardPanelUiState }) {
  return <>
    <Text>{title} · Drafts local until Queue Changes</Text>
    {fields.map(([field, value], index) => <CursorLine key={field} active={ui.rightCursor === index}>{field}: {value || '-'}</CursorLine>)}
    <CursorLine active={ui.rightCursor === fields.length}>Queue Changes</CursorLine>
  </>;
}

function ActionRow({ actions, selected }: { actions: string[]; selected: number }) {
  return <Text color="cyan">{actions.map((action, index) => `${index === selected ? '>' : ' '}[${action}]`).join('  ')}</Text>;
}

const CursorLine: React.FC<{ active: boolean; children: React.ReactNode }> = ({ active, children }) => <Text color={active ? 'cyan' : undefined}>{active ? '> ' : '  '}{children}</Text>;

export const PendingChangesBanner: React.FC<{ count: number }> = ({ count }) => (
  <Box borderStyle="round" borderColor="yellow" paddingX={1} marginBottom={1}>
    <Text color="yellow">{count} pending changes · Press Ctrl+A to apply</Text>
  </Box>
);

function activatePanel({ app, pendingStore, server, panel, ui }: { app: ReturnType<typeof useAppStore.getState>; pendingStore: ReturnType<typeof usePendingChangesStore.getState>; server: ServerRecord; panel: ServerMenuId; ui: DashboardPanelUiState }): boolean {
  if (panel === 'provider-region') return queueProviderRegion(app, pendingStore, server, ui);
  if (panel === 'build') return queueBuild(app, pendingStore, server, ui);
  if (panel === 'server-management') return confirmableAction(app, server, panel, ['Deploy', server.status === 'running' ? 'Stop' : 'Start', 'Update', 'Archive'][ui.rightActionCursor] ?? 'Deploy', 'Archive');
  if (panel === 'players') return confirmableAction(app, server, panel, ['Message', 'Kick', 'Ban'][ui.rightActionCursor] ?? 'Message', ['Kick', 'Ban']);
  if (panel === 'stats') return activateStats(app, panel, ui);
  if (panel === 'advanced-settings') return activateAdvanced(app, panel, ui);
  if (panel === 'scheduler') return activateScheduler(app, server, panel, ui);
  if (panel === 'backups') return confirmableAction(app, server, panel, ['Create Backup', 'Restore', 'Delete'][ui.rightActionCursor] ?? 'Create Backup', ['Restore', 'Delete']);
  return false;
}

function handleFormInput({ app, pendingStore, input, key, server, panel, fields }: { app: ReturnType<typeof useAppStore.getState>; pendingStore: ReturnType<typeof usePendingChangesStore.getState>; input: string; key: DashboardKey; server: ServerRecord; panel: 'basic-settings' | 'admins'; fields: string[] }): boolean {
  const ui = app.getDashboardPanelUi(panel);
  if (key.upArrow) return moveCursor(app, panel, -1, fields.length + 1);
  if (key.downArrow) return moveCursor(app, panel, 1, fields.length + 1);
  if (key.return && ui.rightCursor === fields.length) return panel === 'basic-settings' ? queueBasic(app, pendingStore, server, ui) : queueAdmins(app, pendingStore, server, ui);
  const field = fields[ui.rightCursor];
  if (!field) return false;
  const value = draftValue(server, panel, field, ui);
  if (key.backspace || key.delete) {
    app.setDashboardDraft(panel, field, value.slice(0, -1));
    return true;
  }
  if (input.length === 1 && input >= ' ') {
    app.setDashboardDraft(panel, field, `${value}${input}`);
    return true;
  }
  return false;
}

function queueProviderRegion(app: ReturnType<typeof useAppStore.getState>, pendingStore: ReturnType<typeof usePendingChangesStore.getState>, server: ServerRecord, ui: DashboardPanelUiState): boolean {
  const field = ui.rightCursor === 0 ? 'region' : 'instanceType';
  const oldValue = field === 'region' ? server.region ?? regions[0]! : server.instanceType;
  const options = field === 'region' ? regions : instances;
  const current = ui.drafts[field] ?? options[(options.indexOf(oldValue) + 1) % options.length] ?? oldValue;
  app.setDashboardDraft('provider-region', field, current);
  pendingStore.addChange(createPendingChange({ server, panel: 'provider-region', field, label: field === 'region' ? 'Region' : 'Instance Type', oldValue, newValue: current, category: 'infrastructure', requiresVmRecreate: true }));
  app.patchDashboardPanelUi('provider-region', { statusMessage: `Queued ${field} infrastructure change (${current}).` });
  return true;
}

function queueBuild(app: ReturnType<typeof useAppStore.getState>, pendingStore: ReturnType<typeof usePendingChangesStore.getState>, server: ServerRecord, ui: DashboardPanelUiState): boolean {
  const branch = (ui.drafts.branch as ServerRecord['branch'] | undefined) ?? branches[(branches.indexOf(server.branch) + 1) % branches.length] ?? 'stable';
  pendingStore.addChange(createPendingChange({ server, panel: 'build', field: 'branch', label: 'Build branch', oldValue: server.branch, newValue: branch, category: 'build', requiresRestart: true }));
  app.patchDashboardPanelUi('build', { statusMessage: `Queued build branch ${branch}.` });
  return true;
}

function queueBasic(app: ReturnType<typeof useAppStore.getState>, pendingStore: ReturnType<typeof usePendingChangesStore.getState>, server: ServerRecord, ui: DashboardPanelUiState): boolean {
  const values = basicDefaults(server, ui);
  if (!values.serverName.trim() || !values.publicName.trim()) {
    app.patchDashboardPanelUi('basic-settings', { validationErrors: { required: 'Server Name and Public Name are required.' } });
    return true;
  }
  const changes = [
    createPendingChange({ server, panel: 'basic-settings', field: 'SERVERNAME', label: 'Server Name', oldValue: server.name, newValue: values.serverName, category: 'env', requiresRestart: true }),
    createPendingChange({ server, panel: 'basic-settings', field: 'PublicName', label: 'Public Name', oldValue: server.name, newValue: values.publicName, category: 'ini-lua', requiresRestart: true }),
    createPendingChange({ server, panel: 'basic-settings', field: 'Description', label: 'Description', oldValue: '', newValue: values.description, category: 'ini-lua', requiresRestart: true }),
    createPendingChange({ server, panel: 'basic-settings', field: 'SERVER_PASSWORD', label: 'Server Password', oldValue: '', newValue: values.serverPassword, category: 'env', requiresRestart: true, sensitive: Boolean(values.serverPassword) }),
    createPendingChange({ server, panel: 'basic-settings', field: 'Public', label: 'Public Listing', oldValue: 'true', newValue: values.publicListing, category: 'ini-lua', requiresRestart: true }),
  ].filter((change) => change.oldValue !== change.newValue && (!change.sensitive || values.serverPassword));
  pendingStore.addChanges(changes);
  app.patchDashboardPanelUi('basic-settings', { statusMessage: `Queued ${changes.length} basic settings changes.` });
  return true;
}

function queueAdmins(app: ReturnType<typeof useAppStore.getState>, pendingStore: ReturnType<typeof usePendingChangesStore.getState>, server: ServerRecord, ui: DashboardPanelUiState): boolean {
  const username = ui.drafts.adminUsername ?? 'admin';
  const password = ui.drafts.adminPassword ?? '';
  if (!username.trim() || password.length < 4) {
    app.patchDashboardPanelUi('admins', { validationErrors: { admin: 'Admin username and 4+ char password required.' } });
    return true;
  }
  pendingStore.addChanges([
    createPendingChange({ server, panel: 'admins', field: 'ADMIN_USERNAME', label: 'Admin Username', oldValue: 'admin', newValue: username, category: 'env', requiresRestart: true }),
    createPendingChange({ server, panel: 'admins', field: 'ADMIN_PASSWORD', label: 'Admin Password', oldValue: '', newValue: password, category: 'env', requiresRestart: true, sensitive: true }),
  ]);
  app.patchDashboardPanelUi('admins', { statusMessage: 'Queued admin credentials changes.' });
  return true;
}

function confirmableAction(app: ReturnType<typeof useAppStore.getState>, server: ServerRecord, panel: ServerMenuId, action: string, needsConfirm: string | string[]): boolean {
  const confirming = Array.isArray(needsConfirm) ? needsConfirm.includes(action) : needsConfirm === action;
  const ui = app.getDashboardPanelUi(panel);
  if (confirming && ui.confirmAction !== action) {
    app.patchDashboardPanelUi(panel, { confirmAction: action, statusMessage: null });
    return true;
  }
  app.patchDashboardPanelUi(panel, { confirmAction: null, statusMessage: dashboardMockAdapter.lifecycle(action, server).message });
  return true;
}

function activateStats(app: ReturnType<typeof useAppStore.getState>, panel: ServerMenuId, ui: DashboardPanelUiState): boolean {
  if (ui.rightActionCursor === 0) {
    app.patchDashboardPanelUi(panel, { drafts: { ...ui.drafts, refreshCount: String(Number(ui.drafts.refreshCount ?? 0) + 1) }, statusMessage: 'Mock stats refreshed locally.' });
  } else {
    app.patchDashboardPanelUi(panel, { subView: ui.subView === 'details' ? 'main' : 'details', statusMessage: 'Logs View stub toggled.' });
  }
  return true;
}

function activateAdvanced(app: ReturnType<typeof useAppStore.getState>, panel: ServerMenuId, ui: DashboardPanelUiState): boolean {
  const action = ['Edit', 'Replace', 'Download'][ui.rightActionCursor] ?? 'Edit';
  app.patchDashboardPanelUi(panel, { subView: action === 'Edit' ? 'edit' : 'main', statusMessage: `Stub: ${action} file requested; no SFTP.` });
  return true;
}

function activateScheduler(app: ReturnType<typeof useAppStore.getState>, server: ServerRecord, panel: ServerMenuId, ui: DashboardPanelUiState): boolean {
  const action = ['Create', 'Edit', 'Toggle', 'Delete'][ui.rightActionCursor] ?? 'Create';
  if (action === 'Delete' && ui.confirmAction !== 'Delete') {
    app.patchDashboardPanelUi(panel, { confirmAction: 'Delete' });
    return true;
  }
  if (action === 'Edit' && ui.subView !== 'edit') {
    const cron = dashboardMockAdapter.listScheduledTasks(server)[ui.rightCursor]?.cron ?? '0 3 * * *';
    app.patchDashboardPanelUi(panel, { subView: 'edit', drafts: { ...ui.drafts, cron }, statusMessage: 'Scheduler edit stub opened.' });
    return true;
  }
  if (ui.subView === 'edit') {
    const cron = ui.drafts.cron ?? dashboardMockAdapter.listScheduledTasks(server)[ui.rightCursor]?.cron ?? '';
    const error = validateSimpleCron(cron);
    app.patchDashboardPanelUi(panel, error ? { validationErrors: { cron: error } } : { subView: 'main', statusMessage: `Stub: scheduler cron saved (${cron}).`, validationErrors: {} });
    return true;
  }
  app.patchDashboardPanelUi(panel, { confirmAction: null, statusMessage: `Stub: scheduler ${action} completed locally.` });
  return true;
}

function handleSchedulerEditInput({ app, panel, input, key, ui }: { app: ReturnType<typeof useAppStore.getState>; panel: ServerMenuId; input: string; key: DashboardKey; ui: DashboardPanelUiState }): boolean {
  const current = ui.drafts.cron ?? '';
  if (key.backspace || key.delete) app.setDashboardDraft(panel, 'cron', current.slice(0, -1));
  else if (input.length === 1 && input >= ' ') app.setDashboardDraft(panel, 'cron', `${current}${input}`);
  else return false;
  return true;
}

function moveCursor(app: ReturnType<typeof useAppStore.getState>, panel: ServerMenuId, delta: number, count: number): true { app.moveDashboardRightCursor(panel, delta, count); return true; }
function moveAction(app: ReturnType<typeof useAppStore.getState>, panel: ServerMenuId, delta: number, count: number): true {
  if (panel === 'build') {
    const ui = app.getDashboardPanelUi(panel);
    const current = (ui.drafts.branch as ServerRecord['branch'] | undefined) ?? 'stable';
    app.setDashboardDraft(panel, 'branch', branches[(branches.indexOf(current) + delta + branches.length) % branches.length] ?? 'stable');
    return true;
  }
  if (panel === 'provider-region') return moveProviderChoice(app, panel, delta);
  app.moveDashboardActionCursor(panel, delta, count); return true;
}

function moveProviderChoice(app: ReturnType<typeof useAppStore.getState>, panel: ServerMenuId, delta: number): true {
  const ui = app.getDashboardPanelUi(panel);
  const field = ui.rightCursor === 0 ? 'region' : 'instanceType';
  const options = field === 'region' ? regions : instances;
  const current = ui.drafts[field] ?? options[0]!;
  app.setDashboardDraft(panel, field, options[(options.indexOf(current) + delta + options.length) % options.length] ?? options[0]!);
  return true;
}

function verticalCount(panel: ServerMenuId): number {
  if (panel === 'players') return 3;
  if (panel === 'advanced-settings') return 3;
  if (panel === 'scheduler') return 3;
  if (panel === 'backups') return 3;
  if (panel === 'provider-region') return 2;
  return 1;
}

function actionCount(panel: ServerMenuId): number {
  if (panel === 'server-management' || panel === 'scheduler') return 4;
  if (panel === 'players' || panel === 'advanced-settings' || panel === 'backups') return 3;
  if (panel === 'stats') return 2;
  return 1;
}

function basicDefaults(server: ServerRecord, ui: DashboardPanelUiState): Record<(typeof basicFields)[number], string> {
  return { serverName: ui.drafts.serverName ?? server.name, publicName: ui.drafts.publicName ?? server.name, description: ui.drafts.description ?? 'Mock Project Zomboid server', serverPassword: ui.drafts.serverPassword ?? '', publicListing: ui.drafts.publicListing ?? 'true' };
}

function draftValue(server: ServerRecord, panel: 'basic-settings' | 'admins', field: string, ui: DashboardPanelUiState): string {
  if (panel === 'admins') return ui.drafts[field] ?? (field === 'adminUsername' ? 'admin' : '');
  return basicDefaults(server, ui)[field as (typeof basicFields)[number]] ?? '';
}

function mask(value: string): string { return value ? '*'.repeat(Math.min(value.length, 12)) : ''; }
