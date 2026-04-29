import React from 'react';
import { Box, Text } from 'ink';
import { LayoutShell } from '../../components/index.js';
import { useInkStore } from '../../hooks/use-ink-store.js';
import { useTheme } from '../../hooks/use-theme.js';
import { filteredInstanceCategories, formatGcpLatency, isActiveServer, recommendInstanceForMaxPlayers } from '../../lib/index.js';
import { useAppStore } from '../../stores/app-store.js';
import { usePendingChangesStore } from '../../stores/pending-changes-store.js';
import { useServersStore } from '../../stores/servers-store.js';
import { createLocalDraftServer, getLocalInventoryService, hydrateStoresFromInventory } from '../../services/index.js';
import type { CreateServerWizardState } from '../../types/index.js';
import { gcpRegions, instanceTiers, providerOptions, wizardSteps } from './catalog.js';

const PROVIDER_ACTIONS = ['Cancel Wizard', 'Next'] as const;
const STEP_ACTIONS = ['Back', 'Next'] as const;
const REVIEW_ACTIONS = ['Back', 'Create Server'] as const;

export const CreateServerWizard: React.FC = () => {
  const navigation = useInkStore(useAppStore, (state) => state.navigation);
  const wizard = useInkStore(useAppStore, (state) => state.createServerWizard);
  const servers = useInkStore(useServersStore, (state) => state.servers);
  const pendingChanges = useInkStore(usePendingChangesStore, (state) => state.changes.length);
  const activeServers = servers.filter(isActiveServer);
  const currentStep = wizardSteps[wizard.stepIndex] ?? wizardSteps[0]!;
  const { colors } = useTheme();

  return (
    <LayoutShell
      leftTitle="Setup Wizard"
      rightTitle={currentStep.label}
      focusedPanel={navigation.focusedPanel}
      activeServers={activeServers.length}
      totalServers={servers.length}
      pendingChangesCount={pendingChanges}
      left={<WizardStepper wizard={wizard} colors={colors} />}
      right={<WizardStepContent wizard={wizard} colors={colors} />}
    />
  );
};

export function handleCreateServerWizardInput({
  app,
  input,
  key,
}: {
  app: ReturnType<typeof useAppStore.getState>;
  input: string;
  key: { upArrow?: boolean; downArrow?: boolean; leftArrow?: boolean; rightArrow?: boolean; escape?: boolean; return?: boolean; backspace?: boolean; delete?: boolean };
}) {
  const wizard = useAppStore.getState().createServerWizard;
  const step = wizardSteps[wizard.stepIndex]?.id ?? 'provider';

  if (key.escape) {
    app.previousWizardStep();
    return;
  }

  if (key.leftArrow) {
    if (step === 'region') app.moveWizardZoneCursor(-1);
    else app.moveWizardActionCursor(-1, actionCountForStep(step));
    return;
  }

  if (key.rightArrow) {
    if (step === 'region') app.moveWizardZoneCursor(1);
    else app.moveWizardActionCursor(1, actionCountForStep(step));
    return;
  }

  if (key.upArrow) {
    if (step === 'provider') app.moveWizardProviderCursor(-1);
    if (step === 'region') app.moveWizardRegionCursor(-1);
    if (step === 'instance') app.moveWizardInstanceCursor(-1);
    return;
  }

  if (key.downArrow) {
    if (step === 'provider') app.moveWizardProviderCursor(1);
    if (step === 'region') app.moveWizardRegionCursor(1);
    if (step === 'instance') app.moveWizardInstanceCursor(1);
    return;
  }

  if (step === 'auth-project' || step === 'server-name') {
    const currentValue = step === 'auth-project' ? wizard.draft.projectId : wizard.draft.serverName;
    if (key.backspace || key.delete) {
      setTextDraft(app, step, currentValue.slice(0, -1));
      return;
    }

    if (!key.return && input.length === 1 && input >= ' ') {
      setTextDraft(app, step, `${currentValue}${input}`);
      return;
    }
  }

  if (key.return) confirmWizardAction(app);
}

function WizardStepper({ wizard, colors }: { wizard: CreateServerWizardState; colors: ReturnType<typeof useTheme>['colors'] }) {
  return (
    <Box flexDirection="column">
      {wizardSteps.map((step, index) => {
        const active = wizard.stepIndex === index;
        const done = wizard.stepIndex > index;
        return (
          <Text key={step.id} color={active ? colors.focus : done ? colors.success : colors.text} inverse={active}>
            {active ? '>' : done ? '✓' : ' '} {index + 1}. {step.label}
          </Text>
        );
      })}
      <Text dimColor>ESC backs up; TAB changes panels.</Text>
    </Box>
  );
}

