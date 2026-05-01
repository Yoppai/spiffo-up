import React from 'react';
import { Box, Text } from 'ink';
import { useTranslation } from 'react-i18next';
import i18next from '../../i18n/config.js';
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

const PROVIDER_ACTIONS = ['cancelWizard', 'next'] as const;
const STEP_ACTIONS = ['back', 'next'] as const;
const REVIEW_ACTIONS = ['back', 'createServer'] as const;

export const CreateServerWizard: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useInkStore(useAppStore, (state) => state.navigation);
  const wizard = useInkStore(useAppStore, (state) => state.createServerWizard);
  const servers = useInkStore(useServersStore, (state) => state.servers);
  const pendingChanges = useInkStore(usePendingChangesStore, (state) => state.changes.length);
  const activeServers = servers.filter(isActiveServer);
  const currentStep = wizardSteps[wizard.stepIndex] ?? wizardSteps[0]!;
  const { colors } = useTheme();

  return (
    <LayoutShell
      leftTitle={t('wizard.setupWizard')}
      rightTitle={t(currentStep.label)}
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
  const { t } = useTranslation();
  return (
    <Box flexDirection="column">
      {wizardSteps.map((step, index) => {
        const active = wizard.stepIndex === index;
        const done = wizard.stepIndex > index;
        return (
          <Text key={step.id} color={active ? colors.focus : done ? colors.success : colors.text} inverse={active}>
            {active ? '>' : done ? '✓' : ' '} {index + 1}. {t(step.label)}
          </Text>
        );
      })}
      <Text dimColor>{t('wizard.hints.escBack')}</Text>
    </Box>
  );
}

function WizardStepContent({ wizard, colors }: { wizard: CreateServerWizardState; colors: ReturnType<typeof useTheme>['colors'] }) {
  const { t } = useTranslation();
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
  const { t } = useTranslation();
  return (
    <Box flexDirection="column">
      <Text color={colors.text}>{t('wizard.selectProvider')}</Text>
      {providerOptions.map((provider, index) => (
        <Text key={provider.id} color={wizard.providerCursor === index ? colors.focus : provider.enabled ? colors.text : colors.text} dimColor={!provider.enabled} inverse={wizard.providerCursor === index}>
          {wizard.providerCursor === index ? '>' : ' '} {t(provider.label)} · {t(provider.statusLabel)}
        </Text>
      ))}
      <ActionRow actions={[t(`wizard.actions.${PROVIDER_ACTIONS[0]}`), t(`wizard.actions.${PROVIDER_ACTIONS[1]}`)]} cursor={wizard.actionCursor} colors={colors} />
    </Box>
  );
}

function AuthProjectStep({ wizard, colors }: { wizard: CreateServerWizardState; colors: ReturnType<typeof useTheme>['colors'] }) {
  const { t } = useTranslation();
  return (
    <Box flexDirection="column">
      <Text color={colors.text}>{t('wizard.hints.projectIdDetected')}: {wizard.draft.projectId || t('wizard.hints.noProjectDetected')}</Text>
      <Text dimColor>{t('wizard.hints.authEdit')}</Text>
      <Text color={colors.text}>{t('wizard.projectId')} {wizard.draft.projectId || t('wizard.hints.projectIdPlaceholder')}</Text>
      <ActionRow actions={[t(`wizard.actions.${STEP_ACTIONS[0]}`), t(`wizard.actions.${STEP_ACTIONS[1]}`)]} cursor={wizard.actionCursor} colors={colors} />
    </Box>
  );
}

function ServerNameStep({ wizard, colors }: { wizard: CreateServerWizardState; colors: ReturnType<typeof useTheme>['colors'] }) {
  const { t } = useTranslation();
  return (
    <Box flexDirection="column">
      <Text color={colors.text}>{t('wizard.name')} {wizard.draft.serverName || t('wizard.hints.serverNamePlaceholder')}</Text>
      {wizard.validationErrors.serverName ? <Text color={colors.error}>{wizard.validationErrors.serverName}</Text> : null}
      <Text dimColor>{t('wizard.hints.serverNameHint')}</Text>
      <ActionRow actions={[t(`wizard.actions.${STEP_ACTIONS[0]}`), t(`wizard.actions.${STEP_ACTIONS[1]}`)]} cursor={wizard.actionCursor} colors={colors} />
    </Box>
  );
}

function RegionStep({ wizard, colors }: { wizard: CreateServerWizardState; colors: ReturnType<typeof useTheme>['colors'] }) {
  const { t } = useTranslation();
  const selectedRegion = gcpRegions[wizard.regionCursor] ?? gcpRegions[0]!;
  const selectedZone = selectedRegion.zones[wizard.zoneCursor] ?? selectedRegion.zones[0];
  return (
    <Box flexDirection="column">
      <Text color={colors.text}>{t('wizard.hints.gcpZonesHint')}</Text>
      {gcpRegions.map((region, index) => (
        <Text key={region.id} color={wizard.regionCursor === index ? colors.focus : colors.text} inverse={wizard.regionCursor === index}>
          {wizard.regionCursor === index ? '>' : ' '} {region.continent ?? 'gcp'} · {region.label} · {region.location}
        </Text>
      ))}
      <Text color={colors.text}>{t('wizard.zone')}: {selectedZone?.label ?? '-'} · {selectedZone?.latencyLabel ?? formatGcpLatency(undefined)}</Text>
      <ActionRow actions={[t(`wizard.actions.${STEP_ACTIONS[0]}`), t(`wizard.actions.${STEP_ACTIONS[1]}`)]} cursor={wizard.actionCursor} colors={colors} />
    </Box>
  );
}

