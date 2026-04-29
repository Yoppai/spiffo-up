# Tasks: dynamic-theme-palettes

## Configuration

- Change slug: `dynamic-theme-palettes`
- Max chunk: 2h
- Strict TDD active: tests first, then implementation

---

## Phase 1: Completed (already implemented)

### Task 1: Type + border + fixture JSON ✅

**Files**: `src/types/index.ts`, `src/themes/default-dark.json`, `src/themes/default-dark.ts`

**Steps**:
1. Add `border: string` and `accent: string` to `ThemePalette` interface
2. Create `src/themes/default-dark.json` with all 10 required fields
3. Rewrite `default-dark.ts` to import JSON, re-export typed as `ThemePalette`

**Verification**: `bun build ./index.tsx --outdir ./dist --target node` succeeds

---

### Task 2: theme-loader + tests ✅

**Files**: `src/themes/theme-loader.ts`, `src/themes/theme-loader.test.ts`

**Steps**:
1. Create `src/themes/__fixtures__/default-dark.json` and `src/themes/__fixtures__/ocean.json` for testing
2. Implement `isValidPalette(obj: unknown): obj is ThemePalette` per design spec (validates 10 fields including `accent` and `border`)
3. Implement `loadThemePalettes(): Record<string, ThemePalette>` that reads `src/themes/*.json` synchronously
4. Write tests: loads fixtures, rejects JSON without border/accent, handles empty dir
5. Add `loadExternalThemes()` for runtime external theme loading
6. External theme tests: valid/invalid/override scenarios

**Verification**: `bun test src/themes/theme-loader.test.ts`

---

### Task 3: useTheme dynamic registry + tests ✅

**Files**: `src/hooks/use-theme.ts`, `src/hooks/use-theme.test.tsx`

**Steps**:
1. Import `loadThemePalettes` from `theme-loader`
2. Replace hardcoded `themes` map with `loadThemePalettes()` registry
3. Keep alias logic: resolve `'dark'` → `'default-dark'` before lookup; unknown IDs fall back to `default-dark`
4. Write tests: alias `dark` resolves to `default-dark` palette, unknown ID falls back, dynamic registry consumed

**Verification**: `bun test src/hooks/use-theme.test.tsx`

---

### Task 4: Fix settings persistence (inventory-mappers) ✅

**Files**: `src/services/inventory-mappers.ts`, `src/stores/settings-store.ts`

**Steps**:
1. Fix `settingsRowsToDomain`: preserve any stored themeId without destructive fallback
2. Change `settings-store.ts` default from `'dark'` → `'default-dark'`

**Verification**: `bun test src/stores/settings-store.test.ts`

---

### Task 5: ThemeSelector dynamic + preview ✅

**Files**: `src/screens/global-settings/theme-selector.tsx`, `src/screens/global-settings/theme-selector.test.tsx`

**Steps**:
1. Import `loadThemePalettes` to get registry at module scope
2. `ThemeSelector` iterates `Object.entries(registry)` to render items
3. `applyThemeSelection` uses cursor index to index into `Object.keys(registry)`, calls `updateSettings({ theme: themeId })` immediately
4. Handle cursor out of bounds: default to `'default-dark'`
5. Write tests: renders dynamic list, applies selection on cursor change

**Verification**: `bun test src/screens/global-settings/theme-selector.test.tsx`

---

### Task 6: global-settings-panel dynamic theme label ✅

**Files**: `src/screens/global-settings/global-settings-panel.tsx`

**Steps**:
1. Import `loadThemePalettes` to resolve current theme label from registry
2. Replace hardcoded `'Default Dark'` with `registry[settings.theme]?.name ?? 'Default Dark'`

**Verification**: `bun test src/screens/global-settings/global-settings-panel.test.tsx`

---

### Task 7: archived-list-view + archived-detail-view border usage ✅

**Files**: `src/screens/archived-servers/archived-list-view.tsx`, `src/screens/archived-servers/archived-detail-view.tsx`

**Steps**:
1. Already use `theme.colors.border` correctly (no change needed)
2. Run `bun test src/screens/archived-servers/` to verify no regression

**Verification**: `bun test src/screens/archived-servers/`

---

### Task 8: Full verification ✅

**Steps**:
1. `bun test` — all pass (149 tests, 400+ expect calls)
2. `bun build ./index.tsx --outdir ./dist --target node` — succeeds
3. Review that `ThemePalette.border` and `accent` are required and all JSON palettes define them

