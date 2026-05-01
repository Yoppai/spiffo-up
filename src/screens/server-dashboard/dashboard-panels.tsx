import React from 'react';
import { Box, Text } from 'ink';
import { useTranslation } from 'react-i18next';
import i18next from '../../i18n/config.js';
import type { DashboardPanelUiState, ServerMenuId, ServerMenuItem, ServerRecord } from '../../types/index.js';
import { allGameServerInstanceTypes, buildImageTag, createPendingChange, dashboardMockAdapter, estimateGcpInstanceCost, findGcpInstanceTypeMetadata, formatGcpLatency, formatInstanceTier, formatServerPlayers, formatServerStatus, gcpRegionsCatalog, recommendInstanceForMaxPlayers, validateSimpleCron } from '../../lib/index.js';
import type { useAppStore } from '../../stores/app-store.js';
import type { usePendingChangesStore } from '../../stores/pending-changes-store.js';
import { useServersStore } from '../../stores/servers-store.js';
import { getLocalInventoryService, hydrateStoresFromInventory, ServerLifecycleService } from '../../services/index.js';
import { PulumiCliManager } from '../../infrastructure/pulumi/pulumi-cli-manager.js';
import { useTheme } from '../../hooks/use-theme.js';

// Re-export validateSimpleCron with i18n support
export { validateSimpleCron } from '../../lib/dashboard-mock-adapter.js';

const defaultUi: DashboardPanelUiState = { rightCursor: 0, rightActionCursor: 0, subView: 'main', drafts: {}, validationErrors: {}, statusMessage: null, confirmAction: null };
const regions = gcpRegionsCatalog.map((region) => region.id);
const instances = allGameServerInstanceTypes.map((metadata) => metadata.instanceType);
const branches: ServerRecord['branch'][] = ['stable', 'unstable', 'outdatedunstable'];
const basicFields = ['serverName', 'publicName', 'description', 'serverPassword', 'publicListing'] as const;
const adminFields = ['adminUsername', 'adminPassword'] as const;

export function getPanelUi(panels: Partial<Record<ServerMenuId, DashboardPanelUiState>>, id: ServerMenuId): DashboardPanelUiState {
  return panels[id] ?? defaultUi;
}

