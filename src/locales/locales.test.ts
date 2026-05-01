import { describe, expect, it } from 'bun:test';
import es from './es.json' with { type: 'json' };
import en from './en.json' with { type: 'json' };

type LocaleDict = Record<string, unknown>;

function getKeys(obj: LocaleDict, prefix = ''): string[] {
  const keys: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      keys.push(...getKeys(v as LocaleDict, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

describe('locale parity', () => {
  it('en.json has no missing keys vs es.json', () => {
    const enKeys = new Set(getKeys(en));
    const esKeys = getKeys(es);
    const missing = esKeys.filter((k) => !enKeys.has(k));
    expect(missing).toHaveLength(0);
  });

  it('es.json has no missing keys vs en.json', () => {
    const esKeys = new Set(getKeys(es));
    const enKeys = getKeys(en);
    const missing = enKeys.filter((k) => !esKeys.has(k));
    expect(missing).toHaveLength(0);
  });

  it('all top-level domains exist in both files', () => {
    const enTop = Object.keys(en).sort();
    const esTop = Object.keys(es).sort();
    expect(enTop).toEqual(esTop);
  });
});