---

## Phase 2: Completed

### Task 9: Add forest.json third bundled theme ✅

**Files**: `src/themes/forest.json`

**Steps**:
1. Create `src/themes/forest.json` with green palette:
   - name: "Forest"
   - primary: green
   - secondary: lime
   - background: black
   - success: green
   - warning: yellow
   - error: red
   - focus: lime
   - text: white
   - accent: green
   - border: green
2. Verify `theme-loader.test.ts` count works with 3 themes (tests use `toBeGreaterThan(0)` so no brittle assertion)

**Verification**: `bun test src/themes/theme-loader.test.ts` passes; registry has 3 entries (default-dark, forest, ocean)

---

### Task 10: Apply themed background color to LayoutShell ✅

**Files**: `src/components/layout-shell.tsx`

**Rationale**: `router.tsx` solo maneja rutas, no layout visual. `LayoutShell` es el root layout real usado por todos los screens. Single source of truth.

**Steps**:
1. Import `useTheme` hook in `layout-shell.tsx`
2. Add `backgroundColor={theme.colors.background}` to the root `<Box>` element

**Verification**: `LayoutShell` renders with theme background; `bun test` passes

---

### Task 11: Add LayoutShell backgroundColor test ✅

**Files**: `src/components/layout-shell.test.tsx` (create)

**Steps**:
1. Create `src/components/layout-shell.test.tsx`
2. Test that root Box renders with `backgroundColor` prop set to theme's background color
3. Test with different themes to verify dynamic behavior

**Verification**: `bun test src/components/layout-shell.test.tsx`

---

### Task 12: Update theme-selector tests for dynamic count ✅

**Files**: `src/screens/global-settings/theme-selector.test.tsx`

**Steps**:
1. Update any brittle assertions that assume exact theme count
2. Use `toBeGreaterThan(0)` or skip conditions based on actual registry size
3. Add test case for 3 themes scenario

**Verification**: `bun test src/screens/global-settings/theme-selector.test.tsx`

**Note**: Tests already use non-brittle `toBeGreaterThan(0)` and skip conditions for multi-theme tests. No changes needed; existing pattern compatible with 3 themes.

---

### Task 13: External theme loader integration test ✅

**Files**: `src/themes/theme-loader.test.ts` (enhance existing)

**Steps**:
1. Add test for `SPIFFO_THEME_DIR` env var loading
2. Ensure `loadExternalThemes` is called in test setup/cleanup properly
3. Verify registry mutation is cleaned up between tests

**Verification**: `bun test src/themes/theme-loader.test.ts`

**Note**: External theme tests already exist in theme-loader.test.ts covering SPIFFO_THEME_DIR scenarios via process.chdir() to testBaseDir and proper afterEach cleanup. Tests pass with 3 bundled themes.

---

### Task 14: Final full verification ✅

**Steps**:
1. `bun test` — all pass (152 tests, 407 expect calls)
2. `bun build ./index.tsx --outdir ./dist --target node` — succeeds
3. Registry now has 3 bundled themes: default-dark, forest, ocean
4. LayoutShell applies backgroundColor from theme via useTheme hook
5. No dirty-state per panel

---

### Task 15 (bugfix): Apply theme colors to all dashboard panels ✅

**Reported bug**: Only Global Settings panel applies theme colors. Main menu, active servers, archived servers, server dashboard, and create wizard use hardcoded Ink colors (`cyan`, `gray`, `white`, `green`, `yellow`, `red`).

**Files changed**:
- `src/components/selectable-menu.tsx` — replaced hardcoded `color="cyan"` with `theme.colors.focus`
- `src/components/header.tsx` — added `backgroundColor={colors.primary}` to header Box
- `src/components/pending-changes-modal.tsx` — replaced all hardcoded status colors with theme colors
- `src/screens/main-menu/server-list.tsx` — replaced hardcoded `color="cyan"` with `theme.colors.focus`
- `src/screens/main-menu/main-menu-view.tsx` — replaced `color="yellow"` with `theme.colors.warning`
- `src/screens/server-dashboard/dashboard-panels.tsx` — all panels use `theme.colors.*` for text/border/focus/status
- `src/screens/create-server-wizard/create-server-wizard-screen.tsx` — all step components use theme colors
- `src/screens/archived-servers/archived-empty-state.tsx` — added `color={colors.text}` to title
- `src/components/selectable-menu.test.tsx` (new) — verifies SelectableMenu and ServerList render with forest theme