export const DashboardPanel: React.FC<{ selectedMenu: ServerMenuItem; server: ServerRecord; pendingChangesCount: number; ui: DashboardPanelUiState }> = ({ selectedMenu, server, pendingChangesCount, ui }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const banner = pendingChangesCount > 0 ? <PendingChangesBanner count={pendingChangesCount} theme={theme} /> : null;
  if (selectedMenu.id === 'back-to-servers') return <Text color={theme.colors.focus}>{t('serverDashboard.backToServers')}</Text>;

  return (
    <Box flexDirection="column">
      {banner}
      {renderPanel(selectedMenu.id, server, ui, pendingChangesCount, theme, t)}
      {ui.statusMessage ? <Text color={theme.colors.success}>Status: {ui.statusMessage}</Text> : null}
      {Object.values(ui.validationErrors).filter(Boolean).map((error) => <Text key={error} color={theme.colors.error}>Error: {error}</Text>)}
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

function renderPanel(panel: ServerMenuId, server: ServerRecord, ui: DashboardPanelUiState, pendingChangesCount: number, theme: ReturnType<typeof useTheme>, t: ReturnType<typeof useTranslation>['t']): React.ReactNode {
  switch (panel) {
    case 'server-management':
      return <ServerManagementPanel server={server} ui={ui} pendingChangesCount={pendingChangesCount} theme={theme} t={t} />;
    case 'provider-region':
      return <ProviderRegionPanel server={server} ui={ui} theme={theme} t={t} />;
    case 'build':
      return <BuildPanel server={server} ui={ui} theme={theme} t={t} />;
    case 'players':
      return <PlayersPanel server={server} ui={ui} theme={theme} t={t} />;
    case 'stats':
      return <StatsPanel server={server} ui={ui} theme={theme} t={t} />;
    case 'basic-settings':
      return <BasicSettingsPanel server={server} ui={ui} theme={theme} t={t} />;
    case 'advanced-settings':
      return <AdvancedSettingsPanel server={server} ui={ui} theme={theme} t={t} />;
    case 'admins':
      return <AdminsPanel ui={ui} theme={theme} t={t} />;
    case 'scheduler':
      return <SchedulerPanel server={server} ui={ui} theme={theme} t={t} />;
    case 'backups':
      return <BackupsPanel server={server} ui={ui} theme={theme} t={t} />;
    default:
      return null;
  }
}

function ServerManagementPanel({ server, ui, pendingChangesCount, theme, t }: { server: ServerRecord; ui: DashboardPanelUiState; pendingChangesCount: number; theme: ReturnType<typeof useTheme>; t: ReturnType<typeof useTranslation>['t'] }) {
  const actions = [t('serverDashboard.serverManagement.actions.deploy'), server.status === 'running' ? t('serverDashboard.serverManagement.actions.stop') : t('serverDashboard.serverManagement.actions.start'), t('serverDashboard.serverManagement.actions.update'), t('serverDashboard.serverManagement.actions.archive')];
  const pulumiLabel = ui.drafts.pulumiStatus ? `(${ui.drafts.pulumiStatus})` : '';
  const rconExposure = formatRconExposure(server, t);
  return <>
    <Text color={theme.colors.text}>{t('serverDashboard.serverManagement.status')} {formatServerStatus(server, t)} · {server.provider === 'gcp' ? t('serverDashboard.serverManagement.gcpLifecycle') : t('serverDashboard.serverManagement.mockAdapterReady')}</Text>
    <Text color={theme.colors.text}>{t('serverDashboard.serverManagement.ip')} {server.publicIp ?? '-'}</Text>
    <Text color={theme.colors.text}>{t('serverDashboard.serverManagement.ports')} {t('serverDashboard.serverManagement.gamePort')} {server.gamePort ?? '-'} / {t('serverDashboard.serverManagement.queryPort')} {server.queryPort ?? '-'} / {t('serverDashboard.serverManagement.rconPort')} {server.rconPort ?? '-'}</Text>
    <Text color={theme.colors.text}>{t('serverDashboard.serverManagement.rcon')} {rconExposure}</Text>
    <Text color={theme.colors.text}>{t('serverDashboard.serverManagement.pulumi')} {pulumiLabel || '-'}</Text>
    <Text color={theme.colors.text}>{t('serverDashboard.serverManagement.branch')} {server.branch}</Text>
    <Text color={theme.colors.text}>{t('serverDashboard.serverManagement.players')} {formatServerPlayers(server)}</Text>
    {pendingChangesCount > 0 ? <Text color={theme.colors.focus}>{t('serverDashboard.serverManagement.applyAllChanges')} ({pendingChangesCount})</Text> : null}
    <ActionRow actions={actions} selected={ui.rightActionCursor} theme={theme} />
    {ui.confirmAction === 'Deploy' ? <Text color={theme.colors.warning}>{t('serverDashboard.serverManagement.confirmDeploy')}</Text> : null}
    {ui.confirmAction === 'Install Pulumi' ? <Text color={theme.colors.warning}>{t('serverDashboard.serverManagement.confirmInstallPulumi')}</Text> : null}
    {ui.confirmAction === 'Archive' ? <Text color={theme.colors.error}>{t('serverDashboard.serverManagement.confirmArchive')}</Text> : null}
  </>;
}

function ProviderRegionPanel({ server, ui, theme, t }: { server: ServerRecord; ui: DashboardPanelUiState; theme: ReturnType<typeof useTheme>; t: ReturnType<typeof useTranslation>['t'] }) {
  const region = ui.drafts.region ?? server.region ?? regions[0]!;
  const instanceType = ui.drafts.instanceType ?? server.instanceType;
  const regionMetadata = gcpRegionsCatalog.find((candidate) => candidate.id === region) ?? gcpRegionsCatalog[0]!;
  const zone = regionMetadata.zones[0];
  const instanceMetadata = findGcpInstanceTypeMetadata(instanceType);
  const cost = estimateGcpInstanceCost(instanceType);
  const recommendation = recommendInstanceForMaxPlayers(server.playersMax ?? undefined);
  return <>
    <Text color={theme.colors.text}>{t('serverDashboard.providerRegion.provider')} {t('serverDashboard.providerRegion.gcpMvp')} · {t('serverDashboard.providerRegion.awsComingSoon')} · {t('serverDashboard.providerRegion.azureComingSoon')}</Text>
    <CursorLine active={ui.rightCursor === 0} theme={theme}>{t('serverDashboard.providerRegion.region')} {region} · {regionMetadata.continent} · {regionMetadata.location} · {zone ? formatGcpLatency(undefined, zone.fallbackLatencyMs) : t('serverDashboard.providerRegion.measuring')} ({t('serverDashboard.providerRegion.chooseRegion')})</CursorLine>
    <CursorLine active={ui.rightCursor === 1} theme={theme}>{t('serverDashboard.providerRegion.instance')} {instanceMetadata ? `${instanceMetadata.label} (${instanceType})` : formatInstanceTier(instanceType)} · {instanceMetadata?.vcpu ?? '?'} {t('serverDashboard.providerRegion.vcpu')} · {instanceMetadata?.ramGb ?? '?'}{t('serverDashboard.providerRegion.ramGb')} ({t('serverDashboard.providerRegion.chooseInstance')})</CursorLine>
    <Text color={theme.colors.text}>{t('serverDashboard.providerRegion.estimatedCost')} {cost.hourlyLabel} · {cost.monthlyLabel} · {t('serverDashboard.providerRegion.localEstimate')}</Text>
    <Text color={theme.colors.text} dimColor>{t('serverDashboard.providerRegion.recommendation')} {recommendation.tierLabel} · {recommendation.instanceType} for {server.playersMax ?? 20} MaxPlayers.</Text>
  </>;
}

function BuildPanel({ server, ui, theme, t }: { server: ServerRecord; ui: DashboardPanelUiState; theme: ReturnType<typeof useTheme>; t: ReturnType<typeof useTranslation>['t'] }) {
  const branch = (ui.drafts.branch as ServerRecord['branch'] | undefined) ?? server.branch;
  return <>
    <Text color={theme.colors.text}>{t('serverDashboard.build.currentBranch')} {server.branch}</Text>
    <CursorLine active theme={theme}>{t('serverDashboard.build.selectedBranch')} {branch} ({t('serverDashboard.build.branchHint')})</CursorLine>
    <Text color={theme.colors.text}>{t('serverDashboard.build.imageTag')} {buildImageTag(branch)}</Text>
    <Text color={theme.colors.focus}>{t('serverDashboard.build.pressEnterQueue')}</Text>
  </>;
}

function PlayersPanel({ server, ui, theme, t }: { server: ServerRecord; ui: DashboardPanelUiState; theme: ReturnType<typeof useTheme>; t: ReturnType<typeof useTranslation>['t'] }) {
  const players = dashboardMockAdapter.listPlayers(server);
  const actions = [t('serverDashboard.players.actions.message'), t('serverDashboard.players.actions.kick'), t('serverDashboard.players.actions.ban')];
  return <>
    <Text color={theme.colors.text}>{t('serverDashboard.players.connected')} · {t('serverDashboard.players.mock')}</Text>
    {players.map((player, index) => <CursorLine key={player.id} active={ui.rightCursor === index} theme={theme}>{player.username} · {player.status} · {player.pingMs}ms</CursorLine>)}
    <ActionRow actions={actions} selected={ui.rightActionCursor} theme={theme} />
    {ui.confirmAction ? <Text color={theme.colors.error}>Confirm {ui.confirmAction}? Press Enter again (Stub).</Text> : null}
  </>;
}

function StatsPanel({ server, ui, theme, t }: { server: ServerRecord; ui: DashboardPanelUiState; theme: ReturnType<typeof useTheme>; t: ReturnType<typeof useTranslation>['t'] }) {
  const snapshot = dashboardMockAdapter.getStatsSnapshot(server, Number(ui.drafts.refreshCount ?? 0));
  return <>
    <Text color={theme.colors.text}>{t('serverDashboard.stats.containerMetrics')} · {t('serverDashboard.stats.mock')}</Text>
    <Text color={theme.colors.text}>{t('serverDashboard.stats.cpu')} {snapshot.cpu}</Text><Text color={theme.colors.text}>{t('serverDashboard.stats.memory')} {snapshot.memory}</Text><Text color={theme.colors.text}>{t('serverDashboard.stats.network')} {snapshot.network}</Text><Text color={theme.colors.text}>{t('serverDashboard.stats.diskIo')} {snapshot.diskIo}</Text>
    <Text color={theme.colors.text}>{t('serverDashboard.stats.logsSnapshot')}</Text>{snapshot.logs.map((line) => <Text key={line} color={theme.colors.text}>  {line}</Text>)}
    <ActionRow actions={[t('serverDashboard.stats.actions.refreshStats'), t('serverDashboard.stats.actions.logsView')]} selected={ui.rightActionCursor} theme={theme} />
    {ui.subView === 'details' ? <Text color={theme.colors.focus}>{t('serverDashboard.stats.logsSubview')}</Text> : null}
  </>;
}

function BasicSettingsPanel({ server, ui, theme, t }: { server: ServerRecord; ui: DashboardPanelUiState; theme: ReturnType<typeof useTheme>; t: ReturnType<typeof useTranslation>['t'] }) {
  const values = basicDefaults(server, ui);
  return <FormPanel title={t('serverDashboard.basicSettings.title')} fields={[['serverName', values.serverName], ['publicName', values.publicName], ['description', values.description], ['serverPassword', mask(values.serverPassword)], ['publicListing', values.publicListing]]} ui={ui} theme={theme} t={t} />;
}

function AdvancedSettingsPanel({ server, ui, theme, t }: { server: ServerRecord; ui: DashboardPanelUiState; theme: ReturnType<typeof useTheme>; t: ReturnType<typeof useTranslation>['t'] }) {
  const files = dashboardMockAdapter.listAdvancedFiles(server);
  const selected = files[ui.rightCursor] ?? files[0]!;
  return <>
    <Text color={theme.colors.text}>{t('serverDashboard.advancedSettings.configFiles')} · {t('serverDashboard.advancedSettings.mockSftp')}</Text>
    {files.map((file, index) => <CursorLine key={file.id} active={ui.rightCursor === index} theme={theme}>{file.filename} · {file.description}</CursorLine>)}
    <ActionRow actions={[t('serverDashboard.advancedSettings.actions.edit'), t('serverDashboard.advancedSettings.actions.replace'), t('serverDashboard.advancedSettings.actions.download')]} selected={ui.rightActionCursor} theme={theme} />
    {ui.subView === 'edit' ? <><Text color={theme.colors.focus}>{t('serverDashboard.advancedSettings.mockEdit')} {selected.filename}</Text>{selected.mockPreview.map((line) => <Text key={line} color={theme.colors.text}>  {line}</Text>)}<Text color={theme.colors.text}>{t('serverDashboard.advancedSettings.queueFileChange')}</Text></> : null}
  </>;
}

function AdminsPanel({ ui, theme, t }: { ui: DashboardPanelUiState; theme: ReturnType<typeof useTheme>; t: ReturnType<typeof useTranslation>['t'] }) {
  const username = ui.drafts.adminUsername ?? 'admin';
  const password = ui.drafts.adminPassword ?? '';
  return <FormPanel title={t('serverDashboard.admins.title')} fields={[['adminUsername', username], ['adminPassword', mask(password)]]} ui={ui} theme={theme} t={t} />;
}

function SchedulerPanel({ server, ui, theme, t }: { server: ServerRecord; ui: DashboardPanelUiState; theme: ReturnType<typeof useTheme>; t: ReturnType<typeof useTranslation>['t'] }) {
  const tasks = dashboardMockAdapter.listScheduledTasks(server);
  const selected = tasks[ui.rightCursor] ?? tasks[0]!;
  return <>
    <Text color={theme.colors.text}>{t('serverDashboard.scheduler.scheduledTasks')} · {t('serverDashboard.scheduler.mock')}</Text>
    {tasks.map((task, index) => <CursorLine key={task.id} active={ui.rightCursor === index} theme={theme}>{task.name} · {task.type} · {task.cron} · {task.enabled ? t('serverDashboard.scheduler.enabled') : t('serverDashboard.scheduler.disabled')}</CursorLine>)}
    <ActionRow actions={[t('serverDashboard.scheduler.actions.create'), t('serverDashboard.scheduler.actions.edit'), t('serverDashboard.scheduler.actions.toggle'), t('serverDashboard.scheduler.actions.delete')]} selected={ui.rightActionCursor} theme={theme} />
    {ui.subView === 'edit' ? <Text color={theme.colors.focus}>{t('serverDashboard.scheduler.editCron')} {ui.drafts.cron ?? selected.cron} ({t('serverDashboard.scheduler.editHint')})</Text> : null}
    {ui.confirmAction === 'Delete' ? <Text color={theme.colors.error}>{t('serverDashboard.scheduler.confirmDelete')}</Text> : null}
  </>;
}

function BackupsPanel({ server, ui, theme, t }: { server: ServerRecord; ui: DashboardPanelUiState; theme: ReturnType<typeof useTheme>; t: ReturnType<typeof useTranslation>['t'] }) {
  const backups = dashboardMockAdapter.listBackups(server);
  return <>
    <Text color={theme.colors.text}>{t('serverDashboard.backups.history')} · {t('serverDashboard.backups.mockPath')} /var/backups/{server.name}</Text>
    {backups.map((backup, index) => <CursorLine key={backup.id} active={ui.rightCursor === index} theme={theme}>{backup.createdAt} · {backup.size} · {backup.type} · {backup.status}</CursorLine>)}
    <ActionRow actions={[t('serverDashboard.backups.actions.createBackup'), t('serverDashboard.backups.actions.restore'), t('serverDashboard.backups.actions.delete')]} selected={ui.rightActionCursor} theme={theme} />
    {ui.confirmAction ? <Text color={theme.colors.error}>Confirm {ui.confirmAction}? Press Enter again (Stub).</Text> : null}
  </>;
}

function FormPanel({ title, fields, ui, theme, t }: { title: string; fields: [string, string][]; ui: DashboardPanelUiState; theme: ReturnType<typeof useTheme>; t: ReturnType<typeof useTranslation>['t'] }) {
  return <>
    <Text color={theme.colors.text}>{title} · {t('serverDashboard.basicSettings.draftsHint')}</Text>
    {fields.map(([field, value], index) => <CursorLine key={field} active={ui.rightCursor === index} theme={theme}>{field}: {value || '-'}</CursorLine>)}
    <CursorLine active={ui.rightCursor === fields.length} theme={theme}>{t('serverDashboard.basicSettings.queueChanges')}</CursorLine>
  </>;
}

function ActionRow({ actions, selected, theme }: { actions: string[]; selected: number; theme: ReturnType<typeof useTheme> }) {
  return <Text color={theme.colors.focus}>{actions.map((action, index) => `${index === selected ? '>' : ' '}[${action}]`).join('  ')}</Text>;
}

const CursorLine: React.FC<{ active: boolean; children: React.ReactNode; theme: ReturnType<typeof useTheme> }> = ({ active, children, theme }) => <Text color={active ? theme.colors.focus : theme.colors.text}>{active ? '> ' : '  '}{children}</Text>;

export const PendingChangesBanner: React.FC<{ count: number; theme: ReturnType<typeof useTheme> }> = ({ count, theme }) => {
  const { t } = useTranslation();
  return (
    <Box borderStyle="round" borderColor={theme.colors.warning} paddingX={1} marginBottom={1}>
      <Text color={theme.colors.warning}>{t('pendingChanges.banner.pendingChanges', { count })}</Text>
    </Box>
  );
};

function activatePanel({ app, pendingStore, server, panel, ui }: { app: ReturnType<typeof useAppStore.getState>; pendingStore: ReturnType<typeof usePendingChangesStore.getState>; server: ServerRecord; panel: ServerMenuId; ui: DashboardPanelUiState }): boolean {
  if (panel === 'provider-region') return queueProviderRegion(app, pendingStore, server, ui);
  if (panel === 'build') return queueBuild(app, pendingStore, server, ui);
  if (panel === 'server-management') return activateServerManagement(app, server, panel, ui);
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
  pendingStore.addChange(createPendingChange({ server, panel: 'provider-region', field, label: i18next.t(field === 'region' ? 'status.region' : 'status.instanceType'), oldValue, newValue: current, category: 'infrastructure', requiresVmRecreate: true }));
  app.patchDashboardPanelUi('provider-region', { statusMessage: i18next.t('status.queuedChange', { field, value: current }) });
  return true;
}

function queueBuild(app: ReturnType<typeof useAppStore.getState>, pendingStore: ReturnType<typeof usePendingChangesStore.getState>, server: ServerRecord, ui: DashboardPanelUiState): boolean {
  const branch = (ui.drafts.branch as ServerRecord['branch'] | undefined) ?? branches[(branches.indexOf(server.branch) + 1) % branches.length] ?? 'stable';
  pendingStore.addChange(createPendingChange({ server, panel: 'build', field: 'branch', label: i18next.t('status.buildBranch'), oldValue: server.branch, newValue: branch, category: 'build', requiresRestart: true }));
  app.patchDashboardPanelUi('build', { statusMessage: i18next.t('status.queuedBuildBranch', { branch }) });
  return true;
}

function queueBasic(app: ReturnType<typeof useAppStore.getState>, pendingStore: ReturnType<typeof usePendingChangesStore.getState>, server: ServerRecord, ui: DashboardPanelUiState): boolean {
  const values = basicDefaults(server, ui);
  if (!values.serverName.trim() || !values.publicName.trim()) {
    app.patchDashboardPanelUi('basic-settings', { validationErrors: { required: i18next.t('status.requiredFieldsMissing') } });
    return true;
  }
  const changes = [
    createPendingChange({ server, panel: 'basic-settings', field: 'SERVERNAME', label: i18next.t('status.serverName'), oldValue: server.name, newValue: values.serverName, category: 'env', requiresRestart: true }),
    createPendingChange({ server, panel: 'basic-settings', field: 'PublicName', label: i18next.t('status.publicName'), oldValue: server.name, newValue: values.publicName, category: 'ini-lua', requiresRestart: true }),
    createPendingChange({ server, panel: 'basic-settings', field: 'Description', label: i18next.t('status.description'), oldValue: '', newValue: values.description, category: 'ini-lua', requiresRestart: true }),
    createPendingChange({ server, panel: 'basic-settings', field: 'SERVER_PASSWORD', label: i18next.t('status.serverPassword'), oldValue: '', newValue: values.serverPassword, category: 'env', requiresRestart: true, sensitive: Boolean(values.serverPassword) }),
    createPendingChange({ server, panel: 'basic-settings', field: 'Public', label: i18next.t('status.publicListing'), oldValue: 'true', newValue: values.publicListing, category: 'ini-lua', requiresRestart: true }),
  ].filter((change) => change.oldValue !== change.newValue && (!change.sensitive || values.serverPassword));
  pendingStore.addChanges(changes);
  app.patchDashboardPanelUi('basic-settings', { statusMessage: i18next.t('status.queuedBasicSettings', { count: changes.length }) });
  return true;
}

function queueAdmins(app: ReturnType<typeof useAppStore.getState>, pendingStore: ReturnType<typeof usePendingChangesStore.getState>, server: ServerRecord, ui: DashboardPanelUiState): boolean {
  const username = ui.drafts.adminUsername ?? 'admin';
  const password = ui.drafts.adminPassword ?? '';
  if (!username.trim() || password.length < 4) {
    app.patchDashboardPanelUi('admins', { validationErrors: { admin: i18next.t('status.adminRequired') } });
    return true;
  }
  pendingStore.addChanges([
    createPendingChange({ server, panel: 'admins', field: 'ADMIN_USERNAME', label: i18next.t('status.adminUsername'), oldValue: 'admin', newValue: username, category: 'env', requiresRestart: true }),
    createPendingChange({ server, panel: 'admins', field: 'ADMIN_PASSWORD', label: i18next.t('status.adminPassword'), oldValue: '', newValue: password, category: 'env', requiresRestart: true, sensitive: true }),
  ]);
  app.patchDashboardPanelUi('admins', { statusMessage: i18next.t('status.queuedAdminCredentials') });
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

function activateServerManagement(app: ReturnType<typeof useAppStore.getState>, server: ServerRecord, panel: ServerMenuId, ui: DashboardPanelUiState): boolean {
  const action = ['Deploy', server.status === 'running' ? 'Stop' : 'Start', 'Update', 'Archive'][ui.rightActionCursor] ?? 'Deploy';
  if (action === 'Deploy' && server.provider === 'gcp' && (server.status === 'draft' || server.status === 'error')) {
    if (ui.confirmAction === 'Install Pulumi') {
      app.patchDashboardPanelUi(panel, { confirmAction: null, statusMessage: i18next.t('status.installingPulumi') });
      void runInstallPulumi(app, panel);
      return true;
    }
    if (ui.confirmAction !== 'Deploy') {
      app.patchDashboardPanelUi(panel, { confirmAction: 'Deploy', statusMessage: null });
      return true;
    }
    app.patchDashboardPanelUi(panel, { confirmAction: null, statusMessage: i18next.t('status.deployStarted') });
    void runDeployAction(app, server.id, panel);
    return true;
  }

  return confirmableAction(app, server, panel, action, 'Archive');
}

async function runDeployAction(app: ReturnType<typeof useAppStore.getState>, serverId: string, panel: ServerMenuId): Promise<void> {
  const inventory = getLocalInventoryService();
  if (!inventory) {
    app.patchDashboardPanelUi(panel, { statusMessage: i18next.t('status.inventoryUnavailable') });
    return;
  }
  const manager = new PulumiCliManager();
  const service = new ServerLifecycleService(inventory, new (await import('../../infrastructure/pulumi/gcp-pulumi-deployer.js')).GcpPulumiAutomationDeployer(undefined, manager), undefined, manager);
  const preflight = await service.preflight();
  if (preflight.status !== 'ready') {
    app.patchDashboardPanelUi(panel, { statusMessage: preflight.status === 'missing' ? i18next.t('status.installPulumiPrompt') : i18next.t('status.pulumiNotReady', { status: preflight.status }), confirmAction: preflight.status === 'missing' ? 'Install Pulumi' : null, drafts: { ...app.getDashboardPanelUi(panel).drafts, pulumiStatus: preflight.status } });
    return;
  }
  app.patchDashboardPanelUi(panel, { drafts: { ...app.getDashboardPanelUi(panel).drafts, pulumiStatus: 'ready' } });
  const result = await service.deploy(serverId);
  hydrateStoresFromInventory(inventory);
  useServersStore.getState().selectServer(serverId);
  app.patchDashboardPanelUi(panel, { statusMessage: result.status === 'running' ? i18next.t('status.deployComplete', { ip: result.publicIp ?? 'IP pending' }) : i18next.t('status.deployFailed', { error: result.lastError ?? 'unknown error' }) });
}

async function runInstallPulumi(app: ReturnType<typeof useAppStore.getState>, panel: ServerMenuId): Promise<void> {
  const manager = new PulumiCliManager();
  const result = await manager.install();
  if (result.status === 'ready') {
    app.patchDashboardPanelUi(panel, { statusMessage: i18next.t('status.pulumiInstalled'), confirmAction: 'Install Pulumi', drafts: { ...app.getDashboardPanelUi(panel).drafts, pulumiStatus: 'ready' } });
  } else {
    app.patchDashboardPanelUi(panel, { statusMessage: i18next.t('status.installFailed', { error: result.error ?? 'unknown error' }), confirmAction: null, drafts: { ...app.getDashboardPanelUi(panel).drafts, pulumiStatus: 'failed' } });
  }
}

function activateStats(app: ReturnType<typeof useAppStore.getState>, panel: ServerMenuId, ui: DashboardPanelUiState): boolean {
  if (ui.rightActionCursor === 0) {
    app.patchDashboardPanelUi(panel, { drafts: { ...ui.drafts, refreshCount: String(Number(ui.drafts.refreshCount ?? 0) + 1) }, statusMessage: i18next.t('status.mockStatsRefreshed') });
  } else {
    app.patchDashboardPanelUi(panel, { subView: ui.subView === 'details' ? 'main' : 'details', statusMessage: i18next.t('status.logsViewToggled') });
  }
  return true;
}

function activateAdvanced(app: ReturnType<typeof useAppStore.getState>, panel: ServerMenuId, ui: DashboardPanelUiState): boolean {
  const action = ['Edit', 'Replace', 'Download'][ui.rightActionCursor] ?? 'Edit';
  app.patchDashboardPanelUi(panel, { subView: action === 'Edit' ? 'edit' : 'main', statusMessage: i18next.t('status.stubAction', { action }) });
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
    app.patchDashboardPanelUi(panel, { subView: 'edit', drafts: { ...ui.drafts, cron }, statusMessage: i18next.t('status.schedulerEditOpened') });
    return true;
  }
  if (ui.subView === 'edit') {
    const cron = ui.drafts.cron ?? dashboardMockAdapter.listScheduledTasks(server)[ui.rightCursor]?.cron ?? '';
    const error = validateSimpleCron(cron);
    app.patchDashboardPanelUi(panel, error ? { validationErrors: { cron: error } } : { subView: 'main', statusMessage: i18next.t('status.schedulerCronSaved', { cron }), validationErrors: {} });
    return true;
  }
  app.patchDashboardPanelUi(panel, { confirmAction: null, statusMessage: i18next.t('status.schedulerActionCompleted', { action }) });
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
