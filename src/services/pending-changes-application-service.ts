import type { LocalInventoryService } from './local-inventory-service.js';
import type { PendingChange, PendingChangeApplyResult, PendingChangeApplyStep } from '../types/index.js';
import { calculatePendingChangesImpact, sortPendingChangesByPipeline, uniquePipelineCategories } from '../lib/pending-changes.js';
import { decryptPendingSecret } from '../lib/pending-change-crypto.js';
import type { usePendingChangesStore } from '../stores/pending-changes-store.js';
import { ServerLifecycleService } from './server-lifecycle-service.js';

type PendingChangesStoreApi = ReturnType<typeof usePendingChangesStore.getState>;

interface ApplyPendingChangesInput {
  changes: PendingChange[];
  passphrase?: string;
}

export class PendingChangesApplicationService {
  constructor(
    private readonly inventory: LocalInventoryService,
    private readonly pendingStore: Pick<PendingChangesStoreApi, 'clearChanges' | 'discardAll' | 'unlockSecretSession' | 'lockSecretSession'>,
    private readonly lifecycle: Pick<ServerLifecycleService, 'applyInfrastructureChanges'> | null = null,
  ) {}

  applyAll(input: ApplyPendingChangesInput): PendingChangeApplyResult {
    const orderedChanges = sortPendingChangesByPipeline(input.changes);
    const decryptedSecrets = decryptSensitiveChangesAtBoundary(orderedChanges, input.passphrase);
    const result: PendingChangeApplyResult = {
      applied: true,
      steps: planPendingChangeSteps(orderedChanges).map((step) => ({ ...step, status: 'applied' })),
      impact: calculatePendingChangesImpact(orderedChanges),
      decryptedSecrets,
    };

    this.inventory.clearPendingChanges();
    this.pendingStore.clearChanges();
    this.pendingStore.lockSecretSession();
    return result;
  }

  async applyAllAsync(input: ApplyPendingChangesInput): Promise<PendingChangeApplyResult> {
    const orderedChanges = sortPendingChangesByPipeline(input.changes);
    const decryptedSecrets = decryptSensitiveChangesAtBoundary(orderedChanges, input.passphrase);
    const infrastructureChanges = orderedChanges.filter((change) => (change.category ?? 'env') === 'infrastructure');
    if (infrastructureChanges.length > 0) {
      await (this.lifecycle ?? new ServerLifecycleService(this.inventory)).applyInfrastructureChanges(infrastructureChanges);
    }
    const result: PendingChangeApplyResult = {
      applied: true,
      steps: planPendingChangeSteps(orderedChanges).map((step) => ({ ...step, status: 'applied', label: step.category === 'infrastructure' ? 'Apply infrastructure changes via lifecycle service' : step.label })),
      impact: calculatePendingChangesImpact(orderedChanges),
      decryptedSecrets,
    };

    this.inventory.clearPendingChanges();
    this.pendingStore.clearChanges();
    this.pendingStore.lockSecretSession();
    return result;
  }

  discardAll(): void {
    this.inventory.clearPendingChanges();
    this.pendingStore.discardAll();
    this.pendingStore.lockSecretSession();
  }
}

export function planPendingChangeSteps(changes: PendingChange[]): PendingChangeApplyStep[] {
  const orderedChanges = sortPendingChangesByPipeline(changes);
  return uniquePipelineCategories(orderedChanges).map((category) => ({
    category,
    changeIds: orderedChanges.filter((change) => (change.category ?? 'env') === category).map((change) => change.id),
    label: `Apply ${category} changes locally`,
    status: 'planned',
  }));
}

function decryptSensitiveChangesAtBoundary(changes: PendingChange[], passphrase?: string): number {
  let decrypted = 0;

  for (const change of changes) {
    if (!change.sensitive || !change.encryptedValue) {
      if (change.sensitive) {
        throw new PendingChangeMissingEncryptedPayloadError(change.id);
      }
      continue;
    }

    decryptPendingSecret(change.encryptedValue, passphrase ?? '');
    decrypted += 1;
  }

  return decrypted;
}

export class PendingChangeMissingEncryptedPayloadError extends Error {
  constructor(changeId: string) {
    super(`Sensitive pending change ${changeId} is missing encrypted payload`);
    this.name = 'PendingChangeMissingEncryptedPayloadError';
  }
}