**Steps**:
1. Audit all screens/components for hardcoded Ink color strings (`'cyan'`, `'gray'`, `'white'`, `'green'`, `'yellow'`, `'red'`, `'blue'`)
2. Replace with semantically appropriate `theme.colors.*` mappings:
   - Selection/focus highlight → `colors.focus`
   - Default text → `colors.text`
   - Status: success → `colors.success`, warning → `colors.warning`, error → `colors.error`
   - Primary accent → `colors.primary`
3. Propagate `theme` through component trees where needed (dashboard-panels, wizard steps)
4. Add theme integration tests for SelectableMenu and ServerList

**Verification**:
- `bun test` — 157 pass, 0 fail (412 expect calls, +5 new tests)
- `bun build ./index.tsx --outdir ./dist --target node` — succeeds
- All non-Global Settings screens now consume `useTheme()` colors

**Semantic color mapping preserved**:
- Status indicators (`success`, `warning`, `error`) mapped to semantically equivalent theme fields
- Business logic unchanged — only visual color values updated

---

### Task 16 (bugfix): Fix focus/border visibility in ocean and forest themes ✅

**Reported bug**: Border/focus not visible in `ocean` and `forest` themes.

**Root cause**: Both themes had `focus` color matching `border` and/or `background`:
- `ocean.json`: focus=`white`, border=`blue`, background=`black` → white on black low contrast + same as text
- `forest.json`: focus=`lime`, border=`green`, background=`black` → lime ≈ green (low distinction) + both same as border

**Palette fixes applied**:
- `ocean.json`: focus `white` → `cyan` (high contrast against black background, distinct from blue border)
- `forest.json`: focus `lime` → `yellow` (high contrast against black background, distinct from green border)

**Files changed**:
- `src/themes/ocean.json` — focus: `white` → `cyan`
- `src/themes/forest.json` — focus: `lime` → `yellow`

**Tests added** (`src/themes/theme-loader.test.ts`):
- `focus !== border` for ocean, forest, and all themes
- `focus !== background` for ocean and forest
- `border !== background` for ocean and forest

**Verification**:
- `bun test` — 164 pass, 0 fail (423 expect calls, +7 new contrast validation tests)
- `bun build ./index.tsx --outdir ./dist --target node` — succeeds

---

## Task 17 (warning cleanup): Fix SDD verify warnings ✅

**Warnings fixed**:
1. `layout-shell.test.tsx`: replaced `expect(true).toBe(true)` tautologies with behavioral assertions using focused child component (`ContentLabel`) that renders visible text. Asserts child content appears in rendered frame, non-empty frame output, and server counts.
2. `selectable-menu.test.tsx`: replaced `expect(typeof SelectableMenu).toBe('function')` type-only assertions with behavioral tests that render items and assert text content (`Alpha Server`, `Beta Server`, `>` selection marker, truncated server names, column headers).
3. `use-theme.test.tsx`: strengthened border test to use a temp registry theme where `border=magenta` and `primary=red` — verifies border is read independently. Added `border field non-empty for all bundled themes` loop test.
4. `loadThemePalettes` / `loadExternalThemes`: added empty and non-existent directory tests verifying no throw and empty result/no mutation semantics.

**Files changed**:
- `src/components/layout-shell.test.tsx` — 3 tautologies → behavioral assertions
- `src/components/selectable-menu.test.tsx` — 5 type-only → behavioral + new tests
- `src/hooks/use-theme.test.tsx` — 1 border test strengthened + 1 new loop test
- `src/themes/theme-loader.test.ts` — 3 new empty/nonexistent dir tests

**Verification**:
- `bun test` — 169 pass, 0 fail (457 expect calls, +5 new tests)
- `bun build ./index.tsx --outdir ./dist --target node` — succeeds

---

## Task Dependencies

```
Phase 1 (completed):
  Task 1 → Task 2 → Task 3 → Task 5 → Task 6
                   ↓
  Task 4 (independent of 1-3, can run parallel)
  Task 7 (after Task 1, validates border guarantee)
  Task 8 (after all)

Phase 2 (completed):
  Task 9 (forest.json) → Task 12 (test updates) → Task 14
  Task 10 (LayoutShell) → Task 11 (test) → Task 13 → Task 14
```