function InstanceStep({ wizard, colors }: { wizard: CreateServerWizardState; colors: ReturnType<typeof useTheme>['colors'] }) {
  const { t } = useTranslation();
  const recommendation = recommendInstanceForMaxPlayers(null);
  return (
    <Box flexDirection="column">
      <Text color={colors.text}>{t('wizard.instanceCost')}</Text>
      {instanceTiers.map((tier, index) => (
        <Text key={tier.id} color={wizard.instanceCursor === index ? colors.focus : colors.text} inverse={wizard.instanceCursor === index}>
          {wizard.instanceCursor === index ? '>' : ' '} {t(tier.label)}: {tier.instanceType} · {tier.vcpu} vCPU · {tier.ramGb}GB RAM · JVM {tier.jvmMemory} · {tier.estimatedHourlyCost} · {tier.estimatedMonthlyCost}{tier.instanceType === recommendation.instanceType ? t('wizard.hints.recommended') : ''}
        </Text>
      ))}
      <Text dimColor>{instanceTiers[wizard.instanceCursor]?.playerGuidance}</Text>
      <Text dimColor>{t('wizard.hints.instanceCatalog')}: {filteredInstanceCategories.map((category) => category.label).join(', ')}</Text>
      <ActionRow actions={[t(`wizard.actions.${STEP_ACTIONS[0]}`), t(`wizard.actions.${STEP_ACTIONS[1]}`)]} cursor={wizard.actionCursor} colors={colors} />
    </Box>
  );
}

function ReviewStep({ wizard, colors }: { wizard: CreateServerWizardState; colors: ReturnType<typeof useTheme>['colors'] }) {
  const { t } = useTranslation();
  const tier = instanceTiers.find((candidate) => candidate.instanceType === wizard.draft.instanceType);
  return (
    <Box flexDirection="column">
      <Text color={colors.success}>{t('wizard.review.title')}</Text>
      <Text color={colors.text}>{t('wizard.review.provider')}: {t('wizard.review.gcp')}</Text>
      <Text color={colors.text}>{t('wizard.review.project')}: {wizard.draft.projectId || t('wizard.hints.noProjectDetected')}</Text>
      <Text color={colors.text}>{t('wizard.review.serverName')}: {wizard.draft.serverName}</Text>
      <Text color={colors.text}>{t('wizard.review.regionZone')}: {wizard.draft.region} / {wizard.draft.zone}</Text>
      <Text color={colors.text}>{t('wizard.review.instance')}: {t(tier?.label ?? 'Instance')} · {wizard.draft.instanceType}</Text>
      {wizard.draft.projectId ? <Text dimColor>{t('wizard.hints.reviewProjectIdNote')}</Text> : null}
      <Text color={colors.warning}>{t('wizard.hints.reviewCreatesLocal')}</Text>
      <Text>{t('wizard.hints.reviewSpanish')}</Text>
      <ActionRow actions={[t(`wizard.actions.${REVIEW_ACTIONS[0]}`), t(`wizard.actions.${REVIEW_ACTIONS[1]}`)]} cursor={wizard.actionCursor} colors={colors} />
    </Box>
  );
}

function ActionRow({ actions, cursor, colors }: { actions: string[]; cursor: number; colors: ReturnType<typeof useTheme>['colors'] }) {
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
  const t = (key: string) => key; // Uses keys directly, translation happens in React renders

  if (wizard.actionCursor === 0) {
    if (step === 'provider') app.cancelCreateServerWizard();
    else app.previousWizardStep();
    return;
  }

  if (step === 'provider' && providerOptions[wizard.providerCursor]?.enabled === false) {
    app.setWizardStatusMessage(i18next.t('wizard.status.isComingSoon', { provider: providerOptions[wizard.providerCursor]?.label }));
    return;
  }

  if (step !== 'review') {
    app.nextWizardStep();
    return;
  }

  const inventory = getLocalInventoryService();
  if (!inventory) {
    app.setWizardStatusMessage(i18next.t('wizard.status.inventoryUnavailable'));
    return;
  }

  try {
    const created = createLocalDraftServer(inventory, wizard.draft);
    hydrateStoresFromInventory(inventory);
    useServersStore.getState().selectServer(created.id);
    app.resetCreateServerWizard();
    app.enterServerDashboard();
  } catch (error) {
    app.setWizardStatusMessage(error instanceof Error ? error.message : i18next.t('wizard.status.couldNotCreate'));
  }
}
