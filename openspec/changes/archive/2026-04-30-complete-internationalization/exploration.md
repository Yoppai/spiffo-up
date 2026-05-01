# Exploration: Internacionalización Completa (ch-04)

## Current State

### i18n Infrastructure (ya implementado)
- `i18next` ^26.0.7 + `react-i18next` ^17.0.4 instalados en `package.json`
- `src/i18n/config.ts`: Inicialización con `initReactI18next`, resources ES/EN, fallback `es`
- `index.tsx`: Llama `initializeI18n(settings.locale)` antes del primer render
- `language-selector.tsx`: `i18next.changeLanguage()` + persiste a SQLite via `settings-store`
- All global layout components (Header, Footer, SystemStatus) YA usan `useTranslation()`
- All global settings components (LanguageSelector, ThemeSelector, BackupPathInput) YA usan `useTranslation()`
- All archived servers components (list, detail, empty state) YA usan `useTranslation()`

### Locales existentes
- `src/locales/en.json` — 80 lines, keys: `app`, `header`, `footer`, `systemStatus`, `menu`, `settings`, `common`, `archived.*`
- `src/locales/es.json` — 80 lines, misma estructura, traducciones ES completas para keys existentes

### Brecha crítica: componentes SIN i18n
La mayoría de los componentes con strings visibles para el usuario **no usan `useTranslation()`**. Strings hardcodeados en mezcla ES/EN.

## Affected Areas — Inventario completo de strings hardcodeados

### 1. `src/components/layout-shell.tsx`
- L42-44: `"Terminal demasiado pequeña."` / `"Agrandá la ventana para usar el dashboard de SPIFFO-UP."` — solo ES, sin key i18n
- L53: `version="1.0.0"` hardcodeado (menor, podría venir de settings)

### 2. `src/components/pending-changes-modal.tsx`
- L10-14: `actionLabels` (`'Apply All'`, `'Discard All'`, `'Back to Edit'`)
- L26: `"Apply Pending Changes"` — título del modal
- L27: `"Applied pending changes locally."` — mensaje resultado
- L30: `"Sensitive changes require session passphrase."`
- L55: `"←/→ Select · ENTER Confirm · ESC Back to Edit"` — hint de navegación

### 3. `src/screens/main-menu/main-menu-view.tsx`
- L20-23: `rightPanelTitle` hardcodeados EN: `'Create Server Wizard'`, `'Active Servers Preview'`, `'Archived Servers'`, `'Global Settings'`
- L28-32: `globalMenuItems` **constante hardcodeada** ES (solo usa `useGlobalMenuItems()` hook que sí usa `t()`)
- L46: `leftTitle="Menu"` hardcodeado EN

### 4. `src/screens/main-menu/server-list.tsx`
- L17: Header de tabla: `"NAME      │ INSTANCE TYPE  │ STATUS       │ PLAYERS │ ACCIONES"` — mezcla EN/ES, sin `t()`

### 5. `src/screens/main-menu/main-menu-screen.tsx`
- L213: `'Inventory service unavailable.'`
- L230: `'Inventory service unavailable.'`
- L238: `` `Applied ${result.impact.total} changes in ${result.steps.length} steps.` ``
- L240: `'Invalid passphrase. Back to edit or discard buffer.'`

### 6. `src/screens/server-dashboard/server-dashboard-screen.tsx` — CRÍTICO
- L12-24: `serverMenuItems` — TODOS los labels hardcodeados EN (11 items: Server Management, Provider & Region, Build, Players, Stats, Basic Settings, Advanced, Admins, Scheduler, Backups, Back to Servers)
- L41: `leftTitle={selectedServer?.name ?? 'Server'}` — fallback hardcodeado EN
- L55: `"No hay servidor seleccionado."` — solo ES