function WizardStepContent({ wizard, colors }: { wizard: CreateServerWizardState; colors: ReturnType<typeof useTheme>['colors'] }) {
  const step = wizardSteps[wizard.stepIndex]?.id ?? 'provider';

  return (
    <Box flexDirection="column" gap={1}>
      {step === 'provider' ? <ProviderStep wizard={wizard} colors={colors} /> : null}
      {step === 'auth-project' ? <AuthProjectStep wizard={wizard} colors={colors} /> : null}
      {step === 'server-name' ? <ServerNameStep wizard={wizard} colors={colors} /> : null}
      {step === 'region' ? <RegionStep wizard={wizard} colors={colors} /> : null}
      {step === 'instance' ? <InstanceStep wizard={wizard} colors={colors} /> : null}
      {step === 'review' ? <ReviewStep wizard={wizard} colors={colors} /> : null}
      {wizard.statusMessage ? <Text color={colors.warning}>{wizard.statusMessage}</Text> : null}
    </Box>
  );
}

function ProviderStep({ wizard, colors }: { wizard: CreateServerWizardState; colors: ReturnType<typeof useTheme>['colors'] }) {
  return (
    <Box flexDirection="column">
      <Text color={colors.text}>Select cloud provider for MVP:</Text>
      {providerOptions.map((provider, index) => (
        <Text key={provider.id} color={wizard.providerCursor === index ? colors.focus : provider.enabled ? colors.text : colors.text} dimColor={!provider.enabled} inverse={wizard.providerCursor === index}>
          {wizard.providerCursor === index ? '>' : ' '} {provider.label} · {provider.statusLabel}
        </Text>
      ))}
      <ActionRow actions={PROVIDER_ACTIONS} cursor={wizard.actionCursor} colors={colors} />
    </Box>
  );
}

function AuthProjectStep({ wizard, colors }: { wizard: CreateServerWizardState; colors: ReturnType<typeof useTheme>['colors'] }) {
  return (
    <Box flexDirection="column">
      <Text color={colors.text}>Local detection placeholder: {wizard.draft.projectId || 'No project detected'}</Text>
      <Text dimColor>Edit project id (optional). It will be validated during future deploy.</Text>
      <Text color={colors.text}>Project id: {wizard.draft.projectId || '<optional>'}</Text>
      <ActionRow actions={STEP_ACTIONS} cursor={wizard.actionCursor} colors={colors} />
    </Box>
  );
}

function ServerNameStep({ wizard, colors }: { wizard: CreateServerWizardState; colors: ReturnType<typeof useTheme>['colors'] }) {
  return (
    <Box flexDirection="column">
      <Text color={colors.text}>Name: {wizard.draft.serverName || '<required>'}</Text>
      {wizard.validationErrors.serverName ? <Text color={colors.error}>{wizard.validationErrors.serverName}</Text> : null}
      <Text dimColor>Use letters, numbers, spaces, dots, underscores or dashes.</Text>
      <ActionRow actions={STEP_ACTIONS} cursor={wizard.actionCursor} colors={colors} />
    </Box>
  );
}

function RegionStep({ wizard, colors }: { wizard: CreateServerWizardState; colors: ReturnType<typeof useTheme>['colors'] }) {
  const selectedRegion = gcpRegions[wizard.regionCursor] ?? gcpRegions[0]!;
  const selectedZone = selectedRegion.zones[wizard.zoneCursor] ?? selectedRegion.zones[0];
  return (
    <Box flexDirection="column">
      <Text color={colors.text}>GCP zones by continent · latency measured/fallback</Text>
      {gcpRegions.map((region, index) => (
        <Text key={region.id} color={wizard.regionCursor === index ? colors.focus : colors.text} inverse={wizard.regionCursor === index}>
          {wizard.regionCursor === index ? '>' : ' '} {region.continent ?? 'gcp'} · {region.label} · {region.location}
        </Text>
      ))}
      <Text color={colors.text}>Zone: {selectedZone?.label ?? '-'} · {selectedZone?.latencyLabel ?? formatGcpLatency(undefined)}</Text>
      <ActionRow actions={STEP_ACTIONS} cursor={wizard.actionCursor} colors={colors} />
    </Box>
  );
}