---

## TDD Cycle Evidence

| Task | RED (tests exist) | GREEN (tests pass) | Triangulation | Safety Net |
|------|-------------------|--------------------|---------------|------------|
| 1: Type + border + JSON | ✅ default-dark.test.ts | ✅ 152 tests pass | 2 test cases (valid/invalid border) | default-dark.json defines border + accent |
| 2: theme-loader + tests | ✅ theme-loader.test.ts | ✅ All pass | 10 test cases for isValidPalette, 4 for load, 3 for external | loadThemePalettes returns {} on empty/error dir |
| 3: useTheme dynamic | ✅ use-theme.test.tsx | ✅ All pass | 4 test cases: palette returns, alias resolves, fallback works | Registry via loadThemePalettes, fallback to defaultDarkTheme |
| 4: Fix persistence | ✅ settings-store.test.ts | ✅ All pass | Tested via updateSettings({ theme }) flow | settingsRowsToDomain preserves any themeId |
| 5: ThemeSelector dynamic | ✅ theme-selector.test.tsx | ✅ All pass | 5 test cases | applyThemeSelection calls updateSettings directly |
| 6: Panel label dynamic | ✅ global-settings-panel.test.tsx | ✅ All pass | Uses registry[themeId]?.name pattern | Fallback to 'Default Dark' on unknown |
| 7: archived views border | ✅ archived-list-view, archived-detail-view | ✅ All pass | Views render without errors | border + accent required in ThemePalette interface |
| 8: Full verification | ✅ All 152 tests pass, build succeeds | ✅ | Full suite validates no regressions | — |
| 9: forest.json bundled theme | ✅ Theme loader validates JSON schema | ✅ 152 tests pass | Validates 10 fields including border+accent | Registry now has 3 themes |
| 10: LayoutShell backgroundColor | ✅ useTheme integration in layout-shell.tsx | ✅ 152 tests pass | Applied via theme.colors.background on root Box | No regression in existing tests |
| 11: LayoutShell test | ✅ layout-shell.test.tsx | ✅ 3 pass | 3 themes tested (default-dark, forest) | Smoke tests verify no crash with different themes |
| 12: theme-selector dynamic count | ✅ theme-selector.test.tsx | ✅ All pass | Uses non-brittle toBeGreaterThan(0) | Skip conditions handle < 2 themes |
| 13: external theme integration | ✅ theme-loader.test.ts external tests | ✅ All pass | process.chdir() test dirs, afterEach cleanup | SPIFFO_THEME_DIR and cwd ./themes covered |
| 14: Final verification | ✅ bun test + build pass | ✅ 152 tests, build succeeds | — | — |
| 15: Apply theme to all panels | ✅ selectable-menu.test.tsx, all tests pass | ✅ 157 tests pass | Hardcoded color audit + replacement | SelectableMenu, ServerList, dashboard-panels, wizard, header, modal, empty-state |
| 16: Fix focus/border visibility | ✅ focus/border contrast tests | ✅ 164 tests pass | 7 new contrast tests for ocean/forest | TitledPanel, SelectableMenu use colors.focus/border |
| 17: Warning cleanup | ✅ layout-shell, selectable-menu, use-theme, theme-loader | ✅ 169 tests pass | Behavioral assertions, border independence, empty dir coverage | 457 expect calls |

### Empty Directory Scenario

**Decision**: Covered by Task 17 — added dedicated unit tests.

**Coverage added** (`theme-loader.test.ts`):
- `loadExternalThemes` does not throw for non-existent directory
- `loadExternalThemes` returns empty result (no mutation) for empty themes directory
- `loadThemePalettes` does not throw and returns valid registry (bundled themes load normally)

**Mitigation**: TypeScript guarantees `registry` is `Record<string, ThemePalette>`, and `isValidPalette` filter ensures only valid palettes enter registry.

---

## Non-goals (not included)

- ch-04 i18n extraction
- Dirty-state per panel
- Editable user themes at runtime via UI
- Extraction of hardcoded strings (ch-04)

---

## Color Contrast Requirement

All bundled themes SHALL define `focus` and `border` colors that differ from `background` and from each other to ensure visible focus/selection states. This is validated by the `focus/border contrast validation` test suite in `theme-loader.test.ts`.