### 7. `src/screens/server-dashboard/dashboard-panels.tsx` — CRÍTICO (453 líneas, ~40+ strings hardcodeados)
- L84: `actions = ['Deploy', 'Stop'/'Start', 'Update', 'Archive']`
- L87-93: Labels `"Status:"`, `"IP:"`, `"Ports:"`, `"RCON:"`, `"Pulumi:"`, `"Branch:"`, `"Players:"` + `"GCP lifecycle boundary"`, `"Mock adapter ready"`
- L94: `"Apply All Changes ({pendingChangesCount})"`
- L96-98: Strings de confirmación: `"Confirm Deploy?"`, `"Pulumi CLI missing."`, `"Confirm Archive?"`
- L111: `"Provider: GCP MVP · AWS Coming Soon · Azure Coming Soon"`
- L112-115: Provider/Region labels hardcodeados
- L122-125: Build panel completo hardcodeado
- L133-137: Players panel completo hardcodeado
- L142-148: Stats panel completo hardcodeado
- L157-163: Advanced settings hardcodeado
- L170: Admins panel
- L177-181: Scheduler panel
- L188-191: Backups panel
- L197: FormPanel: `"Drafts local until Queue Changes"`
- L211: `PendingChangesBanner`: `` `{count} pending changes · Press Ctrl+A to apply` ``
- L359-361: `formatRconExposure()` retorna `'disabled'`, `'exposed: unsafe'`, `'exposed: restricted'`

### 8. `src/screens/create-server-wizard/create-server-wizard-screen.tsx` — CRÍTICO (~30+ strings)
- L14-16: Action labels: `PROVIDER_ACTIONS`, `STEP_ACTIONS`, `REVIEW_ACTIONS`
- L29: `leftTitle="Setup Wizard"` hardcodeado
- L112: `"ESC backs up; TAB changes panels."`
- L136: `"Select cloud provider for MVP:"` hardcodeado
- L150: `"Local detection placeholder:"` / `"No project detected"`
- L151: `"Edit project id (optional). It will be validated during future deploy."`
- L152: `"Project id:"` / `"<optional>"`
- L161: `"Name:"` / `"<required>"`
- L163: `"Use letters, numbers, spaces, dots, underscores or dashes."`
- L174: `"GCP zones by continent · latency measured/fallback"`
- L177: Region labels hardcodeados
- L190: `"Curated Project Zomboid tiers · estimated local pricing"`
- L193: Tier info strings hardcodeados
- L196: `"Recommended"`, `"Advanced catalog:"`
- L207: `"Review local server draft"`
- L208-214: Review step strings EN/ES mezclados
- L215: `"Se creará el servidor en tu inventario local..."` — solo ES
- L251: `"is Coming Soon."`
- L262: `'Inventory service unavailable. Cannot create local draft.'`
- L273: `'Could not create local draft.'`
- L307: `'Cancel Wizard focused. Press Enter to cancel.'`

### 9. `src/screens/create-server-wizard/catalog.ts`
- L5-10: `wizardSteps` labels: `'Provider'`, `'Auth/Project'`, `'Server Name'`, `'Region'`, `'Instance'`, `'Review'`
- L14-17: `providerOptions` labels/statusLabels: `'GCP'`, `'AWS'`, `'Azure'`, `'MVP enabled'`, `'Coming Soon'`

### 10. `src/lib/formatters.ts`
- L8-13: `formatServerStatus()` — mezcla EN/ES: `'🟢 RUNNING'`, `'⚠️ INICIANDO'`, `'❌ DETENIDO'`, `'❌ ERROR'`, `'📦 ARCHIVADO'`, `'📝 DRAFT'`

### 11. `src/stores/app-store.ts`
- L307: `'Cancel Wizard focused. Press Enter to cancel.'` — string de statusMessage

### Summary counts
| File | Hardcoded strings | Priority |
|------|-------------------|----------|
| `dashboard-panels.tsx` | ~40+ | 🔴 Critical |
| `create-server-wizard-screen.tsx` | ~30+ | 🔴 Critical |
| `server-dashboard-screen.tsx` | 15 | 🔴 Critical |
| `pending-changes-modal.tsx` | 8 | 🟡 High |
| `main-menu-screen.tsx` | 5 | 🟡 High |
| `layout-shell.tsx` | 3 | 🟡 High |
| `main-menu-view.tsx` | 6 | 🟡 Medium |
| `server-list.tsx` | 1 | 🟡 Medium |
| `formatters.ts` | 6 | 🟡 Medium |
| `catalog.ts` | 7 | 🟡 Medium |
| `app-store.ts` | 1 | 🟢 Low |