function InstanceStep({ wizard, colors }: { wizard: CreateServerWizardState; colors: ReturnType<typeof useTheme>['colors'] }) {
  const recommendation = recommendInstanceForMaxPlayers(null);
  return (
    <Box flexDirection="column">
      <Text color={colors.text}>Curated Project Zomboid tiers · estimated local pricing</Text>
      {instanceTiers.map((tier, index) => (
        <Text key={tier.id} color={wizard.instanceCursor === index ? colors.focus : colors.text} inverse={wizard.instanceCursor === index}>
          {wizard.instanceCursor === index ? '>' : ' '} {tier.label}: {tier.instanceType} · {tier.vcpu} vCPU · {tier.ramGb}GB RAM · JVM {tier.jvmMemory} · {tier.estimatedHourlyCost} · {tier.estimatedMonthlyCost}{tier.instanceType === recommendation.instanceType ? ' · Recommended' : ''}
        </Text>
      ))}
      <Text dimColor>{instanceTiers[wizard.instanceCursor]?.playerGuidance}</Text>
      <Text dimColor>Advanced catalog: {filteredInstanceCategories.map((category) => category.label).join(', ')}</Text>
      <ActionRow actions={STEP_ACTIONS} cursor={wizard.actionCursor} colors={colors} />
    </Box>
  );
}

function ReviewStep({ wizard, colors }: { wizard: CreateServerWizardState; colors: ReturnType<typeof useTheme>['colors'] }) {
  const tier = instanceTiers.find((candidate) => candidate.instanceType === wizard.draft.instanceType);
  return (
    <Box flexDirection="column">
      <Text color={colors.success}>Review local server draft</Text>
      <Text color={colors.text}>Provider: GCP</Text>
      <Text color={colors.text}>Project: {wizard.draft.projectId || 'No project detected / optional'}</Text>
      <Text color={colors.text}>Server name: {wizard.draft.serverName}</Text>
      <Text color={colors.text}>Region/zone: {wizard.draft.region} / {wizard.draft.zone}</Text>
      <Text color={colors.text}>Instance: {tier?.label ?? 'Selected'} · {wizard.draft.instanceType}</Text>
      {wizard.draft.projectId ? <Text dimColor>Project id is a local placeholder and is not persisted until deploy support lands.</Text> : null}
      <Text color={colors.warning}>Creates local draft only; no Pulumi, SSH, SFTP or RCON will run.</Text>
      <Text>Se creará el servidor en tu inventario local. Podrás desplegarlo desde su dashboard cuando el deploy esté disponible.</Text>
      <ActionRow actions={REVIEW_ACTIONS} cursor={wizard.actionCursor} colors={colors} />
    </Box>
  );
}

function ActionRow({ actions, cursor, colors }: { actions: ReadonlyArray<string>; cursor: number; colors: ReturnType<typeof useTheme>['colors'] }) {
  return (
    <Box gap={2}>
      {actions.map((action, index) => (
        <Text key={action} color={cursor === index ? colors.focus : colors.text} inverse={cursor === index}>[{action}]</Text>
      ))}
    </Box>
  );
}

function actionCountForStep(step: string): number {
  return step === 'provider' ? PROVIDER_ACTIONS.length : STEP_ACTIONS.length;
}

function setTextDraft(app: ReturnType<typeof useAppStore.getState>, step: string, value: string): void {
  if (step === 'auth-project') app.setWizardProjectId(value);
  if (step === 'server-name') app.setWizardServerName(value);
}

function confirmWizardAction(app: ReturnType<typeof useAppStore.getState>): void {
  const wizard = useAppStore.getState().createServerWizard;
  const step = wizardSteps[wizard.stepIndex]?.id ?? 'provider';

  if (wizard.actionCursor === 0) {
    if (step === 'provider') app.cancelCreateServerWizard();
    else app.previousWizardStep();
    return;
  }

  if (step === 'provider' && providerOptions[wizard.providerCursor]?.enabled === false) {
    app.setWizardStatusMessage(`${providerOptions[wizard.providerCursor]?.label} is Coming Soon.`);
    return;
  }

  if (step !== 'review') {
    app.nextWizardStep();
    return;
  }

  const inventory = getLocalInventoryService();
  if (!inventory) {
    app.setWizardStatusMessage('Inventory service unavailable. Cannot create local draft.');
    return;
  }

  try {
    const created = createLocalDraftServer(inventory, wizard.draft);
    hydrateStoresFromInventory(inventory);
    useServersStore.getState().selectServer(created.id);
    app.resetCreateServerWizard();
    app.enterServerDashboard();
  } catch (error) {
    app.setWizardStatusMessage(error instanceof Error ? error.message : 'Could not create local draft.');
  }
}
