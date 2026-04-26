import type { PendingChange, PendingChangeCategory, PendingChangesByPanel, PendingChangesImpactSummary } from '../types/index.js';

export const PIPELINE_ORDER: PendingChangeCategory[] = ['infrastructure', 'build', 'env', 'ini-lua'];

export function groupPendingChangesByPanel(changes: PendingChange[]): PendingChangesByPanel[] {
  const groups = new Map<string, PendingChange[]>();

  for (const change of changes) {
    const panel = change.panel ?? 'global';
    groups.set(panel, [...(groups.get(panel) ?? []), maskSensitiveChange(change)]);
  }

  return [...groups.entries()].map(([panel, groupedChanges]) => ({ panel, changes: groupedChanges }));
}

export function countPendingChangesByPanel(changes: PendingChange[]): Record<string, number> {
  return changes.reduce<Record<string, number>>((counts, change) => {
    const panel = change.panel ?? 'global';
    counts[panel] = (counts[panel] ?? 0) + 1;
    return counts;
  }, {});
}

export function hasPendingChangesForPanel(changes: PendingChange[], panel: string): boolean {
  return changes.some((change) => change.panel === panel);
}

export function maskSensitiveChange(change: PendingChange): PendingChange {
  if (!change.sensitive) {
    return change;
  }

  return {
    ...change,
    oldValue: '[changed]',
    newValue: '[changed]',
  };
}

export function maskSensitiveChanges(changes: PendingChange[]): PendingChange[] {
  return changes.map(maskSensitiveChange);
}

export function calculatePendingChangesImpact(changes: PendingChange[]): PendingChangesImpactSummary {
  const categories = uniquePipelineCategories(changes);
  return {
    total: changes.length,
    categories,
    requiresRestart: changes.some((change) => change.requiresRestart),
    requiresVmRecreate: changes.some((change) => change.requiresVmRecreate || normalizedCategory(change) === 'infrastructure'),
    pipeline: categories,
  };
}

export function sortPendingChangesByPipeline(changes: PendingChange[]): PendingChange[] {
  return [...changes].sort((left, right) => PIPELINE_ORDER.indexOf(normalizedCategory(left)) - PIPELINE_ORDER.indexOf(normalizedCategory(right)));
}

export function uniquePipelineCategories(changes: PendingChange[]): PendingChangeCategory[] {
  const present = new Set(changes.map(normalizedCategory));
  return PIPELINE_ORDER.filter((category) => present.has(category));
}

export function normalizedCategory(change: PendingChange): PendingChangeCategory {
  return change.category ?? 'env';
}