## Gap Analysis vs PRD/Roadmap/Spec

### spec `i18n-core` coverage
| Requirement | Status |
|-------------|--------|
| Inicialización i18n antes del render | ✅ |
| Fallback ES sin settings | ✅ |
| Leer locale de SQLite | ✅ |
| Header traducido | ✅ |
| Footer traducido | ✅ |
| System status traducido | ✅ |
| Menú global traducido | ✅ (hook OK, constante hardcodeada sobrante) |
| Global settings traducido | ✅ |
| Archived servers traducido | ✅ |
| **Dashboard panels traducidos** | ❌ No cubierto en spec |
| **Create server wizard traducido** | ❌ No cubierto en spec |
| **Server list header traducido** | ❌ No cubierto |
| **Pending changes modal traducido** | ❌ No cubierto |
| **Cambio de idioma sin reinicio** | ✅ |
| **Keys faltantes no rompen UI** | ✅ (i18next devuelve key como fallback) |

### Roadmap acceptance criteria
- `bun test` pasa con 100% de strings extraídos → **FAIL actualmente**
- `grep -r "hardcode" src/screens/ src/components/` retorna 0 → **FAIL actualmente** (muchos strings hardcodeados)
- Nota: "Locales existen pero no se usan en componentes. Requiere integrar react-i18next." → **Parcial**: componentes globales YA usan react-i18next, pero dashboard/wizard NO.

### PRD requirements
- §3.3 "i18n: i18next + react-i18next (ES/EN bilingual support)" → ✅ infraestructura, ❌ cobertura
- §Success criteria: "Internacionalización bilingüe ES/EN" → ❌ incompleto
- §2.2.1 Dashboard panels: TODO texto visible debe alinearse al idioma → ❌ no implementado

## Approach

### Approach A: Completo — extraer todos los strings de una vez (Recomendado)
Extraer TODOS los strings hardcodeados a locales en un solo cambio, organizado por dominio.
- **Pros**: Un solo cambio coherente, sin regresión de strings no traducidos, consistencia garantizada
- **Cons**: Cambio grande (afecta ~12 archivos), requiere planificación cuidadosa de keys
- **Effort**: High (~3-4 tareas de 2h)

### Approach B: Por fases — primero screens críticos, luego polish
- **Pros**: Menos riesgo por PR, entregas incrementales
- **Cons**: Strings sueltos quedan sin traducir entre fases, riesgo de mezcla ES/EN persistente
- **Effort**: Medium (pero requiere múltiples ciclos)

### Organización de keys propuesta
```
locales/
  en.json  (extender con):
    serverDashboard:
      menu.*          (Server Management, Provider & Region, ...)
      panel.status: "Status: {value}"
      panel.ip: "IP: {value}"
      panel.ports: "Ports: game {game} / query {query} / rcon {rcon}"
      ...
    wizard:
      step.*          (Provider, Auth/Project, ...)
      providerStep.*
      authStep.*
      serverNameStep.*
      regionStep.*
      instanceStep.*
      reviewStep.*
    pendingChanges:
      title: "Apply Pending Changes"
      actionApply: "Apply All"
      actionDiscard: "Discard All"
      actionBack: "Back to Edit"
      passphraseRequired: "Sensitive changes require session passphrase."
      navigationHint: "←/→ Select · ENTER Confirm · ESC Back to Edit"
    serverList:
      columnName: "Name"
      columnInstanceType: "Instance Type"
      columnStatus: "Status"
      columnPlayers: "Players"
      columnActions: "Actions"
    layout:
      tooSmall: "Terminal demasiado pequeña."
      tooSmallHint: "Agrandá la ventana para usar el dashboard de SPIFFO-UP."
      menuTitle: "Menu"
      serverFallback: "Server"
    formatters:
      statusRunning: "🟢 RUNNING"
      statusProvisioning: "⚠️ INICIANDO"
      statusStopped: "❌ DETENIDO"
      ...
    errors:
      inventoryUnavailable: "Inventory service unavailable."
      ...
    wizardCatalog:
      gcp: "GCP"
      aws: "AWS"
      azure: "Azure"
      mvpEnabled: "MVP enabled"
      comingSoon: "Coming Soon"
```

