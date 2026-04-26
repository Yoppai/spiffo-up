import { describe, expect, it } from 'bun:test';
import { calculatePendingChangesImpact, groupPendingChangesByPanel, maskSensitiveChange, sortPendingChangesByPipeline, uniquePipelineCategories, PIPELINE_ORDER } from './pending-changes.js';
import type { PendingChange } from '../types/index.js';

const changes: PendingChange[] = [
  { id: 'c1', label: 'infra', scope: 'server', category: 'infrastructure', panel: 'network', oldValue: 'a', newValue: 'b', sensitive: true, requiresVmRecreate: false },
  { id: 'c2', label: 'build', scope: 'server', category: 'build', panel: 'build', oldValue: '1', newValue: '2', requiresRestart: true },
  { id: 'c3', label: 'env', scope: 'settings', category: 'env', panel: null, oldValue: 'x', newValue: 'y' },
];

describe('pending changes helpers', () => {
  it('groups and masks sensitive changes', () => {
    expect(groupPendingChangesByPanel([...changes])).toEqual([
      { panel: 'network', changes: [{ ...changes[0]!, oldValue: '[changed]', newValue: '[changed]' }] },
      { panel: 'build', changes: [changes[1]!] },
      { panel: 'global', changes: [changes[2]!] },
    ]);
    expect(maskSensitiveChange(changes[0]!)).toMatchObject({ oldValue: '[changed]', newValue: '[changed]' });
  });

  it('summarizes impact and pipeline order', () => {
    expect(PIPELINE_ORDER).toEqual(['infrastructure', 'build', 'env', 'ini-lua']);
    expect(uniquePipelineCategories([...changes])).toEqual(['infrastructure', 'build', 'env']);
    expect(sortPendingChangesByPipeline([...changes]).map((change) => change.id)).toEqual(['c1', 'c2', 'c3']);
    expect(calculatePendingChangesImpact([...changes])).toMatchObject({ total: 3, requiresRestart: true, requiresVmRecreate: true, pipeline: ['infrastructure', 'build', 'env'] });
  });
});
