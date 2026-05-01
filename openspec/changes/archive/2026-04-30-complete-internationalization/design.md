# Design: Internacionalización Completa (ch-04)

## Technical Approach

Extracción completa de ~150 strings hardcodeados a `src/locales/{en,es}.json`, organizados por dominio funcional. Los componentes React consumen keys vía `useTranslation()`. Los helpers puros reciben `t` inyectado. Las constantes de catálogo migran a i18n keys traducidas en render. Los menús de módulo pasan a hooks localizados. Tests fijan idioma `en` antes de asserts de strings.

## Architecture Decisions

| Decision | Opción elegida | Alternativas rechazadas | Rationale |
|----------|----------------|------------------------|-----------|
| Namespaces de keys | Dominios planos: `serverDashboard.*`, `wizard.*`, `pendingChanges.*`, `serverList.*`, `layout.*`, `formatters.*`, `catalog.*`, `errors.*` | Jerarquía profunda o flat global | Facilita búsqueda, reduce colisiones, mapea 1:1 a archivos fuente |
| Helpers puros | Reciben `t` como argumento: `formatServerStatus(server, t)` | Importar `i18next.t()` internamente | Desacopla de singleton, permite uso fuera del React tree, testeable |
| Catálogo `catalog.ts` | Guardar i18n keys como strings (ej. `label: 'wizard.steps.provider'`), traducir en componente | Separar datos puros + hooks | Menor refactor en `app-store.ts` (usa longitudes/índices, no labels); `t()` se evalúa en cada render, reactivo a cambio de idioma |
| Menús de módulo | `useServerMenuItems()` hook; `SERVER_MENU_IDS` array estático para navegación | Constante de módulo con `i18next.t()` | Hooks re-renderizan al cambiar idioma; IDs estáticos evitan dependencia de i18n en lógica de navegación |
| Store (`app-store.ts`) | Usa `i18next.t()` directo para status messages | Traducir en componente | Minimiza cambios en store Zustand; mensajes son transitorios |

## Data Flow

```
Locales (en/es.json)
       ↓
React components ← useTranslation()
       ↓
Pure helpers ← t inyectado
       ↓
Catalog keys ← t en render
       ↓
Zustand store ← i18next.t() directo (status messages)
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/locales/en.json` | Modify | Agregar dominios: `serverDashboard`, `wizard`, `pendingChanges`, `serverList`, `layout`, `formatters`, `catalog`, `errors` |
| `src/locales/es.json` | Modify | Paridad exacta de keys con `en.json` |
| `src/locales/locales.test.ts` | Create | Key parity test recursivo entre `en.json` y `es.json` |
| `src/lib/formatters.ts` | Modify | `formatServerStatus()`, `formatRconExposure()`, `formatServerAction()` aceptan `t` |
| `src/screens/server-dashboard/server-dashboard-screen.tsx` | Modify | `serverMenuItems` → `useServerMenuItems()` hook; exportar `SERVER_MENU_IDS`; eliminar string hardcodeado "No hay servidor seleccionado" |
| `src/screens/main-menu/main-menu-view.tsx` | Modify | Eliminar `globalMenuItems` constante duplicada; `rightPanelTitle` pasa a i18n keys traducidas en hook |
| `src/screens/main-menu/main-menu-screen.tsx` | Modify | Usar `SERVER_MENU_IDS.length` / `GLOBAL_MENU_ITEM_IDS.length`; traducir strings de error/éxito |
| `src/screens/server-dashboard/dashboard-panels.tsx` | Modify | ~40 strings → `t()`; pasar `t` a formatters; status/validation messages con keys |
| `src/screens/create-server-wizard/create-server-wizard-screen.tsx` | Modify | ~30 strings → `t()`; traducir steps, labels, errores, review; eliminar string ES hardcodeado en review |
| `src/screens/create-server-wizard/catalog.ts` | Modify | Labels pasan a i18n keys (ej. `wizard.steps.provider`); `statusLabel` a keys |
| `src/components/pending-changes-modal.tsx` | Modify | Título, acciones, hints, impact labels, passphrase, errores → `t()` |
| `src/components/layout-shell.tsx` | Modify | Mensaje de terminal pequeña → `t('layout.terminalTooSmall')` |
| `src/screens/main-menu/server-list.tsx` | Modify | Headers de tabla → `t('serverList.columns.*')`; pasar `t` a `formatServerAction()` |
| `src/stores/app-store.ts` | Modify | Status messages hardcodeados → `i18next.t()` |
| Tests afectados (~5 archivos) | Modify | Fijar `await i18next.changeLanguage('en')` en setup; actualizar asserts de strings |

## Interfaces / Contracts

```typescript
// src/lib/formatters.ts
export function formatServerStatus(server: ServerRecord, t: TFunction): string;
export function formatRconExposure(server: ServerRecord, t: TFunction): string;
export function formatServerAction(server: ServerRecord, t: TFunction): string;

// src/screens/server-dashboard/server-dashboard-screen.tsx
export const SERVER_MENU_IDS: ServerMenuId[];
export function useServerMenuItems(): ServerMenuItem[];

// src/screens/main-menu/main-menu-view.tsx
export const GLOBAL_MENU_ITEM_IDS: GlobalMenuId[];
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Key parity `en.json` vs `es.json` | Test recursivo que falle si falta key en cualquier lado |
| Unit | Formatters con `t` inyectado | Pasar mock `t` que retorna key; verificar que no hardcodea strings |
| Integration | Components con strings user-facing | `await i18next.changeLanguage('en')` en `beforeAll`/`beforeEach`; asserts contra textos EN |
| Integration | Runtime language switch | Render con `es`, cambiar a `en` vía `changeLanguage`, re-renderizar, verificar texto cambiado |

## Migration / Rollout

Orden por área para reducir riesgo:
1. **Locales**: expandir `en.json` y `es.json` con todos los dominios nuevos.
2. **Formatters**: refactor `formatServerStatus`, `formatRconExposure`, `formatServerAction` + tests.
3. **Menús**: crear `useServerMenuItems()`, `SERVER_MENU_IDS`, eliminar `globalMenuItems`.
4. **Catalog**: cambiar labels en `catalog.ts` a keys; actualizar componentes wizard.
5. **Componentes**: `dashboard-panels`, `create-server-wizard-screen`, `pending-changes-modal`, `layout-shell`, `server-list`, `main-menu-screen`.
6. **Store**: reemplazar status messages en `app-store.ts` por `i18next.t()`.
7. **Tests**: actualizar asserts, agregar setup de idioma fijo, crear key parity test.

No-go areas: logs internos, enum values (`running`, `draft`), technical IDs (`gcp`, `aws`), cloud provider IDs, machine types (`e2-standard-2`), file paths, React keys.

## Open Questions

Ninguna bloqueante. Se asume que los status messages transitorios del `app-store` no requieren re-traducción retroactiva al cambiar idioma en runtime.