### Priorización de extracción
1. 🔴 `dashboard-panels.tsx` + `server-dashboard-screen.tsx` — mayor volumen, strings visibles en toda navegación de servidor
2. 🔴 `create-server-wizard-screen.tsx` + `catalog.ts` — strings del wizard completo
3. 🟡 `pending-changes-modal.tsx` + `main-menu-screen.tsx` — strings del modal y errores
4. 🟡 `layout-shell.tsx` + `server-list.tsx` + `main-menu-view.tsx` — strings del layout y menú
5. 🟡 `formatters.ts` + `app-store.ts` — strings de utilidades y estado

### Riesgo clave
- `formatServerStatus()` en `formatters.ts` se usa como formateador puro (no componente React). No puede usar `useTranslation()` hook directamente. Solución: Convertir a función que recibe `t()` como parámetro, o crear un wrapper componente que renderiza el status con `t()`.
- `dashboard-panels.tsx` usa funciones helper como `formatRconExposure()` fuera de componentes — mismo problema.
- `serverMenuItems` en `server-dashboard-screen.tsx` es constante de módulo, no hook — no puede usar `useTranslation()`. Solución: Convertir a hook `useServerMenuItems()` similar a `useGlobalMenuItems()`.
- `providerOptions`, `wizardSteps`, `instanceTiers` en `catalog.ts` son constantes exportadas y referenciadas desde `app-store.ts` (Zustand fuera de React tree). Necesitan alternativa: función que acepte `t()` o accesso a i18next directamente (`i18next.t()`).
- `app-store.ts` línea 307: `statusMessage` hardcodeado en store — Zustand fuera de React. Usar `i18next.t()` directamente o pasar `t` desde el handler.

## Recommendation
**Approach A — Extracción completa en un solo cambio.** El volumen es manejable (~12 archivos fuente, ~150 strings) y la organización por dominio en locales mantiene el cambio comprensible. La cobertura del spec `i18n-core` debe expandirse para cubrir dashboard panels y wizard.

## Risks
- `formatServerStatus()` y `formatRconExposure()` son funciones puras fuera del tree React — necesitan refactor para recibir `t` como parámetro
- Constantes de catálogo (`catalog.ts`) referenciadas desde Zustand store (`app-store.ts`) — no pueden usar hooks. Solución: `i18next.t()` directo en store, o pasar `t` desde el handler
- `globalMenuItems` constante hardcodeada (line 27-32 en `main-menu-view.tsx`) puede eliminarse si no la usa nadie — verificar imports
- `rightPanelTitle` en `useGlobalMenuItems()` y `serverMenuItems` son títulos de `TitledPanel` — deben traducirse
- Tests existentes verifican strings exactos (ej. `'[Ctrl+A] Apply (1)'`, `'Apply Pending Changes'`, `'Server Management •'`) — se romperán al cambiar a `t()`. Plan: actualizar tests para usar `i18next.changeLanguage('en')` antes de assert, o adaptar asserts al nuevo texto.
- `PendingChangesBanner` se usa dentro de `dashboard-panels.tsx` que no importa `useTranslation` — necesita agregar el import

## Ready for Proposal
Yes. Next SDD phase: sdd-propose.

### Next steps for orchestrator
1. **sdd-propose**: Crear proposal con alcance detallado y non-goals
2. **sdd-spec**: Expandir spec `i18n-core` para cubrir dashboard panels, wizard, modal, etc.
3. **sdd-design**: Diseñar estrategia de keys, resolver el problema de funciones puras vs hooks
4. **sdd-tasks**: Dividir en tareas de ~2h por archivo/grupo de archivos
5. **sdd-apply**: Implementar tareas
6. **sdd-verify**: Verificar grep 0 hardcoded strings + tests pasan
